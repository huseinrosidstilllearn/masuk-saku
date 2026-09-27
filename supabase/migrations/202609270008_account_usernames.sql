-- Global login handles are private; household display names remain separate.
create table private.account_usernames (
 user_id uuid primary key references auth.users(id) on delete cascade,
 username text not null unique check(username ~ '^[a-z0-9][a-z0-9_]{2,29}$'),
 updated_at timestamptz not null default now()
);
alter table private.account_usernames enable row level security;
revoke all on private.account_usernames from public, anon, authenticated;

create function private.claim_signup_username() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if new.raw_user_meta_data ? 'username' then
  insert into private.account_usernames(user_id,username)
  values(new.id,lower(btrim(new.raw_user_meta_data->>'username')));
 end if;
 return new;
end $$;
revoke all on function private.claim_signup_username() from public,anon,authenticated;
create trigger claim_signup_username after insert on auth.users
for each row execute function private.claim_signup_username();

create function public.get_my_username() returns text
language sql stable security definer set search_path='' as $$
 select username from private.account_usernames where user_id=auth.uid()
$$;
create function public.set_my_username(p_username text) returns text
language plpgsql security definer set search_path='' as $$
declare u uuid:=auth.uid(); n text:=lower(btrim(p_username));
begin
 if u is null then raise exception 'Authentication required'; end if;
 if n is null or n !~ '^[a-z0-9][a-z0-9_]{2,29}$' then
  raise exception 'Username must be 3-30 letters, digits or underscores';
 end if;
 insert into private.account_usernames(user_id,username) values(u,n)
 on conflict(user_id) do update set username=excluded.username,updated_at=now();
 return n;
exception when unique_violation then raise exception 'Username already in use';
end $$;
revoke all on function public.get_my_username(),public.set_my_username(text) from public,anon;
grant execute on function public.get_my_username(),public.set_my_username(text) to authenticated;

-- Always resolve the CURRENT Auth email, never metadata or a browser-accessible map.
create function public.resolve_username_email(p_username text) returns text
language sql stable security definer set search_path='' as $$
 select u.email from private.account_usernames n join auth.users u on u.id=n.user_id
 where n.username=lower(btrim(p_username))
$$;
revoke all on function public.resolve_username_email(text) from public,anon,authenticated;
grant execute on function public.resolve_username_email(text) to service_role;

create table private.username_login_limits (
 key text not null, bucket timestamptz not null, count integer not null,
 primary key(key,bucket)
);
alter table private.username_login_limits enable row level security;
revoke all on private.username_login_limits from public,anon,authenticated;
create function public.consume_username_login_quota(p_key text) returns boolean
language plpgsql security definer set search_path='' as $$
declare b timestamptz:=date_bin(interval '10 minutes',now(),'2000-01-01'::timestamptz);
 n integer; g integer;
begin
 if p_key !~ '^[a-f0-9]{64}$' or p_key is null then return false; end if;
 delete from private.username_login_limits where bucket<now()-interval '1 day';
 -- Consistent lock order; bounded counters. No passwords or plain identifiers stored.
 insert into private.username_login_limits values('global',b,1)
 on conflict(key,bucket) do update set count=least(private.username_login_limits.count+1,1001)
 returning count into g;
 if g>1000 then return false; end if;
 insert into private.username_login_limits values(p_key,b,1)
 on conflict(key,bucket) do update set count=least(private.username_login_limits.count+1,11)
 returning count into n;
 return n<=10 and g<=1000;
end $$;
revoke all on function public.consume_username_login_quota(text) from public,anon,authenticated;
grant execute on function public.consume_username_login_quota(text) to service_role;
