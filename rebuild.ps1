$apkPath = "app/build/outputs/apk/debug/app-debug.apk"

# 1. Clean and build
Write-Host "🧹 Cleaning project..." -ForegroundColor Yellow
./gradlew.bat clean
Write-Host "⚙️ Building APK..." -ForegroundColor Yellow
./gradlew.bat assembleDebug

# 2. Confirm APK exists
if (!(Test-Path $apkPath)) {
    Write-Host "❌ APK not found at $apkPath" -ForegroundColor Red
    exit 1
}

# 3. Timestamp check (must be within last 2 minutes)
$buildTime = (Get-Item $apkPath).LastWriteTime
$now = Get-Date
$age = ($now - $buildTime).TotalSeconds

if ($age -gt 120) {
    Write-Host "⚠️ APK is older than 2 minutes! Something went wrong." -ForegroundColor Red
    Write-Host "   ($apkPath last modified $buildTime)" -ForegroundColor Red
    exit 1
}

# 4. Git branch + commit hash
if (Test-Path ".git") {
    $branch = git rev-parse --abbrev-ref HEAD
    $commit = git rev-parse --short HEAD
    Write-Host "🔖 Git branch: $branch, commit: $commit" -ForegroundColor Cyan
} else {
    Write-Host "⚠️ Not a Git repository, skipping Git info..." -ForegroundColor Yellow
}

# 5. Extract applicationId
$appIdLine = Select-String -Path "app/build.gradle" -Pattern "applicationId"
if ($appIdLine) {
    $appId = $appIdLine.Line.Split('"')[1]
    Write-Host "📱 Uninstalling old app ($appId)..." -ForegroundColor Yellow
    adb uninstall $appId | Out-Null
} else {
    Write-Host "⚠️ Could not find applicationId in build.gradle. Skipping uninstall..." -ForegroundColor Yellow
}

# 6. Install APK
Write-Host "📦 Installing fresh APK..." -ForegroundColor Green
adb install $apkPath

Write-Host "✅ Success! Installed new APK ($apkPath)" -ForegroundColor Green
Write-Host "📅 Build time: $buildTime" -ForegroundColor Cyan
