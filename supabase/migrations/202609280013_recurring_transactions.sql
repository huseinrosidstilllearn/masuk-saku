alter table public.recurring_templates add column anchor_date date;
update public.recurring_templates set anchor_date=next_run;
alter table public.recurring_templates alter column anchor_date set not null;
alter table public.recurring_templates add column occurrence_index integer not null default 0 check(occurrence_index>=0);
alter table public.recurring_templates add column run_time text not null default '08:00' check(run_time ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$');
alter table public.recurring_templates add column version integer not null default 1 check(version>0);
alter table public.recurring_templates add column approved_at timestamptz;
alter table public.recurring_templates add constraint recurring_name_length check(length(trim(name)) between 1 and 100);
alter table public.recurring_templates add constraint recurring_end_date check(end_date is null or end_date>=anchor_date);
revoke insert,update,delete on public.recurring_templates from authenticated;

create table public.recurring_occurrences(
 id uuid primary key default gen_random_uuid(), household_id uuid not null, template_id uuid not null,
 scheduled_date date not null, status text not null check(status in ('pending','created','skipped','error')),
 input jsonb not null, transaction_id uuid, error_reason text,
 confirmed_input jsonb, confirmed_by uuid, created_at timestamptz not null default now(),
 unique(template_id,scheduled_date),
 foreign key(household_id,template_id) references public.recurring_templates(household_id,id),
 foreign key(household_id,transaction_id) references public.transactions(household_id,id)
);
alter table public.recurring_occurrences enable row level security;
grant select on public.recurring_occurrences to authenticated;
grant all on public.recurring_occurrences to service_role;
create policy recurring_occurrences_read on public.recurring_occurrences for select to authenticated using(private.is_member(household_id));

create function private.next_recurring_date(p_anchor date,p_cadence text,p_index integer)
returns date language plpgsql immutable set search_path='' as $$
declare first_day date; last_day date;
begin
 if p_index<0 or p_index>12000 or p_cadence not in ('weekly','monthly') then raise exception 'invalid recurrence'; end if;
 if p_cadence='weekly' then return p_anchor+p_index*7; end if;
 first_day:=(date_trunc('month',p_anchor)+(p_index||' months')::interval)::date;
 last_day:=(first_day+interval '1 month - 1 day')::date;
 return first_day+(least(extract(day from p_anchor)::integer,extract(day from last_day)::integer)-1);
end $$;

create function private.recurring_payload(p_household uuid,p_input jsonb)
returns jsonb language plpgsql security definer set search_path='' as $$
declare wid uuid; dest uuid; actor uuid; scope_id uuid; category uuid; nominal bigint; fee bigint; item jsonb; total numeric:=0;
 kind text:=p_input->>'type'; state text:=coalesce(p_input->>'status','completed'); scope text:=p_input->>'transaction_scope';
begin
 if jsonb_typeof(p_input)<>'object' or coalesce(p_input->>'occurred_at','')='' or coalesce(kind,'') not in ('income','expense','transfer')
 or state not in ('pending','completed','cancelled') or coalesce(scope,'') not in ('personal','family')
 or coalesce(p_input->>'amount','') !~ '^[0-9]+$' or coalesce(p_input->>'fee_amount','0') !~ '^[0-9]+$'
 then raise exception 'invalid recurring transaction'; end if;
 nominal:=(p_input->>'amount')::bigint; fee:=coalesce((p_input->>'fee_amount')::bigint,0);
 if nominal not between 1 and 9000000000000 or fee not between 0 and 9000000000000 or (kind<>'transfer' and fee<>0)
 then raise exception 'invalid recurring amount'; end if;
 wid:=(p_input->>'wallet_id')::uuid; dest:=nullif(p_input->>'destination_wallet_id','')::uuid;
 actor:=(p_input->>'transaction_actor')::uuid; scope_id:=nullif(p_input->>'scope_member_id','')::uuid; category:=nullif(p_input->>'category_id','')::uuid;
 if not exists(select 1 from public.wallets where household_id=p_household and id=wid and active)
 or (kind='transfer' and (dest is null or dest=wid or not exists(select 1 from public.wallets where household_id=p_household and id=dest and active)))
 or (kind<>'transfer' and dest is not null) then raise exception 'active household wallet required'; end if;
 if not exists(select 1 from public.household_members where household_id=p_household and user_id=actor and active)
 or (scope='personal' and not exists(select 1 from public.household_members where household_id=p_household and user_id=scope_id and active))
 or (scope='family' and scope_id is not null) then raise exception 'active household actor/scope required'; end if;
 if category is not null and not exists(select 1 from public.categories where household_id=p_household and id=category) then raise exception 'household category required'; end if;
 if length(coalesce(p_input->>'merchant',''))>200 or length(coalesce(p_input->>'notes',''))>2000 then raise exception 'recurring text too long'; end if;
 if jsonb_typeof(coalesce(p_input->'splits','[]'))<>'array' or jsonb_array_length(coalesce(p_input->'splits','[]'))>100
 or jsonb_typeof(coalesce(p_input->'tag_ids','[]'))<>'array' or jsonb_array_length(coalesce(p_input->'tag_ids','[]'))>100 then raise exception 'invalid recurring lists'; end if;
 for item in select value from jsonb_array_elements(coalesce(p_input->'splits','[]')) loop
  if coalesce(item->>'amount','') !~ '^[0-9]+$' or (item->>'amount')::numeric not between 1 and 9000000000000
  or not exists(select 1 from public.categories where household_id=p_household and id=(item->>'category_id')::uuid) then raise exception 'invalid recurring split'; end if;
  total:=total+(item->>'amount')::numeric;
 end loop;
 if total>0 and (total<>nominal or kind='transfer') then raise exception 'split sum must match amount'; end if;
 for item in select value from jsonb_array_elements(coalesce(p_input->'tag_ids','[]')) loop
  if not exists(select 1 from public.tags where household_id=p_household and id=(item#>>'{}')::uuid) then raise exception 'household tag required'; end if;
 end loop;
 return jsonb_build_object('type',kind,'amount',nominal,'wallet_id',wid,'destination_wallet_id',dest,
 'transaction_actor',actor,'transaction_scope',scope,'scope_member_id',scope_id,'status',state,
 'occurred_at',(p_input->>'occurred_at')::timestamptz,'category_id',category,'merchant',coalesce(p_input->>'merchant',''),
 'notes',coalesce(p_input->>'notes',''),'fee_amount',fee,'splits',coalesce(p_input->'splits','[]'),'tag_ids',coalesce(p_input->'tag_ids','[]'));
end $$;

create function public.save_recurring_template(p_input jsonb,p_expected_version integer default null)
returns integer language plpgsql security definer set search_path='' as $$
declare h uuid:=(p_input->>'household_id')::uuid; rid uuid:=(p_input->>'id')::uuid; old public.recurring_templates%rowtype;
 anchor date:=(p_input->>'anchor_date')::date; ending date:=nullif(p_input->>'end_date','')::date; payload jsonb; v integer; schedule_changed boolean;
begin
 if not private.is_member(h) then raise exception 'household access denied'; end if;
 if rid is null or length(trim(coalesce(p_input->>'name',''))) not between 1 and 100
 or coalesce(p_input->>'mode','') not in ('ask','auto_create') or coalesce(p_input->>'cadence','') not in ('weekly','monthly')
 or coalesce(p_input->>'run_time','') !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' or anchor is null or (ending is not null and ending<anchor)
 then raise exception 'invalid recurring schedule'; end if;
 payload:=private.recurring_payload(h,p_input->'transaction_template');
 perform pg_advisory_xact_lock(hashtextextended(rid::text,13));
 select * into old from public.recurring_templates where id=rid for update;
 if found then
  if old.household_id<>h or (old.created_by<>auth.uid() and not private.is_owner(h)) then raise exception 'recurring access denied'; end if;
  if old.name=trim(p_input->>'name') and old.mode=p_input->>'mode' and old.cadence=p_input->>'cadence'
  and old.anchor_date=anchor and old.end_date is not distinct from ending and old.run_time=p_input->>'run_time'
  and old.active=coalesce((p_input->>'active')::boolean,true) and old.transaction_template=payload and old.approved_at is not null then return old.version; end if;
  if p_expected_version is null or old.version<>p_expected_version then raise exception 'recurring conflict'; end if;
  schedule_changed:=old.anchor_date<>anchor or old.cadence<>p_input->>'cadence';
  update public.recurring_templates set name=trim(p_input->>'name'),mode=p_input->>'mode',cadence=p_input->>'cadence',anchor_date=anchor,end_date=ending,
   run_time=p_input->>'run_time',active=coalesce((p_input->>'active')::boolean,true),transaction_template=payload,approved_at=now(),version=version+1,
   occurrence_index=case when schedule_changed then 0 else occurrence_index end,next_run=case when schedule_changed then anchor else next_run end
  where id=rid returning version into v;
 else
  if p_expected_version is not null then raise exception 'recurring conflict'; end if;
  insert into public.recurring_templates(id,household_id,name,created_by,mode,cadence,next_run,anchor_date,end_date,run_time,active,transaction_template,approved_at)
  values(rid,h,trim(p_input->>'name'),auth.uid(),p_input->>'mode',p_input->>'cadence',anchor,anchor,ending,p_input->>'run_time',coalesce((p_input->>'active')::boolean,true),payload,now()) returning version into v;
 end if;
 insert into public.activity_log(household_id,actor_id,entity_type,entity_id,action) values(h,auth.uid(),'recurring_template',rid,'approve');
 return v;
end $$;

create function private.materialize_recurring(p_id uuid,p_actor uuid,p_input jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare previous_uid text:=current_setting('request.jwt.claim.sub',true); occurrence public.recurring_occurrences%rowtype; tid uuid;
begin
 select * into occurrence from public.recurring_occurrences where id=p_id for update;
 if not exists(select 1 from public.household_members where household_id=occurrence.household_id and user_id=p_actor and active) then raise exception 'inactive recurring creator'; end if;
 perform set_config('request.jwt.claim.sub',p_actor::text,true);
 tid:=public.create_transaction(p_input||jsonb_build_object('household_id',occurrence.household_id),p_id);
 update public.transactions set source='recurring',recurring_template_id=occurrence.template_id where id=tid or parent_transaction_id=tid;
 update public.recurring_occurrences set status='created',transaction_id=tid,confirmed_input=p_input,confirmed_by=p_actor,error_reason=null where id=p_id;
 perform set_config('request.jwt.claim.sub',coalesce(previous_uid,''),true);
 return tid;
exception when others then
 perform set_config('request.jwt.claim.sub',coalesce(previous_uid,''),true);
 raise;
end $$;

create function private.process_recurring(p_household uuid,p_until date,p_limit integer default 100)
returns integer language plpgsql security definer set search_path='' as $$
declare template public.recurring_templates%rowtype; occurrence public.recurring_occurrences%rowtype; payload jsonb; count_runs integer:=0; new_index integer;
begin
 for template in select * from public.recurring_templates where household_id=p_household and active and approved_at is not null and next_run<=p_until order by next_run,id for update skip locked loop
  while template.next_run<=p_until and count_runs<least(p_limit,100) loop
   if template.next_run=(now() at time zone 'Asia/Jakarta')::date and template.run_time>to_char(now() at time zone 'Asia/Jakarta','HH24:MI') then exit; end if;
   if template.end_date is not null and template.next_run>template.end_date then
    update public.recurring_templates set active=false,version=version+1 where id=template.id; exit;
   end if;
   payload:=template.transaction_template||jsonb_build_object('occurred_at',(template.next_run::text||'T'||template.run_time||':00+07:00')::timestamptz);
   insert into public.recurring_occurrences(household_id,template_id,scheduled_date,status,input)
   values(template.household_id,template.id,template.next_run,'pending',payload) on conflict(template_id,scheduled_date) do nothing;
   select * into occurrence from public.recurring_occurrences where template_id=template.id and scheduled_date=template.next_run for update;
   if template.mode='auto_create' and occurrence.status in ('pending','error') then
    begin
     perform private.materialize_recurring(occurrence.id,template.created_by,private.recurring_payload(template.household_id,payload));
    exception when others then
     update public.recurring_occurrences set status='error',error_reason='Jadwal dihentikan: periksa dompet, anggota, kategori, dan nominal.' where id=occurrence.id;
     update public.recurring_templates set active=false,version=version+1 where id=template.id;
     exit;
    end;
   end if;
   new_index:=template.occurrence_index+1;
   template.next_run:=private.next_recurring_date(template.anchor_date,template.cadence,new_index); template.occurrence_index:=new_index;
   update public.recurring_templates set next_run=template.next_run,occurrence_index=new_index,version=version+1 where id=template.id;
   count_runs:=count_runs+1;
  end loop;
  exit when count_runs>=least(p_limit,100);
 end loop;
 return count_runs;
end $$;

create function public.process_my_recurring(p_household uuid)
returns integer language plpgsql security definer set search_path='' as $$
begin
 if not private.is_member(p_household) then raise exception 'household access denied'; end if;
 return private.process_recurring(p_household,(now() at time zone 'Asia/Jakarta')::date);
end $$;
create function public.run_recurring_maintenance(p_until date default (now() at time zone 'Asia/Jakarta')::date)
returns integer language plpgsql security definer set search_path='' as $$
declare h uuid; total integer:=0;
begin
 for h in select distinct household_id from public.recurring_templates where active and approved_at is not null and next_run<=p_until loop
  total:=total+private.process_recurring(h,p_until,100-total);
  exit when total>=100;
 end loop;
 return total;
end $$;

create function public.confirm_recurring_occurrence(p_id uuid,p_input jsonb)
returns uuid language plpgsql security definer set search_path='' as $$
declare occurrence public.recurring_occurrences%rowtype; template public.recurring_templates%rowtype; payload jsonb;
begin
 select * into occurrence from public.recurring_occurrences where id=p_id for update;
 if not found or not private.is_member(occurrence.household_id) then raise exception 'recurring access denied'; end if;
 select * into template from public.recurring_templates where id=occurrence.template_id;
 if template.created_by<>auth.uid() and not private.is_owner(template.household_id) then raise exception 'creator or Owner required'; end if;
 payload:=private.recurring_payload(occurrence.household_id,p_input);
 if occurrence.status='created' then
  if occurrence.confirmed_by=auth.uid() and occurrence.confirmed_input=payload then return occurrence.transaction_id; end if;
  raise exception 'recurring already confirmed';
 end if;
 if occurrence.status not in ('pending','error') then raise exception 'recurring not pending'; end if;
 return private.materialize_recurring(p_id,auth.uid(),payload);
end $$;
create function public.skip_recurring_occurrence(p_id uuid)
returns void language plpgsql security definer set search_path='' as $$
declare occurrence public.recurring_occurrences%rowtype; creator uuid;
begin
 select * into occurrence from public.recurring_occurrences where id=p_id for update;
 if not found or not private.is_member(occurrence.household_id) then raise exception 'recurring access denied'; end if;
 select created_by into creator from public.recurring_templates where id=occurrence.template_id;
 if creator<>auth.uid() and not private.is_owner(occurrence.household_id) then raise exception 'creator or Owner required'; end if;
 if occurrence.status='skipped' then return; end if;
 if occurrence.status='created' then raise exception 'trash created transaction instead'; end if;
 update public.recurring_occurrences set status='skipped' where id=p_id;
end $$;
revoke all on function private.next_recurring_date(date,text,integer),private.recurring_payload(uuid,jsonb),private.materialize_recurring(uuid,uuid,jsonb),private.process_recurring(uuid,date,integer) from public,anon,authenticated;
revoke all on function public.save_recurring_template(jsonb,integer),public.process_my_recurring(uuid),public.confirm_recurring_occurrence(uuid,jsonb),public.skip_recurring_occurrence(uuid),public.run_recurring_maintenance(date) from public,anon;
grant execute on function public.save_recurring_template(jsonb,integer),public.process_my_recurring(uuid),public.confirm_recurring_occurrence(uuid,jsonb),public.skip_recurring_occurrence(uuid) to authenticated;
revoke all on function public.run_recurring_maintenance(date) from authenticated;
grant execute on function public.run_recurring_maintenance(date) to service_role;
