BEGIN;
-- IDR whole rupiah. Tenant IDs are repeated intentionally for composite FKs.
create schema if not exists private;
create table public.households (
 id uuid primary key default gen_random_uuid(), name text not null check(length(name) between 1 and 100),
 created_by uuid not null references auth.users(id), currency text not null default 'IDR' check(currency='IDR'),
 attachment_retention text not null default '24h' check(attachment_retention in ('immediate','24h','7d','keep')),
 session_lock_minutes integer not null default 15 check(session_lock_minutes between 5 and 60),
 created_at timestamptz not null default now()
);
create table public.household_members (
 household_id uuid not null references public.households on delete cascade,
 user_id uuid not null references auth.users, role text not null check(role in ('owner','member')),
 display_name text not null check(length(display_name) between 1 and 100),
 primary key(household_id,user_id)
);
create unique index one_owner_per_household on public.household_members(household_id) where role='owner';
create table public.wallets (
 id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households,
 name text not null check(length(name) between 1 and 100), type text not null check(type in ('cash','bank','e_wallet')),
 ownership text not null check(ownership in ('personal','shared')), wallet_owner uuid,
 initial_balance bigint not null default 0 check(abs(initial_balance)<=9000000000000),
 currency text not null default 'IDR' check(currency='IDR'), active boolean not null default true,
 icon text not null default 'wallet', color text not null default '#164c3e', account_identifier text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(household_id,id), foreign key(household_id,wallet_owner) references public.household_members(household_id,user_id),
 check((ownership='personal' and wallet_owner is not null) or (ownership='shared' and wallet_owner is null))
);
create table public.categories (
 id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households,
 name text not null check(length(name) between 1 and 100), kind text not null default 'expense' check(kind in ('income','expense','both')),
 parent_id uuid, color text not null default '#86b49c', icon text not null default 'tag', sort_order integer not null default 0,
 unique(household_id,id), foreign key(household_id,parent_id) references public.categories(household_id,id), check(parent_id is distinct from id)
);
create table public.tags (
 id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households,
 name text not null check(length(name) between 1 and 60), unique(household_id,id), unique(household_id,name)
);
create table public.recurring_templates (
 id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households,
 name text not null, created_by uuid not null, mode text not null check(mode in ('auto_create','ask')),
 cadence text not null check(cadence in ('weekly','monthly')), next_run date not null, end_date date, active boolean not null default true,
 transaction_template jsonb not null, unique(household_id,id),
 foreign key(household_id,created_by) references public.household_members(household_id,user_id)
);
create table public.transactions (
 id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households,
 type text not null check(type in ('income','expense','transfer')), amount bigint not null check(amount between 1 and 9000000000000),
 currency text not null default 'IDR' check(currency='IDR'), wallet_id uuid not null, destination_wallet_id uuid,
 transaction_actor uuid not null, transaction_scope text not null check(transaction_scope in ('personal','family')), scope_member_id uuid,
 status text not null default 'completed' check(status in ('pending','completed','cancelled')), occurred_at timestamptz not null,
 category_id uuid, merchant text not null default '' check(length(merchant)<=200), notes text not null default '' check(length(notes)<=2000),
 parent_transaction_id uuid, recurring_template_id uuid, source text not null default 'manual' check(source in ('manual','quick_add','ai','recurring')),
 created_by uuid not null, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 deleted_at timestamptz, deleted_by uuid references auth.users(id), version integer not null default 1,
 request_key uuid, request_payload jsonb, unique(household_id,id), unique(household_id,request_key),
 foreign key(household_id,wallet_id) references public.wallets(household_id,id),
 foreign key(household_id,destination_wallet_id) references public.wallets(household_id,id),
 foreign key(household_id,transaction_actor) references public.household_members(household_id,user_id),
 foreign key(household_id,scope_member_id) references public.household_members(household_id,user_id),
 foreign key(household_id,created_by) references public.household_members(household_id,user_id),
 foreign key(household_id,category_id) references public.categories(household_id,id),
 foreign key(household_id,parent_transaction_id) references public.transactions(household_id,id) on delete cascade,
 foreign key(household_id,recurring_template_id) references public.recurring_templates(household_id,id),
 check((type='transfer' and destination_wallet_id is not null and destination_wallet_id<>wallet_id) or (type<>'transfer' and destination_wallet_id is null)),
 check((transaction_scope='personal' and scope_member_id is not null) or (transaction_scope='family' and scope_member_id is null)),
 check(parent_transaction_id is null or type='expense')
);
create index transactions_household_date on public.transactions(household_id,occurred_at desc);
create index transactions_trash on public.transactions(deleted_at) where deleted_at is not null;
create index transactions_wallet on public.transactions(household_id,wallet_id);
create table public.transaction_splits (
 transaction_id uuid not null, household_id uuid not null, category_id uuid not null,
 amount bigint not null check(amount between 1 and 9000000000000), primary key(transaction_id,category_id),
 foreign key(household_id,transaction_id) references public.transactions(household_id,id) on delete cascade,
 foreign key(household_id,category_id) references public.categories(household_id,id)
);
create table public.transaction_tags (
 transaction_id uuid not null, household_id uuid not null, tag_id uuid not null, primary key(transaction_id,tag_id),
 foreign key(household_id,transaction_id) references public.transactions(household_id,id) on delete cascade,
 foreign key(household_id,tag_id) references public.tags(household_id,id)
);
create table public.budgets (
 id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households,
 name text not null, category_id uuid, wallet_id uuid, amount bigint not null check(amount between 1 and 9000000000000),
 start_date date not null, end_date date not null, rollover text not null default 'reset' check(rollover in ('reset','rollover')),
 rollover_amount bigint not null default 0 check(rollover_amount between 0 and 9000000000000),
 warning_thresholds integer[] not null default array[75,90,100], unique(household_id,id),
 foreign key(household_id,category_id) references public.categories(household_id,id),
 foreign key(household_id,wallet_id) references public.wallets(household_id,id), check(end_date>=start_date),
 check(cardinality(warning_thresholds) between 1 and 10 and 0<all(warning_thresholds) and 100>=all(warning_thresholds))
);
create table public.savings_goals (
 id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households,
 title text not null, target_amount bigint not null check(target_amount between 1 and 9000000000000), deadline date,
 notes text not null default '', status text not null default 'active' check(status in ('active','completed','archived')), unique(household_id,id)
);
create table public.goal_contributions (
 id uuid primary key default gen_random_uuid(), household_id uuid not null, goal_id uuid not null,
 amount bigint not null check(amount between 1 and 9000000000000), created_by uuid not null default auth.uid(),
 contributed_at timestamptz not null default now(),
 foreign key(household_id,goal_id) references public.savings_goals(household_id,id) on delete cascade,
 foreign key(household_id,created_by) references public.household_members(household_id,user_id)
);
create table public.member_preferences (
 household_id uuid not null, user_id uuid not null default auth.uid(), dashboard_layout jsonb not null default '[]', hide_balance boolean not null default false,
 primary key(household_id,user_id), foreign key(household_id,user_id) references public.household_members(household_id,user_id)
);
create table public.ai_drafts (
 id uuid primary key default gen_random_uuid(), household_id uuid not null, created_by uuid not null,
 candidate jsonb not null, confidence jsonb not null, status text not null default 'preview' check(status in ('preview','confirmed','expired')),
 transaction_id uuid, created_at timestamptz not null default now(), confirmed_at timestamptz,
 expires_at timestamptz not null default now()+interval '24 hours', unique(household_id,id),
 foreign key(household_id,created_by) references public.household_members(household_id,user_id),
 foreign key(household_id,transaction_id) references public.transactions(household_id,id) on delete set null (transaction_id)
);
create table public.attachments (
 id uuid primary key default gen_random_uuid(), household_id uuid not null, created_by uuid not null,
 draft_id uuid, transaction_id uuid, object_path text not null unique, mime_type text not null, size_bytes bigint not null check(size_bytes between 1 and 10485760),
 retention text not null default '24h' check(retention in ('immediate','24h','7d','keep')), created_at timestamptz not null default now(),
 confirmed_at timestamptz, expires_at timestamptz default now()+interval '24 hours', removed_at timestamptz,
 foreign key(household_id,created_by) references public.household_members(household_id,user_id),
 foreign key(household_id,draft_id) references public.ai_drafts(household_id,id) on delete set null (draft_id),
 foreign key(household_id,transaction_id) references public.transactions(household_id,id) on delete set null (transaction_id)
);
create index attachments_expiry on public.attachments(expires_at) where removed_at is null;
create table public.activity_log (
 id bigint generated always as identity primary key, household_id uuid not null references public.households,
 actor_id uuid, entity_type text not null, entity_id uuid, action text not null, created_at timestamptz not null default now()
);
create table private.ai_credentials (
 household_id uuid not null references public.households, user_id uuid not null references auth.users,
 provider text not null default 'openai' check(provider='openai'), ciphertext text not null, iv text not null, key_version integer not null default 1,
 model text not null default 'gpt-4.1-mini', updated_at timestamptz not null default now(), primary key(household_id,user_id)
);
create table private.ai_rate_limits (
 user_id uuid not null references auth.users, bucket timestamptz not null, count integer not null default 0, primary key(user_id,bucket)
);
create view public.wallet_balances with (security_invoker=true) as
 select w.*, (w.initial_balance + coalesce((select sum(case when t.wallet_id=w.id then case when t.type='income' then t.amount else -t.amount end else 0 end + case when t.type='transfer' and t.destination_wallet_id=w.id then t.amount else 0 end) from public.transactions t where t.household_id=w.household_id and (t.wallet_id=w.id or t.destination_wallet_id=w.id) and t.status='completed' and t.deleted_at is null),0))::bigint as current_balance from public.wallets w;

