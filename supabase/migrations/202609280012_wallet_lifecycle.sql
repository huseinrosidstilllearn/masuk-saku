-- Metadata edits are owner-only and versioned; archive preserves the ledger.
alter table public.wallets add column version integer not null default 1 check(version>0);
alter table public.wallets add constraint wallet_color_format check(color ~ '^#[0-9a-fA-F]{6}$');
alter table public.wallets add constraint wallet_identifier_length check(account_identifier is null or length(account_identifier)<=60);
alter table public.activity_log add column details jsonb not null default '{}'::jsonb;
revoke update on public.wallets from authenticated;

create function public.save_wallet(p_input jsonb,p_expected_version integer default null)
returns integer language plpgsql security definer set search_path='' as $$
declare
 h uuid:=(p_input->>'household_id')::uuid; wid uuid:=(p_input->>'id')::uuid;
 old public.wallets%rowtype; desired jsonb; before_data jsonb; new_version integer;
 amount bigint; owner_id uuid:=nullif(p_input->>'wallet_owner','')::uuid;
begin
 if not private.is_owner(h) then raise exception 'Owner required'; end if;
 if wid is null or jsonb_typeof(p_input)<>'object' then raise exception 'invalid wallet'; end if;
 if coalesce(p_input->>'initial_balance','') !~ '^-?[0-9]+$' then raise exception 'whole rupiah balance required'; end if;
 amount:=(p_input->>'initial_balance')::bigint;
 if abs(amount::numeric)>9000000000000 or length(trim(coalesce(p_input->>'name',''))) not between 1 and 100
 or coalesce(p_input->>'type','') not in ('bank','cash','e_wallet')
 or coalesce(p_input->>'ownership','') not in ('personal','shared')
 or coalesce(p_input->>'icon','wallet') not in ('wallet','bank','income','expense','goal')
 or coalesce(p_input->>'color','#164c3e') !~ '^#[0-9a-fA-F]{6}$'
 or length(coalesce(p_input->>'account_identifier',''))>60 then raise exception 'invalid wallet fields'; end if;
 if (p_input->>'ownership'='shared' and owner_id is not null) or (p_input->>'ownership'='personal' and owner_id is null)
 then raise exception 'invalid wallet ownership'; end if;
 if owner_id is not null and not exists(select 1 from public.household_members where household_id=h and user_id=owner_id and active)
 and not exists(select 1 from public.wallets where id=wid and household_id=h and wallet_owner=owner_id)
 then raise exception 'active wallet owner required'; end if;
 desired:=jsonb_build_object('name',trim(p_input->>'name'),'type',p_input->>'type','ownership',p_input->>'ownership',
 'wallet_owner',owner_id,'initial_balance',amount,'active',coalesce((p_input->>'active')::boolean,true),
 'icon',coalesce(p_input->>'icon','wallet'),'color',coalesce(p_input->>'color','#164c3e'),
 'account_identifier',nullif(trim(p_input->>'account_identifier'),''));
 perform pg_advisory_xact_lock(hashtextextended(wid::text,12));
 select * into old from public.wallets where id=wid for update;
 if found then
  if old.household_id<>h then raise exception 'wallet access denied'; end if;
  before_data:=jsonb_build_object('name',old.name,'type',old.type,'ownership',old.ownership,'wallet_owner',old.wallet_owner,
   'initial_balance',old.initial_balance,'active',old.active,'icon',old.icon,'color',old.color,'account_identifier',old.account_identifier);
  if before_data=desired then return old.version; end if;
  if p_expected_version is null or old.version<>p_expected_version then raise exception 'wallet conflict'; end if;
  update public.wallets set name=desired->>'name',type=desired->>'type',ownership=desired->>'ownership',wallet_owner=owner_id,
   initial_balance=amount,active=(desired->>'active')::boolean,icon=desired->>'icon',color=desired->>'color',
   account_identifier=desired->>'account_identifier',updated_at=now(),version=version+1 where id=wid returning version into new_version;
 else
  if p_expected_version is not null then raise exception 'wallet conflict'; end if;
  insert into public.wallets(id,household_id,name,type,ownership,wallet_owner,initial_balance,active,icon,color,account_identifier)
  values(wid,h,desired->>'name',desired->>'type',desired->>'ownership',owner_id,amount,(desired->>'active')::boolean,
   desired->>'icon',desired->>'color',desired->>'account_identifier') returning version into new_version;
 end if;
 insert into public.activity_log(household_id,actor_id,entity_type,entity_id,action,details)
 values(h,auth.uid(),'wallet',wid,case when old.id is null then 'create' else 'update' end,
 jsonb_build_object('before',before_data,'after',desired,'version',new_version));
 return new_version;
end $$;
revoke all on function public.save_wallet(jsonb,integer) from public,anon;
grant execute on function public.save_wallet(jsonb,integer) to authenticated;
