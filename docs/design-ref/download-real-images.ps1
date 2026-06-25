[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$outDir = "c:\Users\Administrator\Desktop\star-citizen-promotion\docs\design-ref"

$tasks = @(
  @{ File = "section-1-hero.png"; Url = "https://aka.doubaocdn.com/s/HTSw1waVsg" },
  @{ File = "section-2-fleet.png"; Url = "https://aka.doubaocdn.com/s/4aht1waVsm" },
  @{ File = "section-3-stats.png"; Url = "https://aka.doubaocdn.com/s/s8B71waVsr" },
  @{ File = "section-4-pilot.png"; Url = "https://aka.doubaocdn.com/s/LLOt1waVsv" },
  @{ File = "section-5-gallery.png"; Url = "https://aka.doubaocdn.com/s/QpPy1waVt7" },
  @{ File = "section-6-dossier.png"; Url = "https://aka.doubaocdn.com/s/JTwz1waVtC" },
  @{ File = "section-7-terminal.png"; Url = "https://aka.doubaocdn.com/s/MTsb1waVtI" },
  @{ File = "section-8-contact-footer.png"; Url = "https://aka.doubaocdn.com/s/hTmi1waVtM" }
)

foreach ($task in $tasks) {
  $outPath = Join-Path $outDir $task.File
  Write-Host "Downloading $($task.File) from $($task.Url)..."
  try {
    Invoke-WebRequest -Uri $task.Url -OutFile $outPath -TimeoutSec 120
    $len = (Get-Item $outPath).Length
    $bytes = [System.IO.File]::ReadAllBytes($outPath)
    $isPng = ($bytes[0] -eq 0x89 -and $bytes[1] -eq 0x50)
    $isJpeg = ($bytes[0] -eq 0xFF -and $bytes[1] -eq 0xD8)
    $type = if ($isPng) { "PNG" } elseif ($isJpeg) { "JPEG" } else { "OTHER" }
    Write-Host "  OK - $len bytes, type=$type"
  } catch {
    Write-Host "  FAILED: $_"
  }
}

Write-Host "`nFinal listing:"
Get-ChildItem $outDir -Filter "section-*.png" | Sort-Object Name | ForEach-Object { Write-Host "  $($_.Name) - $($_.Length) bytes" }
