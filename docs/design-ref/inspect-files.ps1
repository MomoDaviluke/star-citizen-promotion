[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# Check what the previously downloaded files actually contain
$path = "c:\Users\Administrator\Desktop\star-citizen-promotion\docs\design-ref\section-1-hero.png"
$bytes = [System.IO.File]::ReadAllBytes($path)
Write-Host "File size: $($bytes.Length) bytes"
Write-Host "First 8 bytes (hex):"
$hex = ($bytes[0..7] | ForEach-Object { $_.ToString("X2") }) -join " "
Write-Host $hex

# It's JPEG - check if it's a real image or an error page
# Try to read as text for first 500 bytes to see if there's readable text
$text = [System.Text.Encoding]::ASCII.GetString($bytes[0..499])
Write-Host "`nASCII text in first 500 bytes:"
Write-Host $text

# Also check if all files are truly identical
$files = @(
  "section-1-hero.png",
  "section-2-fleet.png",
  "section-3-stats.png"
)
$hashes = @{}
foreach ($f in $files) {
  $p = Join-Path "c:\Users\Administrator\Desktop\star-citizen-promotion\docs\design-ref" $f
  $hash = (Get-FileHash -Path $p -Algorithm MD5).Hash
  $hashes[$f] = $hash
  Write-Host "$f MD5: $hash"
}
