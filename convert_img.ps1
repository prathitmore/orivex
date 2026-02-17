Add-Type -AssemblyName System.Drawing
$img = [System.Drawing.Image]::FromFile("C:\Users\Prathit\.gemini\antigravity\scratch\Horizon\assets\andromeda.png")
$ici = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.FormatDescription -eq "JPEG" }
$ep = New-Object System.Drawing.Imaging.EncoderParameters(1)
$ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, 95)
$img.Save("C:\Users\Prathit\.gemini\antigravity\scratch\Horizon\assets\andromeda.jpg", $ici, $ep)
$img.Dispose()
$size = (Get-Item "C:\Users\Prathit\.gemini\antigravity\scratch\Horizon\assets\andromeda.jpg").Length / 1MB
Write-Host "New Size: $size MB"
