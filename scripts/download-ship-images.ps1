# 下载 Star Citizen 官方 RSI 舰船宣传图
# 替换 public/images/ships/ 下的占位图

$images = @{
  'arrow'          = 'https://robertsspaceindustries.com/i/1f0868e6b7d6ee5d0f72cd5fd41063bec3fe7c76/resize(1820,1024,cover,ADdPNihJzmPbNuTnFsH1DqUeqBRpXdSXVVtgJTyDDgscGKrzJuoFjResjUCY424inopgLKcxbZLVecByFWiDge1gS)/source.webp'
  '325a'           = 'https://robertsspaceindustries.com/i/16df092bae7e15e28f5ddf8cb661d420fe8d626a/resize(1820,1024,cover,ADdPNihJzmPbNuTnFsH1DqUeqBRpXdSXVVtgJTyDDgscGKrzJuoFjReskJ23FWYyJEzadrDtKz87mfAEoQDHWvg2S)/source.webp'
  'avenger-stalker'= 'https://robertsspaceindustries.com/i/7afe635976092764f6650e2a38a3824a677de7f5/resize(1820,1024,cover,ADdPNihJzmPbNuTnFsH1DqUeqBRpXdSXVVtgJTyDDgscGKrzJuoFjReseTiozZrGUkBP1KS3PKvYPfJfezfDBTyiE)/source.webp'
  'avenger-titan'  = 'https://robertsspaceindustries.com/i/4cddca806932fe6d4e4e8dc6f9e3d908e81cf46e/resize(1820,1024,cover,ADdPNihJzmPbNuTnFsH1DqUeqBRpXdSXVVtgJTyDDgscGKrzJuoFjResivggYNE4eG6QvxjvFyCFYpGdCAjcE8FWN)/source.webp'
  '400i'           = 'https://robertsspaceindustries.com/i/20d8f12f195904112d88a4b87b0ff6a3d65c8c37/resize(1820,1024,cover,ADdPNihJzmPbNuTnFsH1DqUeqBRpXdSXVVtgJTyDDgscGKrzJuoFjReskjDaVPsYfVMpaEXu82p8NG94e9gDqqSYW)/source.webp'
  '315p'           = 'https://robertsspaceindustries.com/i/5203800ba162e6643ffb71bf3f26dbdc84caf17b/resize(1820,1024,cover,ADdPNihJzmPbNuTnFsH1DqUeqBRpXdSXVVtgJTyDDgscGKrzJuoFjReskP39C2qja4a1SCcPpLtdNcx7BhDJFUZmx)/source.webp'
  '300i'           = 'https://robertsspaceindustries.com/i/cb1d78eed3bcf6ad4cebfce50e1bb16e4e4c0ce1/resize(1820,1024,cover,ADdPNihJzmPbNuTnFsH1DqUeqBRpXdSXVVtgJTyDDgscGKrzJuoFjReseTbcEcvfVXUA2L4LQquCBv3XRgSGhs5Zg)/source.webp'
  'aurora-es'      = 'https://robertsspaceindustries.com/i/c7c7b0118ba6fbee392c78df23af176778731b06/resize(1820,1024,cover,ADdPNihJzmPbNuTnFsH1DqUeqBRpXdSXVVtgJTyDDgscGKrzJuoFjResizh6NGvSRpmsGJPtnccvGjhWyiFtTQvuL)/source.webp'
  'aurora-mk2'     = 'https://robertsspaceindustries.com/i/2977e4a9d9f3c907f9422c6264c2f78489b025e5/resize(1820,1024,cover,ADdPNihJzmPbNuTnFsH1DqUeqBRpXdSXVVtgJTyDDgscGKrzJuoFjReskCZWkFFmT8GizYVjNCLrLANTnxxhrj9Qr)/source.webp'
  '350r'           = 'https://robertsspaceindustries.com/i/5a07624df24f8c53225dfc71120250ec64bf2f0e/resize(1820,1024,cover,ADdPNihJzmPbNuTnFsH1DqUeqBRpXdSXVVtgJTyDDgscGKrzJuoFjResjqRzd4VcczH8KK3H3SAgsMrj6ExxrMpge)/source.webp'
  '100i'           = 'https://robertsspaceindustries.com/i/f8d0638aa95b6b51f63deda885bd255387b8d5de/resize(1820,1024,cover,ADdPNihJzmPbNuTnFsH1DqUeqBRpXdSXVVtgJTyDDgscGKrzJuoFjResjvfQvZTLBeqr7nxsoca56jsfVMy1KQ5YS)/source.webp'
  'ballista'       = 'https://robertsspaceindustries.com/i/004b56fd94e9224b95646f683ac234cab884ee06/resize(1820,1024,cover,ADdPNihJzmPbNuTnFsH1DqUeqBRpXdSXVVtgJTyDDgscGKrzJuoFjResj76XQUHMro7sbhMTSrhqtrQngyMgUY8aA)/source.webp'
}

$outDir = 'public/images/ships'
if (-not (Test-Path $outDir)) {
  New-Item -ItemType Directory -Path $outDir -Force | Out-Null
}

foreach ($name in $images.Keys) {
  $url = $images[$name]
  $outFile = Join-Path $outDir "$name.webp"
  try {
    Invoke-WebRequest -Uri $url -OutFile $outFile -MaximumRedirection 5 -TimeoutSec 120
    $size = (Get-Item $outFile).Length
    Write-Host "OK  $name  ($size bytes)"
  } catch {
    Write-Host "FAIL $name : $_"
  }
}
