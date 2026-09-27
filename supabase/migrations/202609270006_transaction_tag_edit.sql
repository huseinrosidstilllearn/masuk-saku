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
