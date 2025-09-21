# 🚀 Deploy Veritas AI: Step-by-Step Guide

## 📋 Quick Deployment Summary

**Best Option: Render (Free tier available)**
- ✅ Frontend + Backend on one platform
- ✅ Automatic deployments from GitHub
- ✅ Built-in SSL certificates
- ✅ Easy environment variables

---

## 🎯 Option 1: Full Stack on Render (Recommended)

### Step 1: Prepare Your Repository

1. **Push to GitHub** (if not already done):
```bash
git add .
git commit -m "Prepare for deployment"
git push origin main
```

### Step 2: Deploy Backend Service

1. **Go to [render.com](https://render.com)** and sign up
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**
4. **Configure Backend:**
   - **Name**: `veritas-ai-backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python app.py`
   - **Instance Type**: `Free`

5. **Add Environment Variables:**
   - Click "Advanced" → "Add Environment Variable"
   - `FLASK_ENV` = `production`

6. **Deploy** - Copy the backend URL (e.g., `https://veritas-ai-backend.onrender.com`)

### Step 3: Deploy Frontend

1. **Update Backend URL in Code:**
   - Edit `components/Analyzer.tsx`
   - Replace `https://veritas-ai-backend.onrender.com/scrape` with your actual URL

2. **Commit Changes:**
```bash
git add .
git commit -m "Update backend URL for production"
git push origin main
```

3. **Create Static Site on Render:**
   - **Click "New +" → "Static Site"**
   - **Connect same repository**
   - **Configure Frontend:**
     - **Name**: `veritas-ai-frontend`
     - **Build Command**: `npm install && npm run build`
     - **Publish Directory**: `dist`

4. **Add Environment Variables:**
   - `GEMINI_API_KEY` = `your_actual_api_key`

### Step 4: Test Your Live App! 🎉

Your app will be live at:
- **Frontend**: `https://veritas-ai-frontend.onrender.com`
- **Backend**: `https://veritas-ai-backend.onrender.com`

---

## 🔥 Option 2: Vercel + Render (Optimal Performance)

### Backend on Render:
Follow Step 2 from Option 1

### Frontend on Vercel:
1. **Go to [vercel.com](https://vercel.com)**
2. **Import from GitHub**
3. **Configure:**
   - **Framework**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. **Environment Variables:**
   - `GEMINI_API_KEY` = `your_api_key`

---

## ⚡ Option 3: Railway (Modern Alternative)

1. **Go to [railway.app](https://railway.app)**
2. **Deploy from GitHub**
3. **Two services auto-detected:**
   - Python service (backend)
   - Node.js service (frontend)
4. **Configure environment variables**

---

## 🔧 Final Configuration Checklist

### Before Deployment:
- [ ] Environment variables set
- [ ] Backend URL updated in frontend
- [ ] Build commands tested locally
- [ ] Git repository pushed

### After Deployment:
- [ ] Backend health check works: `/health`
- [ ] Frontend loads correctly
- [ ] URL analysis functionality works
- [ ] Text analysis functionality works

---

## 🐛 Troubleshooting

### Common Issues:

**"Failed to fetch" errors:**
- Check backend URL in `Analyzer.tsx`
- Verify backend service is running
- Check CORS configuration

**Build failures:**
- Verify `requirements.txt` is complete
- Check Node.js version compatibility
- Ensure environment variables are set

**"Module not found" errors:**
- Add missing dependencies to `requirements.txt`
- Clear build cache and redeploy

---

## 🎯 Success Metrics

When deployed correctly, you should be able to:
1. ✅ Visit your live frontend URL
2. ✅ Analyze text content with AI
3. ✅ Analyze URLs without CORS errors
4. ✅ See proper error handling
5. ✅ Share your app with others!

---

**Ready to deploy?** Choose your platform and follow the steps above. I recommend starting with **Render** for the easiest full-stack deployment experience!