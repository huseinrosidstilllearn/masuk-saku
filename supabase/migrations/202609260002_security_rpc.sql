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
