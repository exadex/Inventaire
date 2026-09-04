param(
  [Parameter(Mandatory = $true)][string]$LocalRecoveryPath,
  [Parameter(Mandatory = $true)][string]$BaseSha,
  [string]$RemoteRef = "origin/main",
  [string]$OutputRoot = "recovery"
)

$ErrorActionPreference = "Stop"
$utf8 = New-Object System.Text.UTF8Encoding($false)

function Read-GitJson([string]$Spec) {
  $text = (& git show $Spec) -join "`n"
  if ($LASTEXITCODE -ne 0) { throw "Impossible de lire $Spec" }
  return @{ Text = $text + "`n"; Data = $text | ConvertFrom-Json }
}

function Canonical($Value) {
  if ($null -eq $Value) { return "<null>" }
  return ($Value | ConvertTo-Json -Compress -Depth 100)
}

function Item-Map($Rows) {
  $map = @{}
  foreach ($row in @($Rows)) { $map[[string]$row.id] = $row }
  return $map
}

function Write-Utf8([string]$Path, [string]$Content) {
  [System.IO.File]::WriteAllText($Path, $Content, $utf8)
}

$localText = [System.IO.File]::ReadAllText($LocalRecoveryPath, $utf8)
$local = $localText | ConvertFrom-Json
$baseBlob = Read-GitJson $BaseSha
$remoteBlobSha = (& git rev-parse "${RemoteRef}:shared_data.json").Trim()
if ($LASTEXITCODE -ne 0) { throw "Impossible de déterminer le blob distant." }
$remoteBlob = Read-GitJson "${RemoteRef}:shared_data.json"
$base = $baseBlob.Data
$remote = $remoteBlob.Data

$baseItems = Item-Map $base.inventoryItems
$localItems = Item-Map $local.inventoryItems
$remoteItems = Item-Map $remote.inventoryItems
$allIds = @($baseItems.Keys + $localItems.Keys + $remoteItems.Keys | Sort-Object -Unique)
$localChanged = New-Object System.Collections.Generic.List[string]
$remoteChanged = New-Object System.Collections.Generic.List[string]
$localAdded = New-Object System.Collections.Generic.List[string]
$remoteAdded = New-Object System.Collections.Generic.List[string]
$localDeleted = New-Object System.Collections.Generic.List[string]
$remoteDeleted = New-Object System.Collections.Generic.List[string]
$conflicts = New-Object System.Collections.Generic.List[object]

foreach ($id in $allIds) {
  $hasBase = $baseItems.ContainsKey($id)
  $hasLocal = $localItems.ContainsKey($id)
  $hasRemote = $remoteItems.ContainsKey($id)
  if (-not $hasBase) {
    if ($hasLocal) { $localAdded.Add($id) }
    if ($hasRemote) { $remoteAdded.Add($id) }
    if ($hasLocal -and $hasRemote -and (Canonical $localItems[$id]) -ne (Canonical $remoteItems[$id])) {
      $conflicts.Add([pscustomobject]@{ type = "item-added-differently"; id = $id })
    }
    continue
  }
  if (-not $hasLocal) { $localDeleted.Add($id) }
  if (-not $hasRemote) { $remoteDeleted.Add($id) }
  $localDiff = $hasLocal -and (Canonical $baseItems[$id]) -ne (Canonical $localItems[$id])
  $remoteDiff = $hasRemote -and (Canonical $baseItems[$id]) -ne (Canonical $remoteItems[$id])
  if ($localDiff) { $localChanged.Add($id) }
  if ($remoteDiff) { $remoteChanged.Add($id) }
  if (-not $hasLocal -and $remoteDiff) { $conflicts.Add([pscustomobject]@{ type = "local-delete-remote-change"; id = $id }) }
  elseif (-not $hasRemote -and $localDiff) { $conflicts.Add([pscustomobject]@{ type = "remote-delete-local-change"; id = $id }) }
  elseif ($localDiff -and $remoteDiff -and (Canonical $localItems[$id]) -ne (Canonical $remoteItems[$id])) {
    $conflicts.Add([pscustomobject]@{ type = "item-changed-both"; id = $id })
  }
}

