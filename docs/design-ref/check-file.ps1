$path = "c:\Users\Administrator\Desktop\star-citizen-promotion\docs\design-ref\section-1-hero.png"
$bytes = [System.IO.File]::ReadAllBytes($path)
$hex = ($bytes[0..7] | ForEach-Object { $_.ToString("X2") }) -join " "
Write-Host "First 8 bytes: $hex"
if ($bytes[0] -eq 0x89 -and $bytes[1] -eq 0x50 -and $bytes[2] -eq 0x4E -and $bytes[3] -eq 0x47) {
  Write-Host "Valid PNG file"
} else {
  Write-Host "NOT a PNG file. First 200 chars:"
  $text = [System.Text.Encoding]::UTF8.GetString($bytes[0..199])
  Write-Host $text
}
