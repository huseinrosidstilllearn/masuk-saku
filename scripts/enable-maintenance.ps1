[CmdletBinding()]
param([Parameter(Mandatory=$true)][ValidatePattern('^[a-z0-9]{20}$')][string]$ProjectRef,
      [string]$SecretsFile = (Join-Path $PSScriptRoot '..\supabase\functions\.env.local'))
$ErrorActionPreference='Stop'
$settings=Get-Content -LiteralPath $SecretsFile -Raw
$bearer=[regex]::Match($settings,'(?m)^MAINTENANCE_SECRET=(.*)$').Groups[1].Value.Trim().Trim([char]34,[char]39)
if ($bearer -notmatch '^[A-Za-z0-9_+/=-]{32,128}$') { throw 'Maintenance configuration requires a safe high-entropy bearer.' }
$sql=@'
begin;
create extension if not exists pg_cron;
create extension if not exists pg_net;
do $$ begin
 if exists(select 1 from vault.decrypted_secrets where name='masuk_saku_maintenance_bearer') then
  if not exists(select 1 from vault.decrypted_secrets where name='masuk_saku_maintenance_bearer' and decrypted_secret='__BEARER__') then raise exception 'Existing maintenance bearer differs; no rotation performed'; end if;
 else perform vault.create_secret('__BEARER__','masuk_saku_maintenance_bearer','Scheduled maintenance bearer'); end if;
end $$;
create or replace function private.enqueue_maintenance() returns bigint language plpgsql security definer set search_path='' as $$
declare bearer text; request_id bigint;
begin
 select decrypted_secret into bearer from vault.decrypted_secrets where name='masuk_saku_maintenance_bearer';
 if bearer is null then raise exception 'Maintenance bearer unavailable'; end if;
 select net.http_post(url:='https://__REF__.supabase.co/functions/v1/maintenance',headers:=jsonb_build_object('Content-Type','application/json','Authorization','Bearer '||bearer),body:='{}',timeout_milliseconds:=20000) into request_id;
 return request_id;
end $$;
revoke all on function private.enqueue_maintenance() from public,anon,authenticated,service_role;
revoke all on net.http_request_queue,net._http_response from public,anon,authenticated;
select cron.schedule('masuk-saku-maintenance','*/15 * * * *','select private.enqueue_maintenance();');
commit;
'@
$root=[IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..\work'))
New-Item -ItemType Directory -Path $root -Force | Out-Null
$temporary=Join-Path $root ('maintenance-'+[Guid]::NewGuid().ToString('N')+'.sql')
try {
 Set-Content -LiteralPath $temporary -Value $sql.Replace('__BEARER__',$bearer).Replace('__REF__',$ProjectRef)
 $captured = & npx --yes supabase@2.118.0 db query --linked --project-ref $ProjectRef --file $temporary 2>&1
 if ($LASTEXITCODE -ne 0) { throw 'Maintenance scheduling failed; secret-bearing diagnostics withheld.' }
 Write-Host 'Maintenance scheduled every 15 minutes; bearer stored privately in Vault.'
} finally {
 $target=[IO.Path]::GetFullPath($temporary)
 if ([IO.Path]::GetDirectoryName($target) -ne $root) { throw 'Unsafe temporary cleanup path.' }
 if (Test-Path -LiteralPath $target) { Remove-Item -LiteralPath $target }
 $bearer=$null;$settings=$null;$captured=$null
}
