Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host " AI-Powered Civic Complaint Management and Resolution Platform" -ForegroundColor Green
Write-Host " MCA Mini Project - Unified PowerShell Launcher" -ForegroundColor Cyan
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "1. Starting Backend API on http://localhost:5000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot/backend'; npm start"

Start-Sleep -Seconds 3

Write-Host "2. Starting Frontend UI on http://localhost:5173..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot/frontend'; npm run dev"

Write-Host ""
Write-Host "=====================================================================" -ForegroundColor Cyan
Write-Host " System Launched Successfully!" -ForegroundColor Green
Write-Host " Citizen & Public Portal: http://localhost:5173" -ForegroundColor White
Write-Host " Admin Portal:            http://localhost:5173/admin/login" -ForegroundColor White
Write-Host " Backend Health API:      http://localhost:5000/api/health" -ForegroundColor White
Write-Host "=====================================================================" -ForegroundColor Cyan
