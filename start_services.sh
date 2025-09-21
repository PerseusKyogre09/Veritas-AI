#!/bin/bash

# Veritas AI Startup Script
echo "Starting Veritas AI services..."

# Start Python scraping service in background
echo "Starting Python scraping service on port 5000..."
cd "C:\Users\palpr\Programming_Projects\Google\Veritas-AI"
C:/Users/palpr/Programming_Projects/Google/.venv/Scripts/python.exe scraper_service.py &

# Wait a bit for Python service to start
sleep 3

# Start React development server
echo "Starting React development server on port 5173..."
npm run dev

echo "Both services are now running!"
echo "- Python scraping service: http://localhost:5000"
echo "- React app: http://localhost:5173"