create function private.is_member(h uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.household_members where household_id=h and user_id=auth.uid())
$$;
create function private.is_owner(h uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.household_members where household_id=h and user_id=auth.uid() and role='owner')
$$;
-- Roles never come from caller-editable user metadata.
do $$ declare t text; begin
 foreach t in array array['households','household_members','wallets','categories','tags','recurring_templates','transactions','transaction_splits','transaction_tags','budgets','savings_goals','goal_contributions','member_preferences','ai_drafts','attachments','activity_log'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from anon, authenticated',t);
  execute format('grant select on public.%I to authenticated',t);
  if t not in ('households','ai_drafts','member_preferences') then
   execute format('create policy tenant_read on public.%I for select to authenticated using (private.is_member(household_id))',t);
  end if;
 end loop;
end $$;
create policy draft_read on public.ai_drafts for select to authenticated using(created_by=auth.uid() and private.is_member(household_id));
drop policy tenant_read on public.activity_log;
create policy owner_audit_read on public.activity_log for select to authenticated using(private.is_owner(household_id));
drop policy tenant_read on public.attachments;
create policy attachment_metadata_read on public.attachments for select to authenticated using(private.is_member(household_id) and (confirmed_at is not null or created_by=auth.uid()));
create policy preference_self on public.member_preferences for all to authenticated using(user_id=auth.uid() and private.is_member(household_id)) with check(user_id=auth.uid() and private.is_member(household_id));
grant insert,update,delete on public.member_preferences to authenticated;
create policy household_owner_update on public.households for update to authenticated using(private.is_owner(id)) with check(private.is_owner(id));
-- households use id, not household_id: replace generated generic read policy.
create policy household_read on public.households for select to authenticated using(private.is_member(id));
grant update(name,attachment_retention,session_lock_minutes) on public.households to authenticated;
create policy wallet_owner_write on public.wallets for all to authenticated using(private.is_owner(household_id)) with check(private.is_owner(household_id));
grant insert,update on public.wallets to authenticated;
do $$ declare t text; begin
 foreach t in array array['categories','tags','budgets','savings_goals','recurring_templates'] loop
  execute format('create policy member_write on public.%I for all to authenticated using(private.is_member(household_id)) with check(private.is_member(household_id))',t);
  execute format('grant insert,update,delete on public.%I to authenticated',t);
 end loop;
end $$;
create policy contribution_insert on public.goal_contributions for insert to authenticated with check(private.is_member(household_id) and created_by=auth.uid());
create policy contribution_delete on public.goal_contributions for delete to authenticated using(private.is_owner(household_id) or created_by=auth.uid());
grant insert,delete on public.goal_contributions to authenticated;
grant select on public.wallet_balances to authenticated;
grant usage on schema private to authenticated;
grant execute on function private.is_member(uuid), private.is_owner(uuid) to authenticated;
revoke all on private.ai_credentials,private.ai_rate_limits from public,anon,authenticated;
grant usage on schema private to service_role;
grant all on private.ai_credentials,private.ai_rate_limits to service_role;
grant all on all tables in schema public to service_role;
grant usage,select on all sequences in schema public to service_role;

create function private.category_depth_guard() returns trigger language plpgsql set search_path='' as $$
begin
 if new.parent_id is not null and (
  exists(select 1 from public.categories where id=new.parent_id and parent_id is not null)
  or exists(select 1 from public.categories where parent_id=new.id)
 ) then raise exception 'only one subcategory level allowed'; end if;
 return new;
end $$;
create trigger category_depth before insert or update on public.categories for each row execute function private.category_depth_guard();
create function private.audit_change() returns trigger language plpgsql security definer set search_path='' as $$
declare obj jsonb; action_name text;
begin
 obj:=case when tg_op='DELETE' then to_jsonb(old) else to_jsonb(new) end;
 action_name:=lower(tg_op);
 if tg_table_name='transactions' and tg_op='UPDATE' then
  if old.deleted_at is null and new.deleted_at is not null then action_name:='trash';
  elsif old.deleted_at is not null and new.deleted_at is null then action_name:='restore'; end if;
 end if;
 insert into public.activity_log(household_id,actor_id,entity_type,entity_id,action)
 values((obj->>'household_id')::uuid,auth.uid(),tg_table_name,(obj->>'id')::uuid,action_name);
 return case when tg_op='DELETE' then old else new end;
end $$;
do $$ declare t text; begin
 foreach t in array array['wallets','transactions','budgets','savings_goals','goal_contributions','categories','tags'] loop
  execute format('create trigger audit_change after insert or update or delete on public.%I for each row execute function private.audit_change()',t);
 end loop;
end $$;

create function public.create_household(p_name text,p_display_name text) returns uuid language plpgsql security definer set search_path='' as $$
declare h uuid;
begin
 if auth.uid() is null then raise exception 'authentication required'; end if;
 insert into public.households(name,created_by) values(trim(p_name),auth.uid()) returning id into h;
 insert into public.household_members(household_id,user_id,role,display_name) values(h,auth.uid(),'owner',trim(p_display_name));
 insert into public.categories(household_id,name,kind,sort_order)
 select h,x.name,x.kind,x.ord from (values
 ('Makanan','expense',1),('Transportasi','expense',2),('Belanja','expense',3),('Tagihan','expense',4),
 ('Hiburan','expense',5),('Kesehatan','expense',6),('Pendidikan','expense',7),('Rumah Tangga','expense',8),
 ('Sedekah','expense',9),('Pekerjaan','income',10),('Lainnya','both',11),('Admin','expense',12)
 ) as x(name,kind,ord);
 return h;
end $$;

create function public.create_transaction(p_input jsonb,p_request_key uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare
 h uuid:=(p_input->>'household_id')::uuid; wid uuid:=(p_input->>'wallet_id')::uuid;
 dest uuid:=nullif(p_input->>'destination_wallet_id','')::uuid;
 actor uuid:=coalesce(nullif(p_input->>'transaction_actor','')::uuid,auth.uid());
 kind text:=p_input->>'type'; state text:=coalesce(p_input->>'status','completed');
 scope text:=coalesce(p_input->>'transaction_scope','family'); scope_user uuid:=nullif(p_input->>'scope_member_id','')::uuid;
 nominal bigint; fee bigint:=0; tid uuid; existing public.transactions%rowtype; item jsonb; split_total bigint:=0;
begin
 if not private.is_member(h) then raise exception 'household access denied'; end if;
 if p_request_key is null then raise exception 'idempotency request key required'; end if;
 if coalesce(p_input->>'amount','') !~ '^[0-9]+$' then raise exception 'whole rupiah amount required'; end if;
 nominal:=(p_input->>'amount')::bigint;
 if nominal not between 1 and 9000000000000 then raise exception 'invalid amount'; end if;
 if p_input ? 'fee_amount' then
  if (p_input->>'fee_amount') !~ '^[0-9]+$' then raise exception 'invalid fee'; end if;
  fee:=(p_input->>'fee_amount')::bigint;
 end if;
 if fee not between 0 and 9000000000000 or (fee>0 and kind<>'transfer') then raise exception 'invalid fee'; end if;
 if not exists(select 1 from public.wallets where household_id=h and id=wid and active)
 or (kind='transfer' and not exists(select 1 from public.wallets where household_id=h and id=dest and active))
 then raise exception 'active household wallet required'; end if;
 if coalesce(p_input->>'source','manual') not in ('manual','quick_add') then raise exception 'use confirmation flow for AI'; end if;
 perform pg_advisory_xact_lock(hashtextextended(h::text||p_request_key::text,0));
 select * into existing from public.transactions where household_id=h and request_key=p_request_key;
 if found then
  if existing.created_by<>auth.uid() or existing.request_payload<>p_input then raise exception 'idempotency payload mismatch'; end if;
  return existing.id;
 end if;
 if p_input ? 'splits' then
  if jsonb_typeof(p_input->'splits')<>'array' then raise exception 'split array required'; end if;
  for item in select value from jsonb_array_elements(p_input->'splits') loop
   if (item->>'amount') !~ '^[0-9]+$' or (item->>'amount')::bigint<=0 then raise exception 'invalid split'; end if;
   split_total:=split_total+(item->>'amount')::bigint;
  end loop;
  if jsonb_array_length(p_input->'splits')>0 and (split_total<>nominal or kind='transfer') then raise exception 'split sum must match amount'; end if;
 end if;
 insert into public.transactions(household_id,type,amount,wallet_id,destination_wallet_id,transaction_actor,transaction_scope,scope_member_id,
 status,occurred_at,category_id,merchant,notes,created_by,source,request_key,request_payload)
 values(h,kind,nominal,wid,dest,actor,scope,scope_user,state,(p_input->>'occurred_at')::timestamptz,
 nullif(p_input->>'category_id','')::uuid,coalesce(p_input->>'merchant',''),coalesce(p_input->>'notes',''),auth.uid(),
 coalesce(p_input->>'source','manual'),p_request_key,p_input) returning id into tid;
 if fee>0 then
  insert into public.transactions(household_id,type,amount,wallet_id,transaction_actor,transaction_scope,scope_member_id,status,occurred_at,
  category_id,merchant,created_by,parent_transaction_id)
  values(h,'expense',fee,wid,actor,scope,scope_user,state,(p_input->>'occurred_at')::timestamptz,
  (select id from public.categories where household_id=h and name='Admin' order by id limit 1),'Biaya admin',auth.uid(),tid);
 end if;
 for item in select value from jsonb_array_elements(coalesce(p_input->'splits','[]'::jsonb)) loop
  insert into public.transaction_splits(transaction_id,household_id,category_id,amount)
  values(tid,h,(item->>'category_id')::uuid,(item->>'amount')::bigint);
 end loop;
 for item in select value from jsonb_array_elements(coalesce(p_input->'tag_ids','[]'::jsonb)) loop
  insert into public.transaction_tags(transaction_id,household_id,tag_id) values(tid,h,trim(both '"' from item::text)::uuid);
 end loop;
 return tid;
end $$;

create function public.trash_transaction(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare t public.transactions%rowtype;
begin
 select * into t from public.transactions where id=p_id for update;
 if not found or not private.is_member(t.household_id) then raise exception 'transaction access denied'; end if;
 if t.parent_transaction_id is not null then raise exception 'trash parent transfer instead'; end if;
 if t.created_by<>auth.uid() and not private.is_owner(t.household_id) then raise exception 'only creator or Owner may delete'; end if;
 update public.transactions set deleted_at=now(),deleted_by=auth.uid(),updated_at=now(),version=version+1
 where (id=p_id or parent_transaction_id=p_id) and deleted_at is null;
end $$;
create function public.restore_transaction(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare t public.transactions%rowtype;
begin
 select * into t from public.transactions where id=p_id for update;
 if not found or not private.is_owner(t.household_id) then raise exception 'only Owner may restore'; end if;
 if t.parent_transaction_id is not null then raise exception 'restore parent transfer instead'; end if;
 if t.deleted_at is null or t.deleted_at<=now()-interval '30 days' then raise exception 'trash retention expired or not trashed'; end if;
 update public.transactions set deleted_at=null,deleted_by=null,updated_at=now(),version=version+1 where id=p_id or parent_transaction_id=p_id;
end $$;
create function public.confirm_ai_draft(p_draft_id uuid,p_input jsonb,p_acknowledged text[],p_request_key uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare d public.ai_drafts%rowtype; field text; tid uuid; retention_policy text;
begin
 select * into d from public.ai_drafts where id=p_draft_id for update;
 if not found or d.created_by<>auth.uid() or not private.is_member(d.household_id) then raise exception 'draft access denied'; end if;
 if (p_input->>'household_id')::uuid<>d.household_id then raise exception 'draft household mismatch'; end if;
 if d.status='confirmed' then
  if exists(select 1 from public.transactions where id=d.transaction_id and request_key=p_request_key and request_payload=p_input) then return d.transaction_id; end if;
  raise exception 'draft already confirmed with different request';
 end if;
 if d.status<>'preview' or d.expires_at<=now() then raise exception 'draft expired'; end if;
 foreach field in array array['amount','wallet_id','occurred_at','type'] loop
  if coalesce((d.confidence->>field)::numeric,0)<0.70 and not (field=any(coalesce(p_acknowledged,array[]::text[]))) then
   raise exception 'acknowledge low-confidence field: %',field;
  end if;
 end loop;
 tid:=public.create_transaction(p_input,p_request_key);
 update public.transactions set source='ai' where id=tid;
 update public.ai_drafts set status='confirmed',transaction_id=tid,confirmed_at=now() where id=p_draft_id;
 select attachment_retention into retention_policy from public.households where id=d.household_id;
 update public.attachments set transaction_id=tid,confirmed_at=now(),retention=retention_policy,
 expires_at=case retention_policy when 'keep' then null when '7d' then now()+interval '7 days' when 'immediate' then now() else now()+interval '24 hours' end
 where draft_id=p_draft_id and removed_at is null;
 return tid;
end $$;

-- Server-only credential and rate-limit RPCs. Private schema is never exposed to browser.
create function public.store_ai_credential(p_household uuid,p_user uuid,p_ciphertext text,p_iv text,p_model text) returns void language sql security definer set search_path='' as $$
 insert into private.ai_credentials(household_id,user_id,ciphertext,iv,model) values(p_household,p_user,p_ciphertext,p_iv,p_model)
 on conflict(household_id,user_id) do update set ciphertext=excluded.ciphertext,iv=excluded.iv,model=excluded.model,updated_at=now()
$$;
create function public.read_ai_credential(p_household uuid,p_user uuid) returns table(ciphertext text,iv text,model text) language sql security definer set search_path='' as $$
 select ciphertext,iv,model from private.ai_credentials where household_id=p_household and user_id=p_user
$$;
create function public.consume_ai_quota(p_user uuid) returns boolean language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 insert into private.ai_rate_limits(user_id,bucket,count) values(p_user,date_trunc('hour',now()),1)
 on conflict(user_id,bucket) do update set count=private.ai_rate_limits.count+1 returning count into n;
 return n<=30;
end $$;
create function public.purge_expired_transactions() returns integer language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 delete from public.transactions where deleted_at<=now()-interval '30 days' and parent_transaction_id is null;
 get diagnostics n=row_count;
 update public.ai_drafts set status='expired' where status='preview' and expires_at<=now();
 delete from private.ai_rate_limits where bucket<now()-interval '2 days';
 return n;
end $$;
-- Default EXECUTE is PUBLIC in Postgres; close it explicitly.
revoke execute on all functions in schema private from public,anon,authenticated;
grant execute on function private.is_member(uuid),private.is_owner(uuid) to authenticated;
revoke execute on function public.create_household(text,text),public.create_transaction(jsonb,uuid),public.trash_transaction(uuid),public.restore_transaction(uuid),public.confirm_ai_draft(uuid,jsonb,text[],uuid) from public,anon;
grant execute on function public.create_household(text,text),public.create_transaction(jsonb,uuid),public.trash_transaction(uuid),public.restore_transaction(uuid),public.confirm_ai_draft(uuid,jsonb,text[],uuid) to authenticated;
revoke execute on function public.store_ai_credential(uuid,uuid,text,text,text),public.read_ai_credential(uuid,uuid),public.consume_ai_quota(uuid),public.purge_expired_transactions() from public,anon,authenticated;
grant execute on function public.store_ai_credential(uuid,uuid,text,text,text),public.read_ai_credential(uuid,uuid),public.consume_ai_quota(uuid),public.purge_expired_transactions() to service_role;

-- Storage is private. Writes are issued server-side after membership validation.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('receipts','receipts',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy receipt_read on storage.objects for select to authenticated using(
 bucket_id='receipts' and exists(select 1 from public.attachments a where a.object_path=name and a.removed_at is null
 and (a.expires_at is null or a.expires_at>now()) and private.is_member(a.household_id)
 and (a.confirmed_at is not null or a.created_by=auth.uid()))
);


-- Revisions follow parent purge; read permission follows creator/Owner.
create table public.transaction_revisions (
 id uuid primary key default gen_random_uuid(), household_id uuid not null references public.households,
 transaction_id uuid not null, transaction_creator uuid not null, actor_id uuid not null,
 request_key uuid not null, expected_version integer not null, resulting_version integer not null,
 request_payload jsonb not null, before_snapshot jsonb not null, after_snapshot jsonb not null,
 created_at timestamptz not null default now(), unique(household_id,request_key),
 foreign key(household_id,transaction_id) references public.transactions(household_id,id) on delete cascade
);
alter table public.transaction_revisions enable row level security;
revoke all on public.transaction_revisions from public,anon,authenticated;
grant select on public.transaction_revisions to authenticated;
grant all on public.transaction_revisions to service_role;
create policy revision_read on public.transaction_revisions for select to authenticated
 using(private.is_member(household_id) and (transaction_creator=auth.uid() or private.is_owner(household_id)));
create function private.transaction_snapshot(p_id uuid) returns jsonb language sql set search_path='' as $$
 select jsonb_build_object('transaction',to_jsonb(t),'fees',coalesce((select jsonb_agg(to_jsonb(f) order by f.id) from public.transactions f where f.parent_transaction_id=t.id),'[]'::jsonb),
 'splits',coalesce((select jsonb_agg(to_jsonb(s) order by s.category_id) from public.transaction_splits s where s.transaction_id=t.id),'[]'::jsonb),
 'tags',coalesce((select jsonb_agg(to_jsonb(g) order by g.tag_id) from public.transaction_tags g where g.transaction_id=t.id),'[]'::jsonb))
 from public.transactions t where t.id=p_id
$$;
revoke execute on function private.transaction_snapshot(uuid) from public,anon,authenticated;
create function public.revise_transaction(p_id uuid,p_expected_version integer,p_input jsonb,p_request_key uuid)
 returns integer language plpgsql security definer set search_path='' as $$
declare
 t public.transactions%rowtype; r public.transaction_revisions%rowtype; before_data jsonb;
 h uuid; wid uuid:=(p_input->>'wallet_id')::uuid; dest uuid:=nullif(p_input->>'destination_wallet_id','')::uuid;
 actor uuid:=(p_input->>'transaction_actor')::uuid; kind text:=p_input->>'type'; state text:=p_input->>'status';
 scope text:=p_input->>'transaction_scope'; scope_user uuid:=nullif(p_input->>'scope_member_id','')::uuid;
 nominal bigint; fee bigint:=0; item jsonb; split_total bigint:=0;
begin
 select * into t from public.transactions where id=p_id for update;
 if not found or not private.is_member(t.household_id) then raise exception 'transaction access denied'; end if;
 if t.created_by<>auth.uid() and not private.is_owner(t.household_id) then raise exception 'only creator or Owner may edit'; end if;
 if t.parent_transaction_id is not null then raise exception 'edit parent transfer instead'; end if;
 h:=t.household_id;
 if (p_input->>'household_id')::uuid is distinct from h then raise exception 'household mismatch'; end if;
 if p_request_key is null then raise exception 'idempotency request key required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(h::text||p_request_key::text,0));
 select * into r from public.transaction_revisions where household_id=h and request_key=p_request_key;
 if found then
  if r.transaction_id<>p_id or r.actor_id<>auth.uid() or r.expected_version is distinct from p_expected_version or r.request_payload<>p_input then raise exception 'idempotency payload mismatch'; end if;
  return r.resulting_version;
 end if;
 if t.deleted_at is not null then raise exception 'transaction is trashed'; end if;
 if t.version is distinct from p_expected_version then raise exception 'version conflict: reload transaction'; end if;
 if p_input ? 'created_by' or p_input ? 'source' or p_input ? 'tag_ids' then raise exception 'immutable or unsupported field'; end if;
 if coalesce(p_input->>'amount','') !~ '^[0-9]+$' then raise exception 'whole rupiah amount required'; end if;
 nominal:=(p_input->>'amount')::bigint;
 if nominal not between 1 and 9000000000000 then raise exception 'invalid amount'; end if;
 if p_input ? 'fee_amount' then
  if (p_input->>'fee_amount') !~ '^[0-9]+$' then raise exception 'invalid fee'; end if;
  fee:=(p_input->>'fee_amount')::bigint;
 end if;
 if fee not between 0 and 9000000000000 or (fee>0 and kind<>'transfer') then raise exception 'invalid fee'; end if;
 if not exists(select 1 from public.wallets where household_id=h and id=wid and active)
 or (kind='transfer' and not exists(select 1 from public.wallets where household_id=h and id=dest and active))
 then raise exception 'active household wallet required'; end if;
 if p_input ? 'splits' then
  if jsonb_typeof(p_input->'splits')<>'array' then raise exception 'split array required'; end if;
  for item in select value from jsonb_array_elements(p_input->'splits') loop
   if (item->>'amount') !~ '^[0-9]+$' or (item->>'amount')::bigint<=0 then raise exception 'invalid split'; end if;
   split_total:=split_total+(item->>'amount')::bigint;
  end loop;
  if jsonb_array_length(p_input->'splits')>0 and (split_total<>nominal or kind='transfer') then raise exception 'split sum must match amount'; end if;
 end if;

 before_data:=private.transaction_snapshot(p_id);
 update public.transactions set type=kind,amount=nominal,wallet_id=wid,destination_wallet_id=dest,
 transaction_actor=actor,transaction_scope=scope,scope_member_id=scope_user,status=state,
 occurred_at=(p_input->>'occurred_at')::timestamptz,category_id=nullif(p_input->>'category_id','')::uuid,
 merchant=coalesce(p_input->>'merchant',''),notes=coalesce(p_input->>'notes',''),updated_at=now(),version=version+1 where id=p_id;
 -- Existing fee identity/creator is preserved when possible. Removing a fee is a revision, not trash.
 if fee=0 then delete from public.transactions where parent_transaction_id=p_id;
 elsif exists(select 1 from public.transactions where parent_transaction_id=p_id) then
  update public.transactions set amount=fee,wallet_id=wid,transaction_actor=actor,transaction_scope=scope,scope_member_id=scope_user,
   status=state,occurred_at=(p_input->>'occurred_at')::timestamptz,updated_at=now(),version=version+1 where parent_transaction_id=p_id;
 else
  insert into public.transactions(household_id,type,amount,wallet_id,transaction_actor,transaction_scope,scope_member_id,status,occurred_at,category_id,merchant,created_by,parent_transaction_id)
  values(h,'expense',fee,wid,actor,scope,scope_user,state,(p_input->>'occurred_at')::timestamptz,
   (select id from public.categories where household_id=h and name='Admin' order by id limit 1),'Biaya admin',t.created_by,p_id);
 end if;
 delete from public.transaction_splits where transaction_id=p_id;
 for item in select value from jsonb_array_elements(coalesce(p_input->'splits','[]'::jsonb)) loop
  insert into public.transaction_splits(transaction_id,household_id,category_id,amount) values(p_id,h,(item->>'category_id')::uuid,(item->>'amount')::bigint);
 end loop;
 insert into public.transaction_revisions(household_id,transaction_id,transaction_creator,actor_id,request_key,expected_version,resulting_version,request_payload,before_snapshot,after_snapshot)
 values(h,p_id,t.created_by,auth.uid(),p_request_key,t.version,t.version+1,p_input,before_data,private.transaction_snapshot(p_id));
 return t.version+1;
end $$;
revoke execute on function public.revise_transaction(uuid,integer,jsonb,uuid) from public,anon;
grant execute on function public.revise_transaction(uuid,integer,jsonb,uuid) to authenticated;

-- Preserve old ciphertext and encryption key. Legacy OpenAI rows are inactive until replaced.
alter table private.ai_credentials drop constraint ai_credentials_provider_check;
alter table private.ai_credentials add constraint ai_credentials_provider_check check(provider in ('openai','openrouter'));
alter table private.ai_credentials alter column provider set default 'openrouter';
alter table private.ai_credentials alter column model set default 'openrouter/free';
create or replace function public.store_ai_credential(p_household uuid,p_user uuid,p_ciphertext text,p_iv text,p_model text)
returns void language plpgsql security definer set search_path='' as $$
begin
 if p_model is distinct from 'openrouter/free' then raise exception 'only OpenRouter free router allowed'; end if;
 insert into private.ai_credentials(household_id,user_id,provider,ciphertext,iv,model)
 values(p_household,p_user,'openrouter',p_ciphertext,p_iv,p_model)
 on conflict(household_id,user_id) do update set provider='openrouter',ciphertext=excluded.ciphertext,iv=excluded.iv,model=excluded.model,updated_at=now();
end $$;
drop function public.read_ai_credential(uuid,uuid);
create function public.read_ai_credential(p_household uuid,p_user uuid)
returns table(provider text,ciphertext text,iv text,model text) language sql security definer set search_path='' as $$
 select provider,ciphertext,iv,model from private.ai_credentials where household_id=p_household and user_id=p_user
$$;
revoke execute on function public.store_ai_credential(uuid,uuid,text,text,text),public.read_ai_credential(uuid,uuid) from public,anon,authenticated;
grant execute on function public.store_ai_credential(uuid,uuid,text,text,text),public.read_ai_credential(uuid,uuid) to service_role;

-- Tag replacement is part of versioned atomic transaction revision. Omission preserves tags.
create or replace function public.revise_transaction(p_id uuid,p_expected_version integer,p_input jsonb,p_request_key uuid)
 returns integer language plpgsql security definer set search_path='' as $$
declare
 t public.transactions%rowtype; r public.transaction_revisions%rowtype; before_data jsonb;
 h uuid; wid uuid:=(p_input->>'wallet_id')::uuid; dest uuid:=nullif(p_input->>'destination_wallet_id','')::uuid;
 actor uuid:=(p_input->>'transaction_actor')::uuid; kind text:=p_input->>'type'; state text:=p_input->>'status';
 scope text:=p_input->>'transaction_scope'; scope_user uuid:=nullif(p_input->>'scope_member_id','')::uuid;
 nominal bigint; fee bigint:=0; item jsonb; split_total bigint:=0;
begin
 select * into t from public.transactions where id=p_id for update;
 if not found or not private.is_member(t.household_id) then raise exception 'transaction access denied'; end if;
 if t.created_by<>auth.uid() and not private.is_owner(t.household_id) then raise exception 'only creator or Owner may edit'; end if;
 if t.parent_transaction_id is not null then raise exception 'edit parent transfer instead'; end if;
 h:=t.household_id;
 if (p_input->>'household_id')::uuid is distinct from h then raise exception 'household mismatch'; end if;
 if p_request_key is null then raise exception 'idempotency request key required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(h::text||p_request_key::text,0));
 select * into r from public.transaction_revisions where household_id=h and request_key=p_request_key;
 if found then
  if r.transaction_id<>p_id or r.actor_id<>auth.uid() or r.expected_version is distinct from p_expected_version or r.request_payload<>p_input then raise exception 'idempotency payload mismatch'; end if;
  return r.resulting_version;
 end if;
 if t.deleted_at is not null then raise exception 'transaction is trashed'; end if;
 if t.version is distinct from p_expected_version then raise exception 'version conflict: reload transaction'; end if;
 if p_input ? 'created_by' or p_input ? 'source' then raise exception 'immutable or unsupported field'; end if;
 if coalesce(p_input->>'amount','') !~ '^[0-9]+$' then raise exception 'whole rupiah amount required'; end if;
 nominal:=(p_input->>'amount')::bigint;
 if nominal not between 1 and 9000000000000 then raise exception 'invalid amount'; end if;
 if p_input ? 'fee_amount' then
  if (p_input->>'fee_amount') !~ '^[0-9]+$' then raise exception 'invalid fee'; end if;
  fee:=(p_input->>'fee_amount')::bigint;
 end if;
 if fee not between 0 and 9000000000000 or (fee>0 and kind<>'transfer') then raise exception 'invalid fee'; end if;
 if not exists(select 1 from public.wallets where household_id=h and id=wid and active)
 or (kind='transfer' and not exists(select 1 from public.wallets where household_id=h and id=dest and active))
 then raise exception 'active household wallet required'; end if;
 if p_input ? 'splits' then
  if jsonb_typeof(p_input->'splits')<>'array' then raise exception 'split array required'; end if;
  for item in select value from jsonb_array_elements(p_input->'splits') loop
   if (item->>'amount') !~ '^[0-9]+$' or (item->>'amount')::bigint<=0 then raise exception 'invalid split'; end if;
   split_total:=split_total+(item->>'amount')::bigint;
  end loop;
  if jsonb_array_length(p_input->'splits')>0 and (split_total<>nominal or kind='transfer') then raise exception 'split sum must match amount'; end if;
 end if;

 if p_input ? 'tag_ids' and (jsonb_typeof(p_input->'tag_ids')<>'array' or jsonb_array_length(p_input->'tag_ids')>30) then raise exception 'tag array maximum30'; end if;
 before_data:=private.transaction_snapshot(p_id);
 update public.transactions set type=kind,amount=nominal,wallet_id=wid,destination_wallet_id=dest,
 transaction_actor=actor,transaction_scope=scope,scope_member_id=scope_user,status=state,
 occurred_at=(p_input->>'occurred_at')::timestamptz,category_id=nullif(p_input->>'category_id','')::uuid,
 merchant=coalesce(p_input->>'merchant',''),notes=coalesce(p_input->>'notes',''),updated_at=now(),version=version+1 where id=p_id;
 -- Existing fee identity/creator is preserved when possible. Removing a fee is a revision, not trash.
 if fee=0 then delete from public.transactions where parent_transaction_id=p_id;
 elsif exists(select 1 from public.transactions where parent_transaction_id=p_id) then
  update public.transactions set amount=fee,wallet_id=wid,transaction_actor=actor,transaction_scope=scope,scope_member_id=scope_user,
   status=state,occurred_at=(p_input->>'occurred_at')::timestamptz,updated_at=now(),version=version+1 where parent_transaction_id=p_id;
 else
  insert into public.transactions(household_id,type,amount,wallet_id,transaction_actor,transaction_scope,scope_member_id,status,occurred_at,category_id,merchant,created_by,parent_transaction_id)
  values(h,'expense',fee,wid,actor,scope,scope_user,state,(p_input->>'occurred_at')::timestamptz,
   (select id from public.categories where household_id=h and name='Admin' order by id limit 1),'Biaya admin',t.created_by,p_id);
 end if;
 delete from public.transaction_splits where transaction_id=p_id;
 for item in select value from jsonb_array_elements(coalesce(p_input->'splits','[]'::jsonb)) loop
  insert into public.transaction_splits(transaction_id,household_id,category_id,amount) values(p_id,h,(item->>'category_id')::uuid,(item->>'amount')::bigint);
 end loop;
 if p_input ? 'tag_ids' then
  delete from public.transaction_tags where transaction_id=p_id;
  for item in select value from jsonb_array_elements(p_input->'tag_ids') loop
   insert into public.transaction_tags(transaction_id,household_id,tag_id) values(p_id,h,trim(both '"' from item::text)::uuid);
  end loop;
 end if;
 insert into public.transaction_revisions(household_id,transaction_id,transaction_creator,actor_id,request_key,expected_version,resulting_version,request_payload,before_snapshot,after_snapshot)
 values(h,p_id,t.created_by,auth.uid(),p_request_key,t.version,t.version+1,p_input,before_data,private.transaction_snapshot(p_id));
 return t.version+1;
end $$;
revoke execute on function public.revise_transaction(uuid,integer,jsonb,uuid) from public,anon;
grant execute on function public.revise_transaction(uuid,integer,jsonb,uuid) to authenticated;

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

-- Only metadata for the authenticated requester; no user selector or encrypted bytes.
create function public.get_my_ai_credential_status(p_household uuid)
returns table(provider text, model text, updated_at timestamptz)
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not private.is_member(p_household) then
   raise exception 'household access denied';
 end if;
 return query select c.provider,c.model,c.updated_at from private.ai_credentials c
 where c.household_id=p_household and c.user_id=auth.uid();
end $$;

create function public.revoke_my_ai_credential(p_household uuid)
returns void language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null or not private.is_member(p_household) then
   raise exception 'household access denied';
 end if;
 delete from private.ai_credentials where household_id=p_household and user_id=auth.uid();
end $$;
revoke all on function public.get_my_ai_credential_status(uuid),public.revoke_my_ai_credential(uuid) from public,anon;
grant execute on function public.get_my_ai_credential_status(uuid),public.revoke_my_ai_credential(uuid) to authenticated;

-- Retain referenced actor/creator/wallet-owner identities; revoke access, never delete history.
alter table public.household_members add column active boolean not null default true;
create or replace function private.is_member(h uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.household_members where household_id=h and user_id=auth.uid() and active)
$$;
create or replace function private.is_owner(h uuid) returns boolean language sql stable security definer set search_path='' as $$
 select auth.uid() is not null and exists(select 1 from public.household_members where household_id=h and user_id=auth.uid() and role='owner' and active)
$$;
-- DELETE need not use SELECT policy; creator ownership alone cannot outlive membership.
alter policy contribution_delete on public.goal_contributions
using (private.is_member(household_id) and (private.is_owner(household_id) or created_by=auth.uid()));

create function public.revoke_household_member(p_household uuid,p_user uuid)
returns void language plpgsql security definer set search_path='' as $$
declare target public.household_members%rowtype;
begin
 if not private.is_owner(p_household) then raise exception 'Owner required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(p_user::text,7));
 perform 1 from public.households where id=p_household for update;
 select * into target from public.household_members where household_id=p_household and user_id=p_user for update;
 if not found then raise exception 'member unavailable'; end if;
 if target.role='owner' then raise exception 'Owner cannot be revoked'; end if;
 if not target.active then return; end if;
 update public.household_members set active=false where household_id=p_household and user_id=p_user;
 insert into public.activity_log(household_id,actor_id,entity_type,entity_id,action)
 values(p_household,auth.uid(),'household_member',p_user,'revoke');
end $$;
revoke all on function public.revoke_household_member(uuid,uuid) from public,anon;
grant execute on function public.revoke_household_member(uuid,uuid) to authenticated;

create function private.active_transaction_member_guard() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 -- Administrative data restore has no end-user JWT. Browser DML grants and
 -- authorized RPC membership checks independently reject unauthenticated writes.
 if auth.uid() is null then return new; end if;
 if (tg_op='INSERT' or new.transaction_actor is distinct from old.transaction_actor)
 and exists(select 1 from public.household_members where household_id=new.household_id and user_id=new.transaction_actor and not active)
 then raise exception 'actor must be an active member'; end if;
 if new.scope_member_id is not null and (tg_op='INSERT' or new.scope_member_id is distinct from old.scope_member_id)
 and exists(select 1 from public.household_members where household_id=new.household_id and user_id=new.scope_member_id and not active)
 then raise exception 'scope must refer to an active member'; end if;
 return new;
end $$;
create trigger active_transaction_member before insert or update on public.transactions
for each row execute function private.active_transaction_member_guard();

create function private.active_wallet_owner_guard() returns trigger
language plpgsql security definer set search_path='' as $$
begin
 if auth.uid() is null then return new; end if;
 if new.wallet_owner is not null and (tg_op='INSERT' or new.wallet_owner is distinct from old.wallet_owner)
 and exists(select 1 from public.household_members where household_id=new.household_id and user_id=new.wallet_owner and not active)
 then raise exception 'wallet owner must be an active member'; end if;
 return new;
end $$;
create trigger active_wallet_owner before insert or update on public.wallets
for each row execute function private.active_wallet_owner_guard();

-- Fresh verified invitation is required to reactivate; previously accepted codes cannot restore access.
create or replace function public.create_household_invitation(p_household uuid,p_email text,p_id uuid,p_token text)
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
 if exists(select 1 from auth.users u join public.household_members m on m.user_id=u.id where m.household_id=p_household and m.active and lower(u.email)=recipient) then raise exception 'recipient is already a member'; end if;
 if exists(select 1 from private.household_invitations where household_id=p_household and email=recipient and revoked_at is null and accepted_at is null and expires_at>now()) then raise exception 'active invitation already exists'; end if;
 if (select count(*) from private.household_invitations where household_id=p_household and revoked_at is null and accepted_at is null and expires_at>now())>=20 then raise exception 'maximum20 active invitations'; end if;
 insert into private.household_invitations(id,household_id,email,token_hash,created_by)
 values(p_id,p_household,recipient,encode(sha256(convert_to(p_token,'UTF8')),'hex'),auth.uid());
 insert into public.activity_log(household_id,actor_id,entity_type,entity_id,action) values(p_household,auth.uid(),'household_invitation',p_id,'create');
 return p_id;
end $$;


create or replace function public.accept_household_invitation(p_token text,p_display_name text) returns uuid
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
 if invitation.accepted_by=auth.uid() and exists(select 1 from public.household_members where household_id=invitation.household_id and user_id=auth.uid() and active) then return invitation.household_id; end if;
 if invitation.revoked_at is not null or invitation.accepted_at is not null or invitation.expires_at<=now() then raise exception 'invalid or unavailable invitation'; end if;
 if exists(select 1 from public.household_members where user_id=auth.uid() and active) then raise exception 'account already belongs to a household'; end if;
 insert into public.household_members(household_id,user_id,role,display_name) values(invitation.household_id,auth.uid(),'member',trim(p_display_name)) on conflict(household_id,user_id) do update set active=true,display_name=excluded.display_name where public.household_members.role='member' and not public.household_members.active;
 if not found then raise exception 'membership reactivation denied'; end if;
 update private.household_invitations set accepted_by=auth.uid(),accepted_at=now() where id=invitation.id;
 insert into public.activity_log(household_id,actor_id,entity_type,entity_id,action) values(invitation.household_id,auth.uid(),'household_invitation',invitation.id,'accept');
 return invitation.household_id;
end $$;



COMMIT;
