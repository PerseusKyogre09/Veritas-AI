@echo off
echo Starting Veritas AI services...

echo Starting Python scraping service on port 5000...
cd /d "C:\Users\palpr\Programming_Projects\Google\Veritas-AI"
start "Python Scraper" C:/Users/palpr/Programming_Projects/Google/.venv/Scripts/python.exe scraper_service.py

echo Waiting for Python service to start...
timeout /t 3 /nobreak >nul

echo Starting React development server on port 5173...
start "React App" npm run dev

echo Both services are now starting!
echo - Python scraping service: http://localhost:5000
echo - React app: http://localhost:5173

pause