$merged = $remoteBlob.Text | ConvertFrom-Json
$mergedItems = New-Object System.Collections.Generic.List[object]
foreach ($item in @($remote.inventoryItems)) {
  $id = [string]$item.id
  if ($localDeleted.Contains($id)) { continue }
  if ($localChanged.Contains($id)) { $mergedItems.Add($localItems[$id]) } else { $mergedItems.Add($item) }
}
foreach ($id in $localAdded) {
  if (-not $remoteItems.ContainsKey($id)) { $mergedItems.Add($localItems[$id]) }
}
$merged.inventoryItems = $mergedItems.ToArray()

$sharedTopLevel = @("locationCatalog", "orders", "experiments", "clientSamples", "clients", "supplierContacts", "stockMovements", "stockOperations", "agentOperations")
foreach ($property in $sharedTopLevel) {
  $baseValue = Canonical $base.$property
  $localValue = Canonical $local.$property
  $remoteValue = Canonical $remote.$property
  $localDiff = $localValue -ne $baseValue
  $remoteDiff = $remoteValue -ne $baseValue
  if ($localDiff -and $remoteDiff -and $localValue -ne $remoteValue) {
    $conflicts.Add([pscustomobject]@{ type = "top-level-changed-both"; id = $property })
  } elseif ($localDiff -and -not $remoteDiff) {
    $merged.$property = $local.$property
  }
}

$baseHistory = @{}
foreach ($entry in @($base.history)) { $baseHistory[(Canonical $entry)] = $true }
$localOnlyHistory = @($local.history | Where-Object { -not $baseHistory.ContainsKey((Canonical $_)) })
$remoteOnlyHistory = @($remote.history | Where-Object { -not $baseHistory.ContainsKey((Canonical $_)) })
$merged.history = @($localOnlyHistory + $remoteOnlyHistory + @($base.history))
$merged.updatedAt = $local.updatedAt

if ($conflicts.Count -gt 0) {
  throw "Fusion interrompue : $($conflicts.Count) conflit(s) détecté(s)."
}

$stamp = Get-Date -Format "yyyy-MM-dd-HH-mm-ss"
$output = Join-Path $OutputRoot $stamp
[System.IO.Directory]::CreateDirectory($output) | Out-Null
Write-Utf8 (Join-Path $output "base-$BaseSha.json") $baseBlob.Text
Write-Utf8 (Join-Path $output "local-recovery.json") $localText
Write-Utf8 (Join-Path $output "remote-$remoteBlobSha.json") $remoteBlob.Text
Write-Utf8 (Join-Path $output "merged-candidate.json") (($merged | ConvertTo-Json -Depth 100) + "`n")

$report = [pscustomobject]@{
  generatedAt = (Get-Date).ToString("o")
  baseSha = $BaseSha
  remoteRef = $RemoteRef
  remoteBlobSha = $remoteBlobSha
  localUpdatedAt = $local.updatedAt
  remoteUpdatedAt = $remote.updatedAt
  counts = [pscustomobject]@{
    baseItems = @($base.inventoryItems).Count
    localItems = @($local.inventoryItems).Count
    remoteItems = @($remote.inventoryItems).Count
    mergedItems = @($merged.inventoryItems).Count
    localChangedItems = $localChanged.Count
    remoteChangedItems = $remoteChanged.Count
    localAddedItems = $localAdded.Count
    remoteAddedItems = $remoteAdded.Count
    localDeletedItems = $localDeleted.Count
    remoteDeletedItems = $remoteDeleted.Count
    localHistoryAdditions = $localOnlyHistory.Count
    remoteHistoryAdditions = $remoteOnlyHistory.Count
    mergedHistory = @($merged.history).Count
    conflicts = $conflicts.Count
  }
  localDeletedItems = @($localDeleted.ToArray() | ForEach-Object { [pscustomobject]@{ id = $_; name = $baseItems[$_].name } })
  localChangedItemIds = $localChanged.ToArray()
  remoteChangedItemIds = $remoteChanged.ToArray()
  conflicts = $conflicts.ToArray()
}
Write-Utf8 (Join-Path $output "merge-report.json") (($report | ConvertTo-Json -Depth 100) + "`n")

$hashes = Get-ChildItem $output -File | ForEach-Object {
  [pscustomobject]@{ file = $_.Name; sha256 = (Get-FileHash $_.FullName -Algorithm SHA256).Hash; bytes = $_.Length }
}
$hashes | Format-Table -AutoSize
"OUTPUT=$([System.IO.Path]::GetFullPath($output))"
"REPORT=$($report | ConvertTo-Json -Compress -Depth 100)"
