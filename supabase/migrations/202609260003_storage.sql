-- Storage is private. Writes are issued server-side after membership validation.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('receipts','receipts',false,10485760,array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy receipt_read on storage.objects for select to authenticated using(
 bucket_id='receipts' and exists(select 1 from public.attachments a where a.object_path=name and a.removed_at is null
 and (a.expires_at is null or a.expires_at>now()) and private.is_member(a.household_id)
 and (a.confirmed_at is not null or a.created_by=auth.uid()))
);

