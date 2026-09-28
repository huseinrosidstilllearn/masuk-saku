# Requires an authenticated Supabase CLI and GitHub CLI. Secrets stay in memory/stdin.
[CmdletBinding()]
param([Parameter(Mandatory=$true)][ValidatePattern('^[a-z0-9]{20}$')][string]$ProjectRef,
      [Parameter(Mandatory=$true)][string]$Repository)
$ErrorActionPreference='Stop'
$captured=$null; $inventory=$null; $serviceKey=$null
try {
  $captured = & npx --yes supabase@2.118.0 projects api-keys --project-ref $ProjectRef --reveal --output json 2>$null
  if ($LASTEXITCODE -ne 0) { throw 'Supabase key inventory unavailable. Login CLI first.' }
  $inventory=(($captured -join "`n") | ConvertFrom-Json)
  $serviceKey=($inventory | Where-Object { $_.name -eq 'service_role' } | Select-Object -First 1).api_key
  if (-not $serviceKey) { throw 'Service-role credential unavailable.' }
  $serviceKey | & gh secret set BACKUP_SUPABASE_SERVICE_ROLE_KEY --repo $Repository
  if ($LASTEXITCODE -ne 0) { throw 'Unable to save private Storage credential.' }
  "https://$ProjectRef.supabase.co" | & gh secret set BACKUP_SUPABASE_URL --repo $Repository
  if ($LASTEXITCODE -ne 0) { throw 'Unable to save Storage backup project URL.' }
  Write-Host 'Storage backup credentials configured privately in GitHub Actions.'
} finally { $captured=$null; $inventory=$null; $serviceKey=$null }
