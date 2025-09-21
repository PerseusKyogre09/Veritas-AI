# Veritas AI - Deployment Configuration

## Environment Variables

### Backend (Python/Flask)
- `PORT`: Server port (default: 5000)
- `FLASK_ENV`: Environment (production/development)

### Frontend (React/Vite)
- `VITE_API_URL`: Backend API URL for production
- `GEMINI_API_KEY`: Your Gemini API key

## Build Configuration

### Backend Build Command
```bash
pip install -r requirements.txt
```

### Backend Start Command
```bash
python app.py
```

### Frontend Build Command
```bash
npm install && npm run build
```

### Frontend Publish Directory
```
dist
```

## Deployment URLs Structure

- **Frontend**: `https://your-app-name.vercel.app`
- **Backend**: `https://your-backend-name.onrender.com`

Update the frontend API endpoint in `components/Analyzer.tsx` with your actual backend URL.