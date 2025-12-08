Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Python Background Removal Server" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if virtual environment exists
if (-Not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
    Write-Host ""
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Yellow
& "venv\Scripts\Activate.ps1"
Write-Host ""

# Install dependencies
Write-Host "Installing dependencies..." -ForegroundColor Yellow
pip install -r requirements.txt
Write-Host ""

# Start server
Write-Host "Starting server..." -ForegroundColor Green
Write-Host ""
python app.py

Read-Host "Press Enter to exit"
