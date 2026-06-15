# This script calls the API for each section, gets the redirect URL, then downloads the actual image
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$outDir = "c:\Users\Administrator\Desktop\star-citizen-promotion\docs\design-ref"

# Define all 8 sections with their prompts
$sections = @(
  @{
    File = "section-1-hero.png"
    Prompt = "Ultra premium dark sci-fi website hero section, full-bleed deep space nebula background with dramatic blue and purple cosmic clouds, massive bold white text STELLAR NEXUS positioned at bottom center in compressed display font, small cyan label STAR CITIZEN GUILD above title, subtle radial cyan glow emanating from behind text, floating glass navigation bar at top with pill shape, single scroll indicator arrow at bottom, cinematic dark vignette overlay, awwwards quality, OLED black theme with electric cyan and amber accents, professional AAA gaming website"
  },
  @{
    File = "section-2-fleet.png"
    Prompt = "Premium dark sci-fi website fleet showcase section, asymmetric bento grid layout on OLED black background, left side shows large spaceship image card with double-bezel glass frame and cyan glow border, right side shows two smaller stacked cards with ship stats in large white numbers and cyan labels, dramatic amber accent line on left edge, subtle noise texture overlay, awwwards quality, Star Citizen themed, electric cyan and amber on deep black"
  },
  @{
    File = "section-3-stats.png"
    Prompt = "Premium dark sci-fi website metrics section, horizontal strip of 4 oversized numbers on OLED black background with subtle radial gradient glow, numbers in massive bold white font, small cyan uppercase labels below each number, thin cyan horizontal line above numbers, generous whitespace, awwwards quality, Star Citizen themed dashboard, cinematic dark theme"
  },
  @{
    File = "section-4-pilot.png"
    Prompt = "Premium dark sci-fi website pilot showcase section, editorial split layout, left side shows dramatic pilot portrait with amber rim light and dark background, right side shows pilot name GHOST-1 in massive white text, cyan callsign below, ship details with progress bars in amber, double-bezel card frame with glass effect, subtle scan line texture, awwwards quality, Star Citizen character profile, cinematic dark theme"
  },
  @{
    File = "section-5-gallery.png"
    Prompt = "Premium dark sci-fi website ship gallery section, 4 ship cards in asymmetric grid on OLED black background, each card has large spaceship image with cyan holographic glow, ship name in white bold, role badge in amber, readiness progress bar at bottom with cyan fill, cards have double-bezel glass frames with subtle border glow, awwwards quality, Star Citizen fleet display, cinematic dark theme"
  },
  @{
    File = "section-6-dossier.png"
    Prompt = "Premium dark sci-fi about page section, left side shows three dossier cards stacked vertically with DOSSIER labels in electric cyan, large watermark numbers in background, right side shows sticky data panel with massive statistics in white with cyan accent labels, vertical cyan data-flow line between columns, subtle noise texture, awwwards quality, Star Citizen organization profile, OLED black theme"
  },
  @{
    File = "section-7-terminal.png"
    Prompt = "Premium dark sci-fi recruitment page section, left sidebar shows requirements checklist with cyan checkmarks and numbered process flow with amber step circles, right side shows large terminal-style application form with dark glass card frame, TERMINAL ACTIVE status in green, input fields with bottom-border cyan style, submit button with amber accent, subtle scan lines overlay, awwwards quality, Star Citizen enlistment terminal, OLED black theme"
  },
  @{
    File = "section-8-contact-footer.png"
    Prompt = "Premium dark sci-fi contact page and footer section, left side shows communication channels with Discord Email QQ icons in electric cyan, right side shows message form in double-bezel glass card, bottom footer with STELLAR NEXUS logo in white and cyan, navigation links, amber accent line separator, subtle star particles in background, awwwards quality, Star Citizen comm terminal, OLED black theme"
  }
)

$apiBase = "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image"

foreach ($section in $sections) {
  $encoded = [Uri]::EscapeDataString($section.Prompt)
  $url = "${apiBase}?prompt=${encoded}&image_size=landscape_16_9"
  $outPath = Join-Path $outDir $section.File

  Write-Host "Processing $($section.File)..."

  try {
    # Make request without following redirects
    $response = Invoke-WebRequest -Uri $url -MaximumRedirection 0 -ErrorAction SilentlyContinue

    # Check for redirect
    if ($response.StatusCode -ge 300 -and $response.StatusCode -lt 400) {
      $location = $response.Headers['Location']
      Write-Host "  Redirect to: $location"

      if ($location -match 'default\.jpeg$') {
        Write-Host "  WARNING: Got default image, API may have rejected the prompt"
      }

      # Download the actual image from redirect URL
      Invoke-WebRequest -Uri $location -OutFile $outPath -TimeoutSec 120
      $len = (Get-Item $outPath).Length
      Write-Host "  Downloaded: $len bytes"
    } else {
      # Direct response - save it
      [System.IO.File]::WriteAllBytes($outPath, $response.Content)
      Write-Host "  Direct download: $($response.Content.Length) bytes"
    }
  } catch {
    # PowerShell throws on redirect, catch and extract Location
    $ex = $_.Exception
    if ($ex.Response) {
      $loc = $ex.Response.Headers['Location']
      if ($loc) {
        Write-Host "  Redirect (from exception) to: $loc"
        Invoke-WebRequest -Uri $loc -OutFile $outPath -TimeoutSec 120
        $len = (Get-Item $outPath).Length
        Write-Host "  Downloaded: $len bytes"
      } else {
        Write-Host "  FAILED: No Location header in redirect"
      }
    } else {
      Write-Host "  FAILED: $ex.Message"
    }
  }
}

Write-Host "`nFinal verification:"
foreach ($section in $sections) {
  $path = Join-Path $outDir $section.File
  if (Test-Path $path) {
    $len = (Get-Item $path).Length
    $bytes = [System.IO.File]::ReadAllBytes($path)
    $isJpeg = ($bytes[0] -eq 0xFF -and $bytes[1] -eq 0xD8)
    Write-Host "  $($section.File): $len bytes, JPEG=$isJpeg"
  } else {
    Write-Host "  $($section.File): MISSING"
  }
}
