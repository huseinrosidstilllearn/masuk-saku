# Interactive operator setup. Never pass passwords as command arguments or print them.
[CmdletBinding()]
param(
  [string]$Repository = 'huseinrosidstilllearn/masuk-saku',
  [string]$DatabaseHost = '',
  [string]$DatabaseUser = ''
)
$ErrorActionPreference = 'Stop'
$taskRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$keygen = Get-Command age-keygen -ErrorAction SilentlyContinue
if (-not $keygen) {
  $keygenPath = Join-Path $env:LOCALAPPDATA 'Microsoft\WinGet\Links\age-keygen.exe'
  if (-not (Test-Path -LiteralPath $keygenPath)) { throw 'Install age first: winget install --id FiloSottile.age' }
} else { $keygenPath = $keygen.Source }
Get-Command gh -ErrorAction Stop | Out-Null
& gh repo view $Repository --json nameWithOwner | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Repository unavailable; log in using gh auth login.' }
$privateDirectory = Join-Path $taskRoot 'work\backup-recovery'
New-Item -ItemType Directory -Path $privateDirectory -Force | Out-Null
$currentIdentity = [Security.Principal.WindowsIdentity]::GetCurrent().Name
& icacls $privateDirectory /inheritance:r /grant:r "${currentIdentity}:(OI)(CI)F" 'SYSTEM:(OI)(CI)F' | Out-Null
if ($LASTEXITCODE -ne 0) { throw 'Could not restrict recovery-directory access.' }
$identityFile = Join-Path $privateDirectory 'weekly-backup-identity.key'
if (-not (Test-Path -LiteralPath $identityFile)) {
  & $keygenPath -o $identityFile
  if ($LASTEXITCODE -ne 0) { throw 'Identity generation failed.' }
}
$recipient = (& $keygenPath -y $identityFile).Trim()
if ($LASTEXITCODE -ne 0 -or $recipient -notmatch '^age1[a-z0-9]+$') { throw 'Invalid age recipient.' }
$ageExecutable = Join-Path (Split-Path -Parent $keygenPath) 'age.exe'
if (-not (Test-Path -LiteralPath $ageExecutable)) { throw 'age encryption executable unavailable.' }
$machineRecovery = Join-Path $taskRoot 'work\production-secrets\edge.recovery.dpapi.txt'
if (Test-Path -LiteralPath $machineRecovery) {
  $portableRecovery = Join-Path $privateDirectory ('server-recovery-' + [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssZ') + '.env.age')
  $protectedRecovery = (Get-Content -LiteralPath $machineRecovery -Raw).Trim() | ConvertTo-SecureString
  try {
    $recoveredEnvironment = [Net.NetworkCredential]::new('', $protectedRecovery).Password
    $recoveredEnvironment | & $ageExecutable --recipient $recipient --output $portableRecovery
    if ($LASTEXITCODE -ne 0) { throw 'Portable server-secret encryption failed.' }
  } finally { $recoveredEnvironment = $null; $protectedRecovery.Dispose() }
  Write-Host "Encrypted portable server recovery: $portableRecovery"
  Write-Host 'Keep this encrypted file with a separate recovery copy. Its decryption identity remains private.'
}
Write-Host 'Open Supabase Production > Connect > Session pooler (port5432). Do not use transaction pooler6543.'
$backupHost = $DatabaseHost.Trim()
$backupUser = $DatabaseUser.Trim()
if (-not $backupHost) { $backupHost = (Read-Host 'Session pooler hostname (without password/URL)').Trim() }
if (-not $backupUser) { $backupUser = (Read-Host 'Database username, usually postgres.PROJECT_REF').Trim() }
if ($backupHost -notmatch '^[a-zA-Z0-9.-]+$' -or $backupUser -notmatch '^[a-zA-Z0-9._-]+$') { throw 'Invalid hostname or username.' }
$password = Read-Host 'Production DATABASE password (input hidden)' -AsSecureString
try {
  $secretValues = @{
    BACKUP_PGHOST = $backupHost
    BACKUP_PGPORT = '5432'
    BACKUP_PGUSER = $backupUser
    BACKUP_AGE_RECIPIENT = $recipient
  }
  foreach ($item in $secretValues.GetEnumerator()) {
    $item.Value | & gh secret set $item.Key --repo $Repository
    if ($LASTEXITCODE -ne 0) { throw "Failed to save $($item.Key)." }
  }
  $plainPassword = [Net.NetworkCredential]::new('', $password).Password
  $plainPassword | & gh secret set BACKUP_PGPASSWORD --repo $Repository
  if ($LASTEXITCODE -ne 0) { throw 'Failed to save database password.' }
} finally { $plainPassword = $null; if ($password) { $password.Dispose() } }
Write-Host "Private decryption identity: $identityFile"
Write-Host 'Keep a separate recovery copy in your password manager/offline secure storage. Never upload this identity to GitHub or chat.'
& gh workflow run backup.yml --repo $Repository
if ($LASTEXITCODE -ne 0) { throw 'Secrets saved, but manual backup dispatch failed.' }
Write-Host 'Backup dispatched. A successful job and restore rehearsal are still required.'
