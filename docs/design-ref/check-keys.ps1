Write-Host "Checking API keys..."
$keys = @("ARK_API_KEY", "MODEL_IMAGE_API_KEY", "MODEL_AGENT_API_KEY")
foreach ($k in $keys) {
  $val = [Environment]::GetEnvironmentVariable($k)
  if ($val) {
    Write-Host "${k}: found (length=$($val.Length))"
  } else {
    Write-Host "${k}: NOT SET"
  }
}
