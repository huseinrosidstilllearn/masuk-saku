# Template content/subjects only. Preserves SMTP, callbacks, providers and notification toggles.
$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$profileRoot = Join-Path $projectRoot 'work\auth-email-cli'
$profileSupabase = Join-Path $profileRoot 'supabase'
Push-Location -LiteralPath $projectRoot
try {
  & node scripts/build-auth-emails.mjs
  if ($LASTEXITCODE -ne 0) { throw 'Email build failed.' }
  New-Item -ItemType Directory -Path (Join-Path $profileSupabase 'templates') -Force | Out-Null
  Get-ChildItem -LiteralPath 'supabase/templates' -Filter '*.html' | Where-Object { $_.Name -ne 'preview.html' } | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $profileSupabase 'templates')
  }
  $fragment = Get-Content -LiteralPath 'supabase/templates/config.fragment.toml' -Raw
  Set-Content -LiteralPath (Join-Path $profileSupabase 'config.toml') -Value ('project_id = "masuk-saku-production-email"' + "`n" + $fragment) -Encoding utf8
  $diffText = & npx --yes supabase@2.118.0 config diff --project-ref snqkfrcxjfdjkwxjiabc --workdir $profileRoot --output-format json
  if ($LASTEXITCODE -ne 0) { throw 'Production email diff failed.' }
  $diff = ($diffText -join "`n") | ConvertFrom-Json
  foreach ($change in $diff.changes | Where-Object { $_.declared -and $_.class -in @('update','local_only') }) {
    $field = $change.path -join '.'
    if ($field -notmatch '^auth\.email\.(template|notification)\.[a-z_]+\.(subject|content_path)$') {
      throw ('Unexpected declared change blocked: ' + $field)
    }
  }
  # Push also resolves the 13 content_path files; config diff compares subjects only.
  $pushOutput = & npx --yes supabase@2.118.0 config push --project-ref snqkfrcxjfdjkwxjiabc --workdir $profileRoot --yes 2>&1
  if ($LASTEXITCODE -ne 0) { throw ('Production email push failed: ' + ($pushOutput -join "`n")) }
  Write-Output 'Production email subjects/content pushed; no email sent. See verification log for readback.'
} finally {
  Pop-Location
}
