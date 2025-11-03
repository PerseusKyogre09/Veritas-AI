# Veritas AI

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![Python Version](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://www.python.org/)

## 👥 Team

| | | | | |
|---|---|---|---|---|
| <div style="text-align: center;"><img src="https://github.com/kuhusingh0605.png" alt="Kuhu Singh" width="100" height="100" style="border-radius: 50%;"><br>**Kuhu Singh**<br><a href="https://github.com/kuhusingh0605"><img src="https://cdn.simpleicons.org/github" alt="GitHub" width="20" height="20"></a> <a href="https://www.linkedin.com/in/kuhu-singh-6b9867329/"><img src="https://www.linkedin.com/favicon.ico" alt="LinkedIn" width="20" height="20"></a></div> | <div style="text-align: center;"><img src="https://github.com/Vedag812.png" alt="Vedant Agarwal" width="100" height="100" style="border-radius: 50%;"><br>**Vedant Agarwal**<br><a href="https://github.com/Vedag812"><img src="https://cdn.simpleicons.org/github" alt="GitHub" width="20" height="20"></a> <a href="https://www.linkedin.com/in/vedant-agarwal-36bb18142/"><img src="https://www.linkedin.com/favicon.ico" alt="LinkedIn" width="20" height="20"></a></div> | <div style="text-align: center;"><img src="https://github.com/PerseusKyogre09.png" alt="Pradeepto Pal" width="100" height="100" style="border-radius: 50%;"><br>**Pradeepto Pal**<br><a href="https://github.com/PerseusKyogre09"><img src="https://cdn.simpleicons.org/github" alt="GitHub" width="20" height="20"></a> <a href="https://www.linkedin.com/in/pradeeptopal/"><img src="https://www.linkedin.com/favicon.ico" alt="LinkedIn" width="20" height="20"></a></div> | <div style="text-align: center;"><img src="https://github.com/divyat2605.png" alt="Divya Tripathi" width="100" height="100" style="border-radius: 50%;"><br>**Divya Tripathi**<br><a href="https://github.com/divyat2605"><img src="https://cdn.simpleicons.org/github" alt="GitHub" width="20" height="20"></a> <a href="https://www.linkedin.com/in/divya-tripathi-techenthusiast/"><img src="https://www.linkedin.com/favicon.ico" alt="LinkedIn" width="20" height="20"></a></div> | <div style="text-align: center;"><img src="https://github.com/TejasSharma356.png" alt="Tejas Sharma" width="100" height="100" style="border-radius: 50%;"><br>**Tejas Sharma**<br><a href="https://github.com/TejasSharma356"><img src="https://cdn.simpleicons.org/github" alt="GitHub" width="20" height="20"></a> <a href="https://www.linkedin.com/in/tejassharmaaa/"><img src="https://www.linkedin.com/favicon.ico" alt="LinkedIn" width="20" height="20"></a></div> |

An AI-powered misinformation and authorship detection platform that analyzes news articles for credibility, bias, and AI-generated content. Built during a hackathon, this full-stack application combines a React frontend with a Python backend and integrates Google's Gemini AI for advanced text analysis.

## 🚀 Features

- **AI Authorship Detection**: Identifies human-written, AI-assisted, or fully AI-generated content using Gemini AI
- **Credibility Analysis**: Provides claim-level assessments with scorecards and evidence trails
- **Web Scraping**: Bypasses CORS restrictions with a Python microservice using Flask and BeautifulSoup
- **Real-time Analysis**: Live language detection and seamless frontend experience
- **Community Feed**: Share and discuss analyzed articles with other users
- **User Dashboard**: Track analysis history, manage profiles, and customize settings
- **Firebase Integration**: Secure authentication and data storage with Firestore
- **Responsive Design**: Modern UI built with React, TypeScript, and Tailwind CSS

## 🛠 Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router** for navigation
- **Heroicons** for icons

### Backend
- **Python Flask** microservice for web scraping
- **BeautifulSoup4** and **lxml** for HTML parsing
- **Google Gemini AI** for content analysis

### Infrastructure
- **Firebase** (Authentication, Firestore, Hosting)
- **Vercel** for deployment (optional)

## 📋 Prerequisites

- Node.js (v18 or higher)
- Python (v3.8 or higher)
- Gemini API key from Google AI Studio
- Firebase project (for authentication and database)

## 🏃‍♂️ Quick Start

### Automatic Startup (Windows)

Double-click `start_services.bat` to launch both the Python backend and React frontend automatically.

### Manual Startup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/PerseusKyogre09/Veritas-AI.git
   cd Veritas-AI
   ```

2. **Set up Python backend**:
   ```bash
   # Create virtual environment
   python -m venv venv
   venv\Scripts\activate  # On Windows
   # source venv/bin/activate  # On macOS/Linux

   # Install dependencies
   pip install -r requirements.txt

   # Start the Flask service
   python scraper_service.py
   ```

3. **Set up React frontend** (in a new terminal):
   ```bash
   # Install dependencies
   npm install

   # Start development server
   npm run dev
   ```

## 🌐 Access the Application

- **Main App**: [http://localhost:5173](http://localhost:5173)
- **Python API Health Check**: [http://localhost:5000/health](http://localhost:5000/health)
- **Python API Docs**: `POST` [http://localhost:5000/scrape](http://localhost:5000/scrape)

## 🧪 Testing

### Test the Python Backend

```python
import requests

# Health check
response = requests.get("http://localhost:5000/health")
print(response.json())

# Test scraping
response = requests.post(
    "http://localhost:5000/scrape",
    json={"url": "https://example.com"}
)
print(response.json())
```

### Test the Complete Flow

1. Visit [http://localhost:5173](http://localhost:5173)
2. Sign in with Google
3. Click "Start Analyzing Now"
4. Switch to "Analyze URL"
5. Enter a news article URL
6. Press "Analyze" and review the results

## 🏗 Project Structure

```
Veritas-AI/
├── app.py                          # Main Flask application
├── scraper_service.py              # Web scraping microservice
├── requirements.txt                # Python dependencies
├── runtime.txt                     # Python runtime version
├── Procfile                        # Heroku deployment config
├── package.json                    # Node.js dependencies
├── tsconfig.json                   # TypeScript configuration
├── vite.config.ts                  # Vite configuration
├── vercel.json                     # Vercel deployment config
├── firebase.json                   # Firebase configuration
├── firestore.rules                 # Firestore security rules
├── index.html                      # Main HTML template
├── index.tsx                       # React app entry point
├── App.tsx                         # Main React component
├── types.ts                        # TypeScript type definitions
├── env.d.ts                        # Environment type definitions
├── metadata.json                   # App metadata
├── start_services.bat              # Windows startup script
├── start_services.sh               # Unix startup script
├── components/                     # React components
│   ├── Analyzer.tsx                # Article analysis component
│   ├── AnalysisResultDisplay.tsx   # Results display component
│   ├── CommunityFeed.tsx           # Community discussion feed
│   ├── Dashboard.tsx               # User dashboard
│   ├── Header.tsx                  # App header
│   ├── History.tsx                 # Analysis history
│   ├── LandingPage.tsx             # Landing page
│   ├── LoginModal.tsx              # Authentication modal
│   ├── Profile.tsx                 # User profile
│   ├── Settings.tsx                # User settings
│   ├── ThemeSwitcher.tsx           # Dark/light theme toggle
│   └── icons/                      # Custom icon components
├── services/                       # Service modules
│   ├── communityService.ts         # Community features
│   ├── firebaseClient.ts           # Firebase utilities
│   └── geminiService.ts            # Gemini AI integration
└── README.md                       # This file
```

## 🔧 Configuration

### Environment Variables

Create a `.env.local` file in the root directory:

```bash
# Gemini AI API Key
GEMINI_API_KEY=your_gemini_api_key_here

# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Firebase Setup

1. Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication with Google provider
3. Create a Firestore database
4. Add your domain to authorized domains for authentication
5. Copy the config values to your `.env.local` file

### Python Dependencies

The `requirements.txt` includes:
- flask
- flask-cors
- requests
- beautifulsoup4
- lxml
- google-generativeai

## 📡 API Documentation

### Backend Endpoints

#### `POST /scrape`
Scrapes content from a given URL and returns cleaned text.

**Request Body:**
```json
{
  "url": "https://example.com/article"
}
```

**Response:**
```json
{
  "content": "Clean extracted article text...",
  "title": "Article Title",
  "url": "https://example.com/article"
}
```

#### `GET /health`
Returns the health status of the scraping service.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2025-11-02T12:00:00Z"
}
```

## 🐛 Troubleshooting

### Common Issues

1. **Connection to scraping service fails**
   - Ensure Python backend is running on port 5000
   - Check for port conflicts

2. **Module not found errors**
   - Install Python dependencies: `pip install -r requirements.txt`
   - Activate virtual environment

3. **CORS errors**
   - Backend handles CORS; ensure both services run on localhost

4. **Scraping fails**
   - Some sites block scraping; try different URLs
   - Verify URL loads in browser

### Port Conflicts

- Change Flask port in `scraper_service.py`: `app.run(port=5001)`
- Change Vite port: `npm run dev -- --port 3000`

## � Deployment

### Vercel (Frontend)
```bash
npm run build
# Deploy using Vercel CLI or connect GitHub repo
```

### Heroku (Backend)
```bash
# Deploy Python app using Heroku CLI
heroku create your-app-name
git push heroku main
```

### Firebase Hosting (Alternative)
```bash
npm run build
firebase deploy --only hosting
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built during a hackathon
- Powered by Google's Gemini AI
- Firebase for backend services
- Open source community for inspiration

## 📞 Support

For questions or issues, please open an issue on GitHub or contact the maintainers.

---

**Analyze with confidence. Surface AI-generated narratives alongside traditional misinformation cues.**
