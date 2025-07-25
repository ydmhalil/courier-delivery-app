@echo off
title Courier Delivery App - Backend Server

echo ==============================================
echo Starting Courier Delivery Backend Server
echo ==============================================

cd backend

echo Activating Python virtual environment...
call venv\Scripts\activate

echo.
echo Starting FastAPI server...
echo Server will be available at: http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo.

python main.py
