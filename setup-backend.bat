@echo off
echo ==============================================
echo Courier Delivery App - Backend Setup
echo ==============================================

echo.
echo Creating Python virtual environment...
cd backend
python -m venv venv

echo.
echo Activating virtual environment...
call venv\Scripts\activate

echo.
echo Installing Python dependencies...
pip install -r requirements.txt

echo.
echo Setting up environment file...
if not exist .env (
    copy .env.example .env
    echo Please edit the .env file with your database credentials
)

echo.
echo ==============================================
echo Backend setup complete!
echo ==============================================
echo.
echo Next steps:
echo 1. Make sure PostgreSQL is running
echo 2. Create database: createdb courier_db
echo 3. Edit backend\.env with your database credentials
echo 4. Run: python main.py
echo.
echo Press any key to continue...
pause > nul
