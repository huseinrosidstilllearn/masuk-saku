create function public.discard_ai_draft(p_id uuid) returns void language plpgsql security definer set search_path='' as $$
declare d public.ai_drafts;
begin
 select * into d from public.ai_drafts where id=p_id for update;
 if not found or d.created_by<>auth.uid() or not private.is_member(d.household_id) then raise exception 'draft access denied'; end if;
 if d.status='confirmed' then raise exception 'confirmed draft cannot be discarded'; end if;
 update public.ai_drafts set status='expired',expires_at=least(expires_at,now()) where id=p_id;
 update public.attachments set expires_at=now() where draft_id=p_id and confirmed_at is null and removed_at is null;
end $$;
revoke all on function public.discard_ai_draft(uuid) from public,anon,authenticated;
grant execute on function public.discard_ai_draft(uuid) to authenticated;
