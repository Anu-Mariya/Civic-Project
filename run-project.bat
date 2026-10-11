@echo off
echo =====================================================================
echo  AI-Powered Civic Complaint Management and Resolution Platform
echo  MCA Mini Project - Unified Launcher
echo =====================================================================
echo.
echo Starting Backend Server on http://localhost:5000...
start "Civic Backend API" cmd /k "cd backend && npm start"

echo Waiting 3 seconds for database initialization...
timeout /t 3 /nobreak >nul

echo Starting Frontend Dev Server on http://localhost:5173...
start "Civic Frontend UI" cmd /k "cd frontend && npm run dev"

echo.
echo =====================================================================
echo  Applications started successfully!
echo  Citizen & Public Portal: http://localhost:5173
echo  Admin Portal:            http://localhost:5173/admin/login
echo  Backend Health Check:    http://localhost:5000/api/health
echo =====================================================================
