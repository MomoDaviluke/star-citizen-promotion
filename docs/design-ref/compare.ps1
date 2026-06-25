$path1 = "c:\Users\Administrator\Desktop\star-citizen-promotion\docs\design-ref\test-real.jpeg"
$path2 = "c:\Users\Administrator\Desktop\star-citizen-promotion\docs\design-ref\test-img.jpeg"
$hash1 = (Get-FileHash -Path $path1 -Algorithm MD5).Hash
$hash2 = (Get-FileHash -Path $path2 -Algorithm MD5).Hash
Write-Host "test-real.jpeg MD5: $hash1"
Write-Host "test-img.jpeg MD5: $hash2"
Write-Host "Same: $($hash1 -eq $hash2)"
