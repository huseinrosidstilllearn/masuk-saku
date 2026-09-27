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


