# Veritas AI: Enhanced with Python Backend

## 🚀 What's New

The Veritas AI misinformation detector has been enhanced with a **Python backend using Beautiful Soup** to solve CORS issues and provide reliable web scraping capabilities.

### Features:
- ✅ **Reliable Web Scraping**: Python Flask backend with Beautiful Soup
- ✅ **No CORS Issues**: Direct server-side scraping instead of browser-based requests
- ✅ **Clean Text Extraction**: Smart content extraction from web pages
- ✅ **Error Handling**: Comprehensive error messages and fallbacks
- ✅ **AI Analysis**: Powered by Google's Gemini API

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js (v18+)
- Python (v3.8+)
- Your Gemini API key

### Option 1: Automatic Startup (Windows)
```bash
# Double-click this file to start both services
start_services.bat
```

### Option 2: Manual Startup

1. **Start Python Backend** (Terminal 1):
```bash
cd "C:\Users\palpr\Programming_Projects\Google\Veritas-AI"
C:/Users/palpr/Programming_Projects/Google/.venv/Scripts/python.exe scraper_service.py
```

2. **Start React Frontend** (Terminal 2):
```bash
cd "C:\Users\palpr\Programming_Projects\Google\Veritas-AI"
npm run dev
```

## 🌐 Access the Application

- **Main App**: http://localhost:5173/
- **Python API Health Check**: http://localhost:5000/health
- **Python API Docs**: POST http://localhost:5000/scrape

## 🧪 Testing

### Test the Python Backend
```python
import requests

# Health check
response = requests.get('http://localhost:5000/health')
print(response.json())

# Test scraping
response = requests.post('http://localhost:5000/scrape', 
                        json={'url': 'https://example.com'})
print(response.json())
```

### Test the Complete Flow
1. Visit http://localhost:5173/
2. Click "Start Analyzing Now"
3. Switch to "Analyze URL" tab
4. Enter a news article URL
5. Click "Analyze" and watch the magic happen!

## 🛠 Architecture

```
Frontend (React/TypeScript) → Python Backend (Flask/BeautifulSoup) → Gemini AI
        ↓                              ↓                              ↓
   Port 5173                      Port 5000                   AI Analysis
```

### Backend API Endpoints

#### POST /scrape
Scrapes content from a URL and returns clean text.

**Request:**
```json
{
  "url": "https://example.com/article"
}
```

**Response:**
```json
{
  "content": "Clean extracted text...",
  "title": "Article Title",
  "url": "https://example.com/article"
}
```

#### GET /health
Returns service health status.

## 📁 Project Structure

```
Veritas-AI/
├── scraper_service.py      # Python Flask backend
├── requirements.txt        # Python dependencies
├── start_services.bat      # Windows startup script
├── start_services.sh       # Linux/Mac startup script
├── components/
│   └── Analyzer.tsx        # Updated to use Python backend
├── .env.local             # Gemini API key
└── dist/                  # Production build files
```

## 🔧 Configuration

### Environment Variables
Create `.env.local`:
```
GEMINI_API_KEY=your_api_key_here
```

### Python Dependencies (requirements.txt)
```
flask
flask-cors
requests
beautifulsoup4
lxml
```

## 🐛 Troubleshooting

### Common Issues

1. **"Could not connect to scraping service"**
   - Ensure Python backend is running on port 5000
   - Check if port 5000 is available

2. **"Module not found" errors**
   - Install Python dependencies: `pip install -r requirements.txt`
   - Use the correct virtual environment

3. **CORS errors**
   - The Python backend handles CORS automatically
   - Ensure both services are running on localhost

4. **"Failed to scrape content"**
   - Some websites block scraping
   - Check if the URL is accessible
   - Try a different test URL

### Port Conflicts
If ports 5000 or 5173 are busy:
- Change Flask port in `scraper_service.py`: `app.run(port=5001)`
- Change Vite port in `vite.config.ts` or use `npm run dev -- --port 3000`

## 🔒 Security Notes

- This is a development setup
- For production, use a proper WSGI server for Flask
- Add rate limiting and authentication as needed
- Consider using a reverse proxy for deployment

## 🎯 Success!

You now have a fully functional misinformation detector with:
- ✅ Python backend running on http://localhost:5000
- ✅ React frontend running on http://localhost:5173
- ✅ No more CORS issues
- ✅ Reliable web scraping with Beautiful Soup
- ✅ AI-powered analysis with Gemini

The application can now analyze both text and URLs reliably!