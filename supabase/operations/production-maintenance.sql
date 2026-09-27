-- Production-only operational setup, separate from portable application migrations.
-- Requires the maintenance bearer secret already stored in Vault by the setup script.
begin;
create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function private.enqueue_production_maintenance() returns bigint
language plpgsql security definer set search_path='' as $$
declare bearer text; request_id bigint;
begin
 select decrypted_secret into bearer from vault.decrypted_secrets
 where name='masuk_saku_production_maintenance_bearer';
 if bearer is null or length(bearer)<32 then
  raise exception 'Production maintenance secret is missing';
 end if;
 select net.http_post(
  url:='https://snqkfrcxjfdjkwxjiabc.supabase.co/functions/v1/maintenance',
  headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||bearer),
  body:='{}'::jsonb, timeout_milliseconds:=20000
 ) into request_id;
 return request_id;
end $$;
revoke all on function private.enqueue_production_maintenance() from public,anon,authenticated,service_role;
-- Best-effort on managed Supabase objects: postgres cannot revoke grants made by
-- supabase_admin. Verify actual ACLs after setup; never expose net via the API,
-- grant SQL access to application users, or add a queue-reading definer RPC.
revoke all on net.http_request_queue,net._http_response from public,anon,authenticated;
select cron.schedule('masuk-saku-production-maintenance','*/15 * * * *',
 'select private.enqueue_production_maintenance();');
commit;
