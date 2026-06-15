[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# Test with a simple prompt to see what the API returns
$prompt = [Uri]::EscapeDataString("a red square on black background")
$url = "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=$prompt&image_size=landscape_16_9"
Write-Host "URL: $url"

# Get response headers
$response = Invoke-WebRequest -Uri $url -Method Get
Write-Host "Status: $($response.StatusCode)"
Write-Host "Content-Type: $($response.Headers['Content-Type'])"
Write-Host "Content-Length: $($response.Content.Length)"

# Check if it's an image or JSON
$bytes = $response.Content
if ($bytes[0] -eq 0xFF -and $bytes[1] -eq 0xD8) {
  Write-Host "Response is JPEG image"
} elseif ($bytes[0] -eq 0x89 -and $bytes[1] -eq 0x50) {
  Write-Host "Response is PNG image"
} else {
  $text = [System.Text.Encoding]::UTF8.GetString($bytes[0..499])
  Write-Host "Response text (first 500 chars): $text"
}
