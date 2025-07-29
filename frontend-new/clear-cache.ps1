# Clear React Native cache and restart
Write-Host "🧹 Clearing React Native cache..." -ForegroundColor Yellow

Write-Host "📱 Clearing Metro cache..." -ForegroundColor Blue
npx expo start --clear

Write-Host "✅ Cache cleared, Metro restarted!" -ForegroundColor Green
