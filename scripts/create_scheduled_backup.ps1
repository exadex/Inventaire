param(
  [string]$Source = "shared_data.json",
  [string]$OutputRoot = "backups",
  [datetime]$NowUtc = [datetime]::UtcNow,
  [switch]$ForceWeekly,
  [switch]$ForceMonthly,
  [switch]$Replace
)

$ErrorActionPreference = "Stop"
$sourcePath = (Resolve-Path -LiteralPath $Source).Path
$outputPath = if ([System.IO.Path]::IsPathRooted($OutputRoot)) {
  [System.IO.Path]::GetFullPath($OutputRoot)
} else {
  [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $OutputRoot))
}

try { $parisZone = [System.TimeZoneInfo]::FindSystemTimeZoneById("Europe/Paris") }
catch { $parisZone = [System.TimeZoneInfo]::FindSystemTimeZoneById("Romance Standard Time") }

$utc = if ($NowUtc.Kind -eq [DateTimeKind]::Utc) { $NowUtc } else { $NowUtc.ToUniversalTime() }
$parisNow = [System.TimeZoneInfo]::ConvertTimeFromUtc($utc, $parisZone)
$inScheduledWindow = $parisNow.Hour -ge 6 -and $parisNow.Hour -le 10
$makeWeekly = $ForceWeekly -or ($inScheduledWindow -and $parisNow.DayOfWeek -eq [DayOfWeek]::Monday)
$makeMonthly = $ForceMonthly -or ($inScheduledWindow -and $parisNow.Day -eq 1)

if (-not $makeWeekly -and -not $makeMonthly) {
  Write-Output "No backup scheduled for $($parisNow.ToString('yyyy-MM-dd HH:mm')) Europe/Paris."
  exit 0
}

$data = Get-Content -Raw -Encoding utf8 -LiteralPath $sourcePath | ConvertFrom-Json
$stamp = $parisNow.ToString("yyyy-MM-dd_HH-mm")
$createdAt = $utc.ToString("o")
$summary = [ordered]@{
  inventoryItems = @($data.inventoryItems).Count
  clientSamples = @($data.clientSamples).Count
  locations = @($data.locationCatalog.locations).Count
  experiments = @($data.experiments).Count
  orders = @($data.orders).Count
  contacts = @($data.supplierContacts).Count
  history = @($data.history).Count
}

function Write-Backup([string]$Folder, [object]$Payload) {
  $directory = Join-Path $outputPath $Folder
  New-Item -ItemType Directory -Force -Path $directory | Out-Null
  $target = Join-Path $directory "$stamp.json"
  $sameDay = @(Get-ChildItem -LiteralPath $directory -Filter "$($parisNow.ToString('yyyy-MM-dd'))_*.json" -File -ErrorAction SilentlyContinue)
  if ($sameDay.Count -and -not $Replace) {
    Write-Output "Backup already exists for this date: $($sameDay[0].FullName)"
    return
  }
  if ((Test-Path -LiteralPath $target) -and -not $Replace) {
    Write-Output "Backup already exists: $target"
    return
  }
  $Payload | ConvertTo-Json -Depth 100 | Set-Content -Encoding utf8 -LiteralPath $target
  Write-Output "Created: $target"
}

if ($makeWeekly) {
  Write-Backup "inventory" ([ordered]@{
    backupVersion = 1
    type = "inventory"
    createdAt = $createdAt
    createdBy = "Sauvegarde automatique"
    summary = [ordered]@{ inventoryItems = @($data.inventoryItems).Count }
    inventoryItems = @($data.inventoryItems)
  })
}

if ($makeMonthly) {
  Write-Backup "full" ([ordered]@{
    backupVersion = 1
    type = "full"
    createdAt = $createdAt
    createdBy = "Sauvegarde automatique"
    summary = $summary
    snapshot = $data
  })
}
