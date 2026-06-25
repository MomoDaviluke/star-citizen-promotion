$outDir = "c:\Users\Administrator\Desktop\star-citizen-promotion\docs\design-ref"
$files = @(
  "section-1-hero.png",
  "section-2-fleet.png",
  "section-3-stats.png",
  "section-4-pilot.png",
  "section-5-gallery.png",
  "section-6-dossier.png",
  "section-7-terminal.png",
  "section-8-contact-footer.png"
)

foreach ($f in $files) {
  $path = Join-Path $outDir $f
  $bytes = [System.IO.File]::ReadAllBytes($path)
  $size = $bytes.Length
  $isJpeg = ($bytes[0] -eq 0xFF -and $bytes[1] -eq 0xD8)
  $isPng = ($bytes[0] -eq 0x89 -and $bytes[1] -eq 0x50)
  $isJson = $false
  try {
    $text = [System.Text.Encoding]::UTF8.GetString($bytes[0..4])
    if ($text -match "^\{") { $isJson = $true }
  } catch {}
  $type = if ($isPng) { "PNG" } elseif ($isJpeg) { "JPEG" } elseif ($isJson) { "JSON" } else { "UNKNOWN" }
  Write-Host "$f : $size bytes, type=$type"
}
