param(
  [string]$Source = "shared_data.json",
  [string]$OutputRoot = "backups",
  [string]$ArchiveRoot = "archive",
  [int]$ArchiveCutoffDays = 60,
  [datetime]$NowUtc = [datetime]::UtcNow,
  [switch]$ForceWeekly,
  [switch]$ForceMonthly,
  [switch]$ForceArchive,
  [switch]$Replace
)

$ErrorActionPreference = "Stop"
$sourcePath = (Resolve-Path -LiteralPath $Source).Path
$outputPath = if ([System.IO.Path]::IsPathRooted($OutputRoot)) {
  [System.IO.Path]::GetFullPath($OutputRoot)
} else {
  [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $OutputRoot))
}
$archivePath = if ([System.IO.Path]::IsPathRooted($ArchiveRoot)) {
  [System.IO.Path]::GetFullPath($ArchiveRoot)
} else {
  [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $ArchiveRoot))
}

try { $parisZone = [System.TimeZoneInfo]::FindSystemTimeZoneById("Europe/Paris") }
catch { $parisZone = [System.TimeZoneInfo]::FindSystemTimeZoneById("Romance Standard Time") }

$utc = if ($NowUtc.Kind -eq [DateTimeKind]::Utc) { $NowUtc } else { $NowUtc.ToUniversalTime() }
$parisNow = [System.TimeZoneInfo]::ConvertTimeFromUtc($utc, $parisZone)
# Pas de fenêtre horaire stricte : GitHub Actions peut livrer le déclenchement "schedule"
# plusieurs heures en retard, donc on se base uniquement sur le jour Europe/Paris.
# Write-Backup déduplique déjà par date, un déclenchement tardif ou répété le même jour
# ne crée donc pas de doublon.
$isSaturday = $parisNow.DayOfWeek -eq [DayOfWeek]::Saturday
$isSunday = $parisNow.DayOfWeek -eq [DayOfWeek]::Sunday
$makeWeekly = $ForceWeekly -or $isSunday
$makeMonthly = $ForceMonthly -or ($isSunday -and $parisNow.Day -le 7)
# L'archivage tourne le samedi, la veille des sauvegardes du dimanche, pour que les
# deux tâches ne s'exécutent jamais le même jour.
$makeArchive = $ForceArchive -or $isSaturday

if (-not $makeWeekly -and -not $makeMonthly -and -not $makeArchive) {
  Write-Output "No backup or archive scheduled for $($parisNow.ToString('yyyy-MM-dd HH:mm')) Europe/Paris."
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

# Archivage hebdomadaire (samedi) : history et stockMovements sont des journaux qui ne
# font que grandir (jamais modifiés ni relus pour une décision métier). Au-delà de
# $ArchiveCutoffDays, on les déplace vers archive/ pour éviter que shared_data.json ne
# grossisse indéfiniment. Exécuté la veille des sauvegardes du dimanche : la sauvegarde
# "full" mensuelle capture donc l'état déjà recadré, les entrées plus anciennes restant
# récupérables dans archive/.
if ($makeArchive) {
  # shared_data.json est lu par l'app via fetch()/JSON.parse() sans tolérance de BOM
  # sur tous les chemins ; Set-Content -Encoding utf8 ajoute un BOM en PowerShell 5.1,
  # donc on écrit nous-mêmes en UTF-8 sans BOM pour ne pas casser la lecture.
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  function Write-Utf8NoBom([string]$Path, [string]$Content) {
    [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
  }

  function Get-FrenchHistoryDate([string]$value) {
    if ([string]::IsNullOrWhiteSpace($value)) { return $null }
    $result = [datetime]::MinValue
    $ok = [datetime]::TryParseExact(
      $value, "dd/MM/yyyy HH:mm",
      [System.Globalization.CultureInfo]::InvariantCulture,
      [System.Globalization.DateTimeStyles]::None, [ref]$result
    )
    if ($ok) { return $result }
    return $null
  }

  # Un fichier daté par lot archivé, sur le même principe que Write-Backup ci-dessus
  # (dédup "un fichier par jour" déjà éprouvée) : plus simple et plus sûr qu'une fusion
  # avec déduplication manuelle, qui s'est révélée fragile à l'exécution.
  function Write-ArchiveFile([string]$Folder, [array]$Entries) {
    if (-not $Entries -or $Entries.Count -eq 0) { return }
    $directory = Join-Path $archivePath $Folder
    New-Item -ItemType Directory -Force -Path $directory | Out-Null
    $target = Join-Path $directory "$stamp.json"
    $sameDay = @(Get-ChildItem -LiteralPath $directory -Filter "$($parisNow.ToString('yyyy-MM-dd'))_*.json" -File -ErrorAction SilentlyContinue)
    if ($sameDay.Count -and -not $Replace) {
      Write-Output "Archive already exists for this date: $($sameDay[0].FullName)"
      return
    }
    Write-Utf8NoBom -Path $target -Content ($Entries | ConvertTo-Json -Depth 100)
    Write-Output "Archived $($Entries.Count) entries into $target"
  }

  $cutoff = $parisNow.AddDays(-$ArchiveCutoffDays)

  $historyAll = @($data.history)
  $historyOld = @($historyAll | Where-Object { ($d = Get-FrenchHistoryDate $_.date) -and $d -lt $cutoff })
  $historyKeep = @($historyAll | Where-Object { -not (($d = Get-FrenchHistoryDate $_.date) -and $d -lt $cutoff) })

  $movementsAll = @($data.stockMovements)
  $movementsOld = @($movementsAll | Where-Object { $_.timestamp -and ([datetime]$_.timestamp) -lt $cutoff })
  $movementsKeep = @($movementsAll | Where-Object { -not ($_.timestamp -and ([datetime]$_.timestamp) -lt $cutoff) })

  if ($historyOld.Count -gt 0 -or $movementsOld.Count -gt 0) {
    Write-ArchiveFile "history" $historyOld
    Write-ArchiveFile "stockMovements" $movementsOld

    $data.history = $historyKeep
    $data.stockMovements = $movementsKeep
    Write-Utf8NoBom -Path $sourcePath -Content ($data | ConvertTo-Json -Depth 100)
    Write-Output "Trimmed shared_data.json: history $($historyAll.Count) -> $($historyKeep.Count), stockMovements $($movementsAll.Count) -> $($movementsKeep.Count)"
  } else {
    Write-Output "Nothing older than $ArchiveCutoffDays days to archive."
  }
}
