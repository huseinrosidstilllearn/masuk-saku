create table public.user_profiles (
 user_id uuid primary key references auth.users(id) on delete cascade,
 full_name text not null check(length(full_name) between 1 and 100),
 nickname text not null check(length(nickname) between 1 and 50),
 phone text not null default '' check(length(phone)<=30),
 birth_date date, city text not null default '' check(length(city)<=100),
 bio text not null default '' check(length(bio)<=500), avatar_path text,
 revision integer not null default 1 check(revision>0), updated_at timestamptz not null default now(),
 check(avatar_path is null or (split_part(avatar_path,'/',1)=user_id::text and avatar_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'))
);
alter table public.user_profiles enable row level security;
revoke all on public.user_profiles from public,anon,authenticated;
grant select on public.user_profiles to authenticated;
create policy profile_self_read on public.user_profiles for select to authenticated using(user_id=auth.uid());

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('avatars','avatars',false,2097152,array['image/jpeg','image/png','image/webp'])
on conflict(id) do update set public=false,file_size_limit=excluded.file_size_limit,allowed_mime_types=excluded.allowed_mime_types;
create policy avatar_self_read on storage.objects for select to authenticated
using(bucket_id='avatars' and split_part(name,'/',1)=auth.uid()::text);
create policy avatar_self_insert on storage.objects for insert to authenticated
with check(bucket_id='avatars' and split_part(name,'/',1)=auth.uid()::text and name ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$');
create policy avatar_self_delete on storage.objects for delete to authenticated
using(bucket_id='avatars' and split_part(name,'/',1)=auth.uid()::text);

create function public.save_my_profile(p_profile jsonb,p_expected_revision integer)
returns jsonb language plpgsql security definer set search_path='' as $$
declare mine uuid:=auth.uid(); current_revision integer; saved public.user_profiles;
 full_name text:=trim(p_profile->>'full_name'); nickname text:=trim(p_profile->>'nickname');
 phone text:=trim(coalesce(p_profile->>'phone','')); city text:=trim(coalesce(p_profile->>'city',''));
 bio text:=trim(coalesce(p_profile->>'bio','')); birthday date; photo text:=nullif(p_profile->>'avatar_path','');
begin
 if mine is null then raise exception 'authentication required'; end if;
 if jsonb_typeof(p_profile) is distinct from 'object' or full_name is null or length(full_name) not between 1 and 100
 or nickname is null or length(nickname) not between 1 and 50 or length(phone)>30 or phone !~ '^[0-9+ ().-]*$'
 or length(city)>100 or length(bio)>500 then raise exception 'invalid profile'; end if;
 if nullif(p_profile->>'birth_date','') is not null then
  if (p_profile->>'birth_date') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' then raise exception 'invalid birth date'; end if;
  birthday:=(p_profile->>'birth_date')::date;
  if birthday<date '1900-01-01' or birthday>(now() at time zone 'Asia/Jakarta')::date then raise exception 'invalid birth date'; end if;
 end if;
 if photo is not null and (split_part(photo,'/',1)<>mine::text or photo !~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.(jpg|png|webp)$'
 or not exists(select 1 from storage.objects where bucket_id='avatars' and name=photo)) then raise exception 'invalid avatar'; end if;
 perform pg_advisory_xact_lock(hashtextextended(mine::text,11));
 select revision into current_revision from public.user_profiles where user_id=mine for update;
 if p_expected_revision is null or coalesce(current_revision,0)<>p_expected_revision then raise exception 'profile conflict'; end if;
 insert into public.user_profiles(user_id,full_name,nickname,phone,birth_date,city,bio,avatar_path)
 values(mine,full_name,nickname,phone,birthday,city,bio,photo)
 on conflict(user_id) do update set full_name=excluded.full_name,nickname=excluded.nickname,phone=excluded.phone,
 birth_date=excluded.birth_date,city=excluded.city,bio=excluded.bio,avatar_path=excluded.avatar_path,
 revision=public.user_profiles.revision+1,updated_at=now() returning * into saved;
 update public.household_members set display_name=nickname where user_id=mine and active;
 return to_jsonb(saved);
end $$;
revoke all on function public.save_my_profile(jsonb,integer) from public,anon;
grant execute on function public.save_my_profile(jsonb,integer) to authenticated;
