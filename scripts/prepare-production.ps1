# Read-only remote preparation. Does not publish, push migrations or rotate secrets.
$ErrorActionPreference = 'Stop'
$projectRoot = (Resolve-Path -LiteralPath (Join-Path $PSScriptRoot '..')).Path
Push-Location -LiteralPath $projectRoot
try {
  & npm run build -- --outDir work/cloudflare-production
  if ($LASTEXITCODE -ne 0) { throw 'Production build failed.' }
  & node scripts/pages-preflight.mjs work/cloudflare-production production
  if ($LASTEXITCODE -ne 0) { throw 'Production artifact checks failed.' }
  $cliDirectory = Join-Path $projectRoot 'work\production-cli'
  $supabaseDirectory = Join-Path $cliDirectory 'supabase'
  New-Item -ItemType Directory -Path (Join-Path $supabaseDirectory 'migrations') -Force | Out-Null
  $sourceConfig = Get-Content -LiteralPath 'supabase/config.toml' -Raw
  $productionConfig = $sourceConfig.Replace('project_id = "masuk-saku"','project_id = "masuk-saku-production"')
  $productionConfig = $productionConfig.Replace('site_url = "https://masuk-saku-development.pages.dev"','site_url = "https://masuksaku.my.id"')
  $productionConfig = $productionConfig.Replace('additional_redirect_urls = ["https://masuk-saku-development.pages.dev", "http://127.0.0.1:5173", "http://localhost:5173"]','additional_redirect_urls = ["https://masuksaku.my.id"]')
  if ($productionConfig.Contains('masuk-saku-development.pages.dev') -or $productionConfig.Contains('localhost:5173') -or $productionConfig.Contains('127.0.0.1:5173')) {
    throw 'Unexpected Development redirect in Production config.'
  }
  Set-Content -LiteralPath (Join-Path $supabaseDirectory 'config.toml') -Value $productionConfig -Encoding utf8
  Get-ChildItem -LiteralPath 'supabase/migrations' -Filter '*.sql' | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $supabaseDirectory 'migrations')
  }
  # Copy code only; never copy the Development .env.local to Production.
  $functionsSource = (Resolve-Path -LiteralPath 'supabase/functions').Path
  Get-ChildItem -LiteralPath $functionsSource -Recurse -File | Where-Object {
    $_.Extension -in @('.ts','.json','.lock')
  } | ForEach-Object {
    $relative = [IO.Path]::GetRelativePath($functionsSource,$_.FullName)
    $target = Join-Path (Join-Path $supabaseDirectory 'functions') $relative
    New-Item -ItemType Directory -Path (Split-Path -Parent $target) -Force | Out-Null
    Copy-Item -LiteralPath $_.FullName -Destination $target
  }
  & npx --yes supabase@2.118.0 db push --project-ref snqkfrcxjfdjkwxjiabc --workdir $cliDirectory --dry-run --skip-vault
  if ($LASTEXITCODE -ne 0) { throw 'Production migration dry-run failed.' }
  Write-Output 'Production artifacts prepared. Remote services and DNS were not changed.'
} finally {
  Pop-Location
}
