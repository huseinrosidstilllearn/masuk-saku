alter table public.transactions drop constraint transactions_source_check;
alter table public.transactions add constraint transactions_source_check check(source in ('manual','quick_add','ai','recurring','import'));
create table private.import_requests (household_id uuid not null references public.households,id uuid primary key,created_by uuid not null references auth.users, payload jsonb not null,created_at timestamptz not null default now());
revoke all on private.import_requests from public,anon,authenticated;
create function private.import_reference(p_map jsonb,p_key text) returns uuid language plpgsql immutable as $$
begin
 if p_key is null then return null; end if;
 if not p_map ? p_key then raise exception 'missing import reference'; end if;
 return (p_map->>p_key)::uuid;
end $$;
create function public.import_household_snapshot(p_household uuid,p_data jsonb,p_members jsonb,p_request_key uuid) returns integer
language plpgsql security definer set search_path='' as $$
declare r jsonb; s jsonb; ids jsonb:='{}'; tx jsonb; full_payload jsonb; existing private.import_requests; count integer:=0; fee bigint; old_id text; new_id uuid;
begin
 if not private.is_owner(p_household) then raise exception 'Owner required'; end if;
 if p_request_key is null or jsonb_typeof(p_data)<>'object' or jsonb_typeof(p_members)<>'object' or octet_length(p_data::text)>5242880 then raise exception 'invalid import'; end if;
 foreach old_id in array array['wallets','categories','tags','transactions','budgets','goals','contributions','members','splits','transactionTags'] loop
  if jsonb_typeof(p_data->old_id)<>'array' or jsonb_array_length(p_data->old_id)>1000 then raise exception 'invalid import list'; end if;
 end loop;
 if (select count(*) from jsonb_array_elements(p_data->'transactions') t where coalesce(t->>'deleted_at','')='' and coalesce(t->>'parent_transaction_id','')='')>500 then raise exception 'import transaction limit'; end if;
 full_payload:=jsonb_build_object('data',p_data,'members',p_members);
 perform pg_advisory_xact_lock(hashtextextended(p_request_key::text,0));
 select * into existing from private.import_requests where id=p_request_key;
 if found then
  if existing.household_id<>p_household or existing.created_by<>auth.uid() or existing.payload<>full_payload then raise exception 'import request mismatch'; end if;
  return 0;
 end if;
 for r in select value from jsonb_array_elements(p_data->'members') loop
  if not exists(select 1 from public.household_members where household_id=p_household and user_id=(p_members->>(r->>'user_id'))::uuid and active) then raise exception 'active member mapping required'; end if;
 end loop;
 for old_id in select value from jsonb_each_text(p_members) loop
  if not exists(select 1 from public.household_members where household_id=p_household and user_id=old_id::uuid and active) then raise exception 'active member mapping required'; end if;
 end loop;
 for r in select value from jsonb_array_elements(p_data->'wallets') union all select value from jsonb_array_elements(p_data->'categories') union all select value from jsonb_array_elements(p_data->'tags') union all select value from jsonb_array_elements(p_data->'transactions') union all select value from jsonb_array_elements(p_data->'budgets') union all select value from jsonb_array_elements(p_data->'goals') loop
  old_id:=r->>'id'; if old_id is null or ids ? old_id then raise exception 'duplicate or missing import id'; end if;
  ids:=ids||jsonb_build_object(old_id,gen_random_uuid());
 end loop;
 for r in select value from jsonb_array_elements(p_data->'wallets') loop
  if r->>'household_id' is distinct from p_data->'household'->>'id' then raise exception 'mixed import household'; end if;
  insert into public.wallets(id,household_id,name,type,ownership,wallet_owner,initial_balance,active,icon,color,account_identifier)
  values(private.import_reference(ids,r->>'id'),p_household,r->>'name',r->>'type',r->>'ownership',case when r->>'ownership'='personal' then private.import_reference(p_members,r->>'wallet_owner') else null end,(r->>'initial_balance')::bigint,true,coalesce(r->>'icon','wallet'),coalesce(r->>'color','#087f73'),r->>'account_identifier');
 end loop;
 for r in select value from jsonb_array_elements(p_data->'categories') order by (value->>'parent_id') nulls first loop
  insert into public.categories(id,household_id,name,parent_id,kind,color,icon,sort_order) values(private.import_reference(ids,r->>'id'),p_household,r->>'name',private.import_reference(ids,r->>'parent_id'),r->>'kind',coalesce(r->>'color','#087f73'),coalesce(r->>'icon','category'),coalesce((r->>'sort_order')::integer,0));
 end loop;
 for r in select value from jsonb_array_elements(p_data->'tags') loop
  select id into new_id from public.tags where household_id=p_household and name=r->>'name';
  if found then ids:=ids||jsonb_build_object(r->>'id',new_id);
  else insert into public.tags(id,household_id,name) values(private.import_reference(ids,r->>'id'),p_household,r->>'name'); end if;
 end loop;
 for r in select value from jsonb_array_elements(p_data->'transactions') where coalesce(value->>'deleted_at','')='' and coalesce(value->>'parent_transaction_id','')='' loop
  if r->>'household_id' is distinct from p_data->'household'->>'id' then raise exception 'mixed import household'; end if;
  old_id:=r->>'id'; new_id:=private.import_reference(ids,old_id);
  select coalesce(sum((value->>'amount')::bigint),0) into fee from jsonb_array_elements(p_data->'transactions') where value->>'parent_transaction_id'=old_id and coalesce(value->>'deleted_at','')='';
  tx:=jsonb_build_object('type',r->>'type','amount',r->'amount','wallet_id',private.import_reference(ids,r->>'wallet_id'),'destination_wallet_id',private.import_reference(ids,r->>'destination_wallet_id'),
   'transaction_actor',private.import_reference(p_members,r->>'transaction_actor'),'transaction_scope',r->>'transaction_scope','scope_member_id',private.import_reference(p_members,r->>'scope_member_id'),
   'status',r->>'status','occurred_at',r->>'occurred_at','category_id',private.import_reference(ids,r->>'category_id'),'merchant',coalesce(r->>'merchant',''),'notes',coalesce(r->>'notes',''),'fee_amount',fee,
   'splits',(select coalesce(jsonb_agg(jsonb_build_object('category_id',private.import_reference(ids,value->>'category_id'),'amount',value->'amount')),'[]') from jsonb_array_elements(p_data->'splits') where value->>'transaction_id'=old_id),
   'tag_ids',(select coalesce(jsonb_agg(private.import_reference(ids,value->>'tag_id')),'[]') from jsonb_array_elements(p_data->'transactionTags') where value->>'transaction_id'=old_id));
  tx:=private.recurring_payload(p_household,tx)||jsonb_build_object('household_id',p_household);
  new_id:=public.create_transaction(tx,new_id);
  update public.transactions set source='import' where id=new_id or parent_transaction_id=new_id;
  count:=count+1;
 end loop;
 for r in select value from jsonb_array_elements(p_data->'wallets') loop update public.wallets set active=coalesce((r->>'active')::boolean,true) where id=private.import_reference(ids,r->>'id'); end loop;
 for r in select value from jsonb_array_elements(p_data->'budgets') loop
  insert into public.budgets(id,household_id,name,category_id,wallet_id,amount,start_date,end_date,rollover,warning_thresholds,active,cadence)
   values(private.import_reference(ids,r->>'id'),p_household,r->>'name',private.import_reference(ids,r->>'category_id'),private.import_reference(ids,r->>'wallet_id'),(r->>'amount')::bigint,(r->>'start_date')::date,(r->>'end_date')::date,r->>'rollover',array(select (value#>>'{}')::integer from jsonb_array_elements(r->'warning_thresholds')),coalesce((r->>'active')::boolean,true) and coalesce(r->>'closed_at','')='',coalesce(r->>'cadence','custom'));
 end loop;
 for r in select value from jsonb_array_elements(p_data->'goals') loop
  insert into public.savings_goals(id,household_id,title,target_amount,deadline,notes,status) values(private.import_reference(ids,r->>'id'),p_household,r->>'title',(r->>'target_amount')::bigint,(r->>'deadline')::date,coalesce(r->>'notes',''),coalesce(r->>'status','active'));
 end loop;
 for r in select value from jsonb_array_elements(p_data->'contributions') loop
  insert into public.goal_contributions(household_id,goal_id,amount,created_by,contributed_at) values(p_household,private.import_reference(ids,r->>'goal_id'),(r->>'amount')::bigint,auth.uid(),(r->>'contributed_at')::timestamptz);
 end loop;
 insert into private.import_requests(household_id,id,created_by,payload) values(p_household,p_request_key,auth.uid(),full_payload);
 insert into public.activity_log(household_id,actor_id,entity_type,action,details) values(p_household,auth.uid(),'household','snapshot_imported',jsonb_build_object('transactions',count,'request_id',p_request_key));
 return count;
end $$;
revoke all on function private.import_reference(jsonb,text),public.import_household_snapshot(uuid,jsonb,jsonb,uuid) from public,anon,authenticated;
grant execute on function public.import_household_snapshot(uuid,jsonb,jsonb,uuid) to authenticated;
