param([string]$AccountId, [string]$ProjectName = 'masuk-saku-production')
$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$previousAccountId = $env:CLOUDFLARE_ACCOUNT_ID
Push-Location -LiteralPath $projectRoot
try {
  if ($AccountId) { $env:CLOUDFLARE_ACCOUNT_ID = $AccountId }
  & npm run build -- --outDir work/cloudflare-production
  if ($LASTEXITCODE -ne 0) { throw 'Production build failed.' }
  & node scripts/pages-preflight.mjs work/cloudflare-production production
  if ($LASTEXITCODE -ne 0) { throw 'Production artifact checks failed.' }
  & npx --yes wrangler@4.112.0 pages deploy work/cloudflare-production --project-name $ProjectName --branch main
  if ($LASTEXITCODE -ne 0) { throw 'Production Pages deploy failed.' }
} finally {
  $env:CLOUDFLARE_ACCOUNT_ID = $previousAccountId
  Pop-Location
}
