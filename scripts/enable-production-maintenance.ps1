# Production only. Uses encrypted local Edge recovery; never prints the bearer.
$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$privateDirectory = Join-Path $projectRoot 'work\production-secrets'
$recoveryPath = Join-Path $privateDirectory 'edge.recovery.dpapi.txt'
$secretSqlPath = Join-Path $privateDirectory 'maintenance-vault.sql'
if (-not (Test-Path -LiteralPath $recoveryPath)) { throw 'Production Edge recovery not found.' }
$protectedText = (Get-Content -LiteralPath $recoveryPath -Raw).Trim() | ConvertTo-SecureString
$environmentText = [Net.NetworkCredential]::new('', $protectedText).Password
$bearer = [regex]::Match($environmentText,'(?m)^MAINTENANCE_SECRET=([a-f0-9]{64})\s*$').Groups[1].Value
if (-not $bearer) { throw 'Production maintenance recovery format is invalid.' }
# Only generated hex is interpolated, not untrusted input. This SQL is temporary and private.
$vaultSql = @'
do $$ begin
 if exists(select 1 from vault.decrypted_secrets where name='masuk_saku_production_maintenance_bearer') then
  if not exists(select 1 from vault.decrypted_secrets where name='masuk_saku_production_maintenance_bearer' and decrypted_secret='__BEARER__') then
   raise exception 'Existing Production Vault secret differs; no rotation performed';
  end if;
 else
  perform vault.create_secret('__BEARER__','masuk_saku_production_maintenance_bearer','Production Edge maintenance bearer');
 end if;
end $$;
'@
Push-Location -LiteralPath $projectRoot
try {
  Set-Content -LiteralPath $secretSqlPath -Value $vaultSql.Replace('__BEARER__',$bearer)
  # Capture potentially sensitive CLI error details; never echo this secret-bearing query.
  $captured = & npx --yes supabase@2.118.0 db query --linked --project-ref snqkfrcxjfdjkwxjiabc --file $secretSqlPath 2>&1
  if ($LASTEXITCODE -ne 0) { throw 'Production Vault setup failed; secret-bearing output withheld.' }
  & npx --yes supabase@2.118.0 db query --linked --project-ref snqkfrcxjfdjkwxjiabc --file supabase/operations/production-maintenance.sql
  if ($LASTEXITCODE -ne 0) { throw 'Production maintenance scheduling failed.' }
  Write-Output 'Production maintenance scheduled every 15 minutes; Vault bearer not logged.'
} finally {
  $checked = [IO.Path]::GetFullPath($secretSqlPath)
  if ($checked -ne [IO.Path]::GetFullPath((Join-Path $privateDirectory 'maintenance-vault.sql'))) { throw 'Unsafe temporary SQL cleanup.' }
  if (Test-Path -LiteralPath $checked) { Remove-Item -LiteralPath $checked }
  Pop-Location
}
