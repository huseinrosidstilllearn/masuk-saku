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
