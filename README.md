# Veritas AI: Enhanced with Python Backend

## 🚀 What's New

Veritas AI now ships with a Python scraping microservice to eliminate CORS limits and a Gemini-driven AI authorship detector that flags whether an article appears human, AI-assisted, or fully AI-generated.

### Feature Highlights

- ✅ **Reliable Web Scraping** – Flask and Beautiful Soup bypass CORS and normalize article text.
- ✅ **AI Authorship Detection** – Gemini highlights fully or partially AI-generated passages along with supporting signals such as repetition, missing citations, and tonal drift.
- ✅ **Credibility Analysis** – Claim-level assessments, scorecards, and sourced evidence trails.
- ✅ **First-Class Error Handling** – Clear failure states with actionable messaging.
- ✅ **Seamless Frontend** – React and Vite experience with live language detection.

## 🏃‍♂️ Quick Start

### Prerequisites

- Node.js (v18+)
- Python (v3.8+)
- Gemini API key

### Option 1 - Automatic Startup (Windows)

```bash
start_services.bat
```

Double-click the script to launch both services.

### Option 2 - Manual Startup

1. **Start Python backend** (Terminal 1):

   ```bash
   cd "C:\Users\palpr\Programming_Projects\Google\Veritas-AI"
   C:/Users/palpr/Programming_Projects/Google/.venv/Scripts/python.exe scraper_service.py
   ```

2. **Start React frontend** (Terminal 2):

   ```bash
   cd "C:\Users\palpr\Programming_Projects\Google\Veritas-AI"
   npm run dev
   ```

## 🌐 Access the Application

- **Main App**: <http://localhost:5173/>
- **Python API Health Check**: <http://localhost:5000/health>
- **Python API Docs**: `POST` <http://localhost:5000/scrape>

## 🧪 Testing

### Test the Python Backend

```python
import requests

response = requests.get("http://localhost:5000/health")
print(response.json())

response = requests.post(
    "http://localhost:5000/scrape",
    json={"url": "https://example.com"}
)
print(response.json())
```

### Test the Complete Flow

1. Visit <http://localhost:5173/>
2. Click **Start Analyzing Now**
3. Switch to **Analyze URL**
4. Enter a news article link
5. Press **Analyze** and review the results

## 🛠 Architecture

```text
Frontend (React/TypeScript) -> Python Backend (Flask/BeautifulSoup) -> Gemini AI
        ↓                              ↓                              ↓
   Port 5173                      Port 5000                   AI Analysis
```

### Backend API Endpoints

#### POST /scrape

Scrapes content from a URL and returns clean text.

##### Request

```json
{
  "url": "https://example.com/article"
}
```

##### Response

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

```text
Veritas-AI/
├── scraper_service.py
├── requirements.txt
├── start_services.bat
├── start_services.sh
├── components/
│   └── Analyzer.tsx
├── .env.local
└── dist/
```

## 🔧 Configuration

### Environment Variables

Create `.env.local`:

```bash
GEMINI_API_KEY=your_api_key_here
```

### Python Dependencies (`requirements.txt`)

```text
flask
flask-cors
requests
beautifulsoup4
lxml
```

## 🐛 Troubleshooting

### Common Issues

1. **"Could not connect to scraping service"**
   - Ensure the Python backend is running on port 5000.
   - Confirm the port is not in use.

2. **"Module not found" errors**
   - Install dependencies with `pip install -r requirements.txt`.
   - Activate the correct virtual environment.

3. **CORS errors**
   - The backend handles CORS; ensure both services run on localhost.

4. **"Failed to scrape content"**
   - Some sites block scraping.
   - Verify the URL loads in a browser.
   - Try a different article.

### Port Conflicts

If ports 5000 or 5173 are taken:

- Update the Flask port in `scraper_service.py` (`app.run(port=5001)`).
- Override the Vite port with `npm run dev -- --port 3000`.

## 🔒 Security Notes

- Development setup only.
- Use a production-grade WSGI server for Flask deployments.
- Add authentication and rate limiting for exposed endpoints.
- Consider a reverse proxy for TLS termination.

## 🎯 Success

You now have a misinformation and AI authorship detector that combines:

- ✅ Python backend running on <http://localhost:5000>
- ✅ React frontend running on <http://localhost:5173>
- ✅ Gemini-powered credibility and authorship analysis

Analyze text or URLs with confidence and surface AI-generated narratives alongside traditional misinformation cues.
