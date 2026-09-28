-- Closed periods retain the spending snapshot used to calculate carryover.
revoke delete on public.budgets from authenticated;
alter table public.budgets add column active boolean not null default true,
 add column cadence text not null default 'custom' check(cadence in ('weekly','monthly','custom')),
 add column auto_continue boolean not null default false,
 add column predecessor_id uuid unique references public.budgets(id),
 add column closed_at timestamptz,
 add column closed_spent bigint check(closed_spent >= 0),
 add column automation_error text;
create function private.guard_budget_period() returns trigger language plpgsql as $$
begin
 if current_user='authenticated' then
  if tg_op='UPDATE' and old.closed_at is not null then raise exception 'closed budget is immutable'; end if;
  if new.closed_at is not null or new.closed_spent is not null or new.predecessor_id is not null or
    (tg_op='INSERT' and new.rollover_amount<>0) or
    (tg_op='UPDATE' and new.rollover_amount<>old.rollover_amount) then raise exception 'server managed budget fields'; end if;
  if tg_op='UPDATE' and new.active and not old.active then new.automation_error:=null; end if;
 end if;
 if new.cadence='weekly' and new.end_date<>new.start_date+6 then raise exception 'weekly budget must cover 7 days'; end if;
 if new.cadence='monthly' and (extract(day from new.start_date)<>1 or
   new.end_date<>(date_trunc('month',new.start_date)+interval '1 month - 1 day')::date) then raise exception 'monthly budget must cover a calendar month'; end if;
 return new;
end $$;
create trigger budget_period_guard before insert or update on public.budgets for each row execute function private.guard_budget_period();
create function private.budget_spent(p_id uuid) returns bigint language sql stable security definer set search_path='' as $$
 with recursive b as (select * from public.budgets where id=p_id), cats as (
  select id from public.categories where id=(select category_id from b)
  union select c.id from public.categories c join cats on c.parent_id=cats.id
 ), expenses as (
 select t.*,b.category_id as budget_category from public.transactions t cross join b
 where t.household_id=b.household_id and t.type='expense' and t.status='completed' and t.deleted_at is null
 and (b.wallet_id is null or t.wallet_id=b.wallet_id)
 and (t.occurred_at at time zone 'Asia/Jakarta')::date between b.start_date and b.end_date
 ) select coalesce(sum(case when budget_category is null then amount
 when exists(select 1 from public.transaction_splits s where s.transaction_id=expenses.id) then
 (select coalesce(sum(s.amount),0) from public.transaction_splits s where s.transaction_id=expenses.id and s.category_id in(select id from cats))
 when category_id in(select id from cats) then amount else 0 end),0)::bigint from expenses
$$;
create function private.close_budget_period(p_id uuid,p_today date) returns uuid language plpgsql security definer set search_path='' as $$
declare b public.budgets; successor uuid; spent bigint; carry bigint; start_day date; end_day date;
begin
 select * into b from public.budgets where id=p_id for update;
 if not found then raise exception 'budget not found'; end if;
 if b.closed_at is not null then select id into successor from public.budgets where predecessor_id=b.id; return successor; end if;
 if b.end_date>=p_today then raise exception 'budget period has not ended'; end if;
 spent:=private.budget_spent(b.id);
 update public.budgets set closed_at=now(),closed_spent=spent where id=b.id;
 if b.active and b.auto_continue then
  carry:=case when b.rollover='rollover' then greatest(0,b.amount+b.rollover_amount-spent) else 0 end;
  if carry>9000000000000 or carry+b.amount>9000000000000 then raise exception 'budget carryover exceeds limit'; end if;
  start_day:=b.end_date+1;
  end_day:=case when b.cadence='monthly' then (date_trunc('month',start_day)+interval '1 month - 1 day')::date
    when b.cadence='weekly' then start_day+6 else start_day+(b.end_date-b.start_date) end;
  insert into public.budgets(household_id,name,category_id,wallet_id,amount,start_date,end_date,rollover,rollover_amount,warning_thresholds,cadence,auto_continue,predecessor_id)
   values(b.household_id,b.name,b.category_id,b.wallet_id,b.amount,start_day,end_day,b.rollover,carry,b.warning_thresholds,b.cadence,true,b.id) returning id into successor;
 end if;
 insert into public.activity_log(household_id,actor_id,entity_type,entity_id,action,details)
 values(b.household_id,auth.uid(),'budget',b.id,'period_closed',jsonb_build_object('spent',spent,'carryover',coalesce(carry,0),'successor_id',successor));
 return successor;
end $$;
create function public.close_budget_period(p_id uuid) returns uuid language plpgsql security definer set search_path='' as $$
declare h uuid;
begin
 select household_id into h from public.budgets where id=p_id;
 if not private.is_member(h) then raise exception 'membership required'; end if;
 return private.close_budget_period(p_id,(now() at time zone 'Asia/Jakarta')::date);
end $$;
create function public.run_budget_maintenance() returns integer language plpgsql security definer set search_path='' as $$
declare b record; count integer:=0; today date:=(now() at time zone 'Asia/Jakarta')::date;
begin
 for b in select id from public.budgets where active and auto_continue and closed_at is null and end_date<today order by end_date limit 100 for update skip locked loop
  begin
   perform private.close_budget_period(b.id,today); count:=count+1;
  exception when others then
   update public.budgets set active=false,auto_continue=false,automation_error='Periode otomatis dijeda. Periksa batas nominal dan aturan periode sebelum melanjutkan.' where id=b.id;
  end;
 end loop;
 return count;
end $$;
revoke all on function private.guard_budget_period(),private.budget_spent(uuid),private.close_budget_period(uuid,date),public.close_budget_period(uuid),public.run_budget_maintenance() from public,anon,authenticated;
grant execute on function public.close_budget_period(uuid) to authenticated;
grant execute on function public.run_budget_maintenance() to service_role;
