@echo off
echo ==============================================
echo Courier Delivery App - Frontend Setup
echo ==============================================

echo.
echo Installing Node.js dependencies...
cd frontend
npm install

echo.
echo Installing Expo CLI globally (if not already installed)...
npm install -g @expo/cli

echo.
echo ==============================================
echo Frontend setup complete!
echo ==============================================
echo.
echo Next steps:
echo 1. Make sure the backend is running (python main.py)
echo 2. Run: npx expo start
echo 3. Install Expo Go app on your phone
echo 4. Scan the QR code to run the app
echo.
echo Press any key to continue...
pause > nul
