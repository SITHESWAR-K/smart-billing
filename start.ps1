# Smart Billing System - Startup Script
# Run this script to start both backend and frontend servers

Write-Host "🚀 Starting Smart Billing System..." -ForegroundColor Cyan
Write-Host ""

# Start Backend
Write-Host "📦 Starting Backend Server (Port 5000)..." -ForegroundColor Yellow
$backendPath = Join-Path $PSScriptRoot "backend"
Start-Process -FilePath "pwsh" -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm start" -WindowStyle Normal

Start-Sleep -Seconds 3

# Start Frontend
Write-Host "🎨 Starting Frontend Server (Port 5173)..." -ForegroundColor Yellow
$frontendPath = Join-Path $PSScriptRoot "frontend"
Start-Process -FilePath "pwsh" -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "✅ Both servers are starting!" -ForegroundColor Green
Write-Host ""
Write-Host "📍 Backend API:  http://localhost:5000" -ForegroundColor White
Write-Host "📍 Frontend App: http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "Open http://localhost:5173 in your browser to use the app." -ForegroundColor Cyan
