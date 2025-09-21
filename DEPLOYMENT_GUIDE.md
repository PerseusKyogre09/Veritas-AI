# Deployment Guide: Veritas AI

## 🚀 Option 1: Render (Recommended - Full Stack)

Render is perfect for your React + Python Flask setup with free tiers available.

### Step 1: Prepare for Deployment

1. **Update the frontend to use production backend URL:**

```typescript
// In components/Analyzer.tsx, replace:
const scraperEndpoint = 'http://localhost:5000/scrape';

// With:
const scraperEndpoint = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-url.onrender.com/scrape'
  : 'http://localhost:5000/scrape';
```

2. **Create production configuration files:**

### Step 2: Deploy Backend to Render

1. **Push your code to GitHub**
2. **Go to [render.com](https://render.com)** and sign up
3. **Create a Web Service:**
   - Connect your GitHub repo
   - Choose "Python" as runtime
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python scraper_service.py`
   - Instance Type: Free

4. **Environment Variables:**
   - Add any needed environment variables

### Step 3: Deploy Frontend to Render

1. **Create a Static Site:**
   - Connect same GitHub repo
   - Build Command: `npm install && npm run build`
   - Publish Directory: `dist`

### Step 4: Update Configuration

Update your frontend with the backend URL from Render.

---

## 🔥 Option 2: Vercel + Render (Split Stack)

Perfect for optimal performance - Frontend on Vercel, Backend on Render.

### Frontend on Vercel:
1. Push to GitHub
2. Connect to [vercel.com](https://vercel.com)
3. Auto-deploys on every push

### Backend on Render:
Same as Option 1 backend steps.

---

## ⚡ Option 3: Railway (Modern Alternative)

Great modern platform with automatic deployments.

1. Push to GitHub
2. Connect to [railway.app](https://railway.app)
3. Deploy both services automatically

---

## 🔧 Option 4: Serverless (Vercel Functions)

Convert your Flask backend to Vercel serverless functions.

---

## 📋 Pre-Deployment Checklist

- [ ] Environment variables configured
- [ ] Build commands tested locally
- [ ] CORS configured for production domains
- [ ] API endpoints use production URLs
- [ ] Database/storage configured (if needed)

Choose your preferred option and I'll provide detailed setup instructions!