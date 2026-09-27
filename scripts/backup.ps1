# Weekly encrypted PostgreSQL backup. pg_dump and age must be on PATH.
[CmdletBinding()]
param([string]$Destination = (Join-Path $PSScriptRoot '..\backups'))
$ErrorActionPreference = 'Stop'
foreach ($requiredName in @('PGHOST','PGUSER','PGPASSWORD','PGDATABASE','BACKUP_AGE_RECIPIENT')) {
    if (-not [Environment]::GetEnvironmentVariable($requiredName)) { throw "Missing environment variable: $requiredName" }
}
Get-Command pg_dump, age -ErrorAction Stop | Out-Null
$backupTarget = [System.IO.Path]::GetFullPath($Destination)
New-Item -ItemType Directory -Path $backupTarget -Force | Out-Null
$stamp = [DateTime]::UtcNow.ToString('yyyyMMddTHHmmssZ')
$plainPath = Join-Path $backupTarget "masuk-saku-$stamp.dump"
$encryptedPath = "$plainPath.age"
$env:PGSSLMODE = if ($env:PGSSLMODE) { $env:PGSSLMODE } else { 'require' }
try {
    & pg_dump --format=custom --no-owner --no-acl --schema=public --schema=auth --schema=private --schema=storage --file=$plainPath
    if ($LASTEXITCODE -ne 0) { throw 'Database backup failed' }
    & age --recipient $env:BACKUP_AGE_RECIPIENT --output $encryptedPath $plainPath
    if ($LASTEXITCODE -ne 0) { throw 'Backup encryption failed' }
    Get-FileHash -LiteralPath $encryptedPath -Algorithm SHA256 | Select-Object Hash,Path
} finally {
    # Verified absolute path under explicitly selected destination; never recursive.
    $resolvedPlain = [System.IO.Path]::GetFullPath($plainPath)
    if ($resolvedPlain.StartsWith($backupTarget.TrimEnd([IO.Path]::DirectorySeparatorChar) + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
        if (Test-Path -LiteralPath $resolvedPlain) { Remove-Item -LiteralPath $resolvedPlain -Force }
    }
}

