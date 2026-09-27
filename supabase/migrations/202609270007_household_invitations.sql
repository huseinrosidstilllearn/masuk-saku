-- Invite codes never enter public tables, URLs, logs or provider prompts.
create table private.household_invitations (
 id uuid primary key, household_id uuid not null references public.households on delete cascade,
 email text not null check(length(email) between 3 and 254), token_hash text not null unique,
 created_by uuid not null references auth.users(id), created_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '7 days',
 accepted_by uuid references auth.users(id), accepted_at timestamptz, revoked_at timestamptz
);
create index invitations_household on private.household_invitations(household_id);
revoke all on private.household_invitations from public,anon,authenticated;

create function public.create_household_invitation(p_household uuid,p_email text,p_id uuid,p_token text)
 returns uuid language plpgsql security definer set search_path='' as $$
declare recipient text:=lower(trim(p_email)); old private.household_invitations%rowtype;
begin
 if not private.is_owner(p_household) then raise exception 'Owner required'; end if;
 if recipient is null or length(recipient) not between 3 and 254 or recipient !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
 or p_id is null or p_token is null or p_token !~ '^[a-f0-9]{64}$' then raise exception 'invalid invitation'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_household::text,7));
 select * into old from private.household_invitations where id=p_id;
 if found then
  if old.household_id=p_household and old.email=recipient and old.created_by=auth.uid()
   and old.token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') and old.revoked_at is null and old.accepted_at is null and old.expires_at>now() then return old.id; end if;
  raise exception 'invitation retry conflict';
 end if;
 if exists(select 1 from auth.users u join public.household_members m on m.user_id=u.id where m.household_id=p_household and lower(u.email)=recipient) then raise exception 'recipient is already a member'; end if;
 if exists(select 1 from private.household_invitations where household_id=p_household and email=recipient and revoked_at is null and accepted_at is null and expires_at>now()) then raise exception 'active invitation already exists'; end if;
 if (select count(*) from private.household_invitations where household_id=p_household and revoked_at is null and accepted_at is null and expires_at>now())>=20 then raise exception 'maximum20 active invitations'; end if;
 insert into private.household_invitations(id,household_id,email,token_hash,created_by)
 values(p_id,p_household,recipient,encode(sha256(convert_to(p_token,'UTF8')),'hex'),auth.uid());
 insert into public.activity_log(household_id,actor_id,entity_type,entity_id,action) values(p_household,auth.uid(),'household_invitation',p_id,'create');
 return p_id;
end $$;

create function public.list_household_invitations(p_household uuid)
 returns table(id uuid,email text,created_at timestamptz,expires_at timestamptz,status text)
 language plpgsql security definer set search_path='' as $$
begin
 if not private.is_owner(p_household) then raise exception 'Owner required'; end if;
 return query select i.id,i.email,i.created_at,i.expires_at,
  case when i.revoked_at is not null then 'revoked' when i.accepted_at is not null then 'accepted' when i.expires_at<=now() then 'expired' else 'pending' end
 from private.household_invitations i where i.household_id=p_household order by i.created_at desc limit 100;
end $$;

create function public.revoke_household_invitation(p_id uuid) returns void
 language plpgsql security definer set search_path='' as $$
declare invitation private.household_invitations%rowtype;
begin
 select * into invitation from private.household_invitations where id=p_id for update;
 if not found or not private.is_owner(invitation.household_id) then raise exception 'invitation access denied'; end if;
 if invitation.accepted_at is not null then raise exception 'invitation already accepted'; end if;
 if invitation.revoked_at is null then
  update private.household_invitations set revoked_at=now() where id=p_id;
  insert into public.activity_log(household_id,actor_id,entity_type,entity_id,action) values(invitation.household_id,auth.uid(),'household_invitation',p_id,'revoke');
 end if;
end $$;

create function public.accept_household_invitation(p_token text,p_display_name text) returns uuid
 language plpgsql security definer set search_path='' as $$
declare invitation private.household_invitations%rowtype; recipient text;
begin
 if auth.uid() is null then raise exception 'authentication required'; end if;
 if p_token is null or p_token !~ '^[a-f0-9]{64}$' then raise exception 'invalid or unavailable invitation'; end if;
 if p_display_name is null or length(trim(p_display_name)) not between 1 and 100 then raise exception 'display name required'; end if;
 select lower(email) into recipient from auth.users where id=auth.uid() and email_confirmed_at is not null;
 if recipient is null then raise exception 'verified email required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(auth.uid()::text,7));
 select * into invitation from private.household_invitations where token_hash=encode(sha256(convert_to(p_token,'UTF8')),'hex') for update;
 if not found or invitation.email<>recipient then raise exception 'invalid or unavailable invitation'; end if;
 if invitation.accepted_by=auth.uid() and exists(select 1 from public.household_members where household_id=invitation.household_id and user_id=auth.uid()) then return invitation.household_id; end if;
 if invitation.revoked_at is not null or invitation.accepted_at is not null or invitation.expires_at<=now() then raise exception 'invalid or unavailable invitation'; end if;
 if exists(select 1 from public.household_members where user_id=auth.uid()) then raise exception 'account already belongs to a household'; end if;
 insert into public.household_members(household_id,user_id,role,display_name) values(invitation.household_id,auth.uid(),'member',trim(p_display_name));
 update private.household_invitations set accepted_by=auth.uid(),accepted_at=now() where id=invitation.id;
 insert into public.activity_log(household_id,actor_id,entity_type,entity_id,action) values(invitation.household_id,auth.uid(),'household_invitation',invitation.id,'accept');
 return invitation.household_id;
end $$;

revoke execute on function public.create_household_invitation(uuid,text,uuid,text),public.list_household_invitations(uuid),public.revoke_household_invitation(uuid),public.accept_household_invitation(text,text) from public,anon;
grant execute on function public.create_household_invitation(uuid,text,uuid,text),public.list_household_invitations(uuid),public.revoke_household_invitation(uuid),public.accept_household_invitation(text,text) to authenticated;
