param (
    [string]$MobilePath = "..\HorizonMobile\android\app\build\outputs\apk\debug\app-debug.apk",
    [string]$DestPath = "assets\latest\app-debug.apk"
)

Write-Host "Syncing the latest Android APK from HorizonMobile..."
$sourceFile = Resolve-Path $MobilePath -ErrorAction SilentlyContinue

if ($sourceFile) {
    if (!(Test-Path -Path (Split-Path $DestPath))) {
        New-Item -ItemType Directory -Force -Path (Split-Path $DestPath) | Out-Null
    }
    
    Copy-Item -Path $sourceFile.Path -Destination $DestPath -Force
    Write-Host "Successfully synced APK to $DestPath!" -ForegroundColor Green
    Write-Host "Please remember to commit and push this new APK to GitHub."
}
else {
    Write-Host "Could not find the mobile APK at $MobilePath. Have you built it yet?" -ForegroundColor Red
}
