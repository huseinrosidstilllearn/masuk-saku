param(
  [string]$ProjectName = 'masuk-saku-development',
  [string]$AccountId
)
$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
$previousAccountId = $env:CLOUDFLARE_ACCOUNT_ID
Push-Location -LiteralPath $projectRoot
try {
  if ($AccountId) { $env:CLOUDFLARE_ACCOUNT_ID = $AccountId }
  & npm run build:development -- --outDir work/cloudflare-development
  if ($LASTEXITCODE -ne 0) { throw 'Development build failed.' }
  & node scripts/pages-preflight.mjs work/cloudflare-development
  if ($LASTEXITCODE -ne 0) { throw 'Artifact checks failed.' }
  # Explicit Pages CLI version: newer Wrangler delegated Pages creation to Workers.
  & npx --yes wrangler@4.112.0 pages deploy work/cloudflare-development --project-name $ProjectName --branch main
  if ($LASTEXITCODE -ne 0) { throw 'Cloudflare Pages deployment failed.' }
} finally {
  $env:CLOUDFLARE_ACCOUNT_ID = $previousAccountId
  Pop-Location
}
