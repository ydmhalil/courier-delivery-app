#!/bin/bash
# Clear React Native cache and restart
echo "🧹 Clearing React Native cache..."

echo "📱 Clearing Metro cache..."
npx react-native start --reset-cache

echo "✅ Cache cleared, Metro restarted!"
