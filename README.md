# VideoWise - AI-Powered Video Summarization Platform

A comprehensive web application that automatically generates intelligent summaries of videos by analyzing audio, visual content, and on-screen text using state-of-the-art AI models.

## ✨ New Feature: Gemini Direct Mode

**Process videos without a backend!** The app now supports client-side processing using Gemini API. When the backend is not available, users can use their own Gemini API key to process videos directly in the browser. See [GEMINI_DIRECT_FEATURE.md](./GEMINI_DIRECT_FEATURE.md) for details.

## 🚀 Quick Start Guide

This guide will help you get VideoWise up and running in minutes, whether you're running the backend on Google Colab (free GPU) or locally.

---

## 📋 Prerequisites

- **For Backend (Colab)**: Google account (free)
- **For Backend (Local)**: Python 3.8+, GPU recommended
- **For Frontend**: Node.js 18+ and npm

---

## 🎯 Option 1: Run Backend on Google Colab (Recommended - Free GPU)

### Step 1: Open Google Colab
1. Go to [Google Colab](https://colab.research.google.com/)
2. Sign in with your Google account
3. Click **File → New notebook**

### Step 2: Enable GPU
1. Click **Runtime → Change runtime type**
2. Select **Hardware accelerator: GPU (T4)**
3. Click **Save**

### Step 3: Open the Colab Notebook
1. Upload `backend/colab_backend.ipynb` to Colab
2. Or create a new notebook and copy the cells below

### Step 4: Run Setup Cells (In Order)

#### **Cell 1: Install Dependencies**
```python
!pip install -q flask flask-cors flask-jwt-extended cloudflared requests torch torchvision transformers opencv-python librosa easyocr moviepy sentencepiece protobuf groq google-generativeai
print("✅ Dependencies installed!")
```

#### **Cell 2: Set API Keys**
```python
import os

# ⚠️ REPLACE WITH YOUR ACTUAL API KEYS
os.environ['JWT_SECRET_KEY'] = 'your-secret-key-change-this-12345'
os.environ['GROQ_API_KEY'] = 'gsk_your_groq_api_key_here'
os.environ['GEMINI_API_KEY'] = 'your_gemini_api_key_here'

# Configuration
os.environ['UPLOAD_FOLDER'] = '/content/uploads'
os.environ['DB_PATH'] = '/content/videowise.db'
os.environ['FLASK_ENV'] = 'production'

print("✅ API keys configured")
```

**Get API Keys:**
- **Groq**: https://console.groq.com/ (free tier available)
- **Gemini**: https://makersuite.google.com/app/apikey (free tier available)

#### **Cell 3: Create Backend Files**
```python
# Create app.py
app_py_content = '''PASTE app.py CONTENT HERE'''
with open('/content/app.py', 'w') as f:
    f.write(app_py_content)

# Create video_processor.py
video_processor_py_content = '''PASTE video_processor.py CONTENT HERE'''
with open('/content/video_processor.py', 'w') as f:
    f.write(video_processor_py_content)

print("✅ Backend files created!")
```

**Note**: Instead of pasting content, you can also upload `app.py` and `video_processor.py` from your local `backend/` folder using Colab's file upload feature.

#### **Cell 4: Setup Cloudflare Tunnel (Get Public URL)**
```python
import subprocess
import time

print("🌐 Setting up Cloudflare Tunnel...")

# Download cloudflared
!wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O cloudflared
!chmod +x cloudflared

# Start tunnel
print("🚀 Starting tunnel...")
process = subprocess.Popen(
    ['./cloudflared', 'tunnel', '--url', 'http://localhost:5000'],
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True
)

time.sleep(8)

print("\n" + "="*60)
print("🌐 Look for the public URL in the output above")
print("   It will look like: https://xxxxx.trycloudflare.com")
print("   ⚠️  COPY THIS URL - You'll need it for frontend!")
print("="*60)
```

**Copy the URL** that appears (e.g., `https://xxxxx.trycloudflare.com`)

#### **Cell 5: Start Backend Server (KEEP RUNNING!)**
```python
import sys
sys.path.insert(0, '/content')

# Verify files exist
import os
if not os.path.exists('/content/app.py'):
    print("❌ app.py not found! Please upload it.")
    raise FileNotFoundError

if not os.path.exists('/content/video_processor.py'):
    print("❌ video_processor.py not found! Please upload it.")
    raise FileNotFoundError

# Import and run
from app import app

print("\n" + "="*60)
print("🚀 Starting VideoWise Backend Server...")
print("="*60)

# ⚠️ REPLACE WITH URL FROM CELL 4
PUBLIC_URL = "https://xxxxx.trycloudflare.com"  # ⬅️ CHANGE THIS!

print(f"\n📍 Local URL: http://localhost:5000")
print(f"🌐 Public URL: {PUBLIC_URL}")
print(f"\n📋 Add this to frontend/.env:")
print(f"   VITE_API_BASE_URL={PUBLIC_URL}")
print("\n✅ Server is starting...")
print("⚠️  DO NOT CLOSE THIS CELL - Keep it running!")
print("="*60)

# Start server
app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)
```

**⚠️ IMPORTANT**: Keep Cell 5 running! This is your server.

### Step 5: Update Frontend Configuration

1. Open `frontend/.env` file
2. Add/update:
```env
VITE_API_BASE_URL=https://xxxxx.trycloudflare.com
```
(Replace with the URL from Cell 4)

---

## 🖥️ Option 2: Run Backend Locally

### Step 1: Setup Virtual Environment
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### Step 2: Install Dependencies
```bash
pip install -r requirements.txt
```

### Step 3: Set Environment Variables
Create `.env` file in `backend/`:
```env
JWT_SECRET_KEY=your-secret-key-change-this
GROQ_API_KEY=your-groq-api-key
GEMINI_API_KEY=your-gemini-api-key
UPLOAD_FOLDER=./uploads
DB_PATH=./videowise.db
FLASK_ENV=development
```

### Step 4: Run Server
```bash
python app.py
```

Server runs on `http://localhost:5000`

### Step 5: Update Frontend Configuration
Update `frontend/.env`:
```env
VITE_API_BASE_URL=http://localhost:5000
```

---

## 🎨 Run Frontend

### Step 1: Install Dependencies
```bash
cd frontend
npm install
```

### Step 2: Configure Environment
Create/update `frontend/.env`:
```env
VITE_API_BASE_URL=https://your-backend-url.trycloudflare.com
# OR for local backend:
# VITE_API_BASE_URL=http://localhost:5000
```

### Step 3: Start Development Server
```bash
npm run dev
```

Frontend runs on `http://localhost:3000`

### Step 4: Open in Browser
Navigate to `http://localhost:3000`

---

## 🔄 How Communication Works

### Architecture Overview
```
Frontend (React)  ←→  Backend API (Flask)  ←→  AI Models
   Port 3000              Port 5000          (GPU/Cloud)
```

### Communication Flow

1. **User Registration/Login**
   - Frontend sends credentials to `/auth/signup` or `/auth/login`
   - Backend validates and returns JWT token
   - Frontend stores token in localStorage

2. **Video Upload**
   - Frontend uploads video file to `/videos/upload`
   - Backend saves file and creates job
   - Backend returns `jobId` immediately
   - Processing happens in background thread

3. **Job Status Polling**
   - Frontend polls `/videos/status/<job_id>` every 2-3 seconds
   - Backend returns current status, progress, and step
   - Frontend updates UI with progress bar

4. **Get Results**
   - When status is 'done', frontend calls `/videos/result/<job_id>`
   - Backend returns summary, transcript, visual captions
   - Frontend displays results with video player

### API Endpoints

**Authentication:**
- `POST /auth/signup` - Register new user
- `POST /auth/login` - Login user
- `GET /auth/me` - Get current user

**Videos:**
- `POST /videos/upload` - Upload video file
- `POST /videos/from-url` - Summarize from URL
- `GET /videos/status/<job_id>` - Get job status
- `GET /videos/result/<job_id>` - Get job result
- `GET /videos/list` - List user's jobs

**User:**
- `GET /user/profile` - Get profile
- `PUT /user/profile` - Update profile

**Health:**
- `GET /health` - Health check
- `GET /` - API information

---

## ✅ Testing the Setup

### Test Backend
1. Open browser: `https://your-url.trycloudflare.com/health`
2. Should return: `{"status": "healthy", ...}`

### Test Frontend
1. Open `http://localhost:3000`
2. Sign up for a new account
3. Upload a test video
4. Wait for processing
5. View summary

---

## 🐛 Troubleshooting

### Backend Issues

**"ModuleNotFoundError: No module named 'app'"**
- Solution: Make sure `app.py` and `video_processor.py` are in `/content/` in Colab
- Re-run Cell 3 to verify files exist

**"No module named 'flask'"**
- Solution: Re-run Cell 1 to install dependencies

**Server stops working**
- Solution: Keep Cell 5 running! Don't stop it
- If Colab disconnects, re-run all cells

**Can't see public URL**
- Solution: Check Cell 4 output carefully
- URL appears after a few seconds
- Look for `https://xxxxx.trycloudflare.com`

### Frontend Issues

**"Network Error" or "CORS Error"**
- Solution: Check `VITE_API_BASE_URL` in `frontend/.env`
- Make sure backend is running
- Verify URL is correct (no trailing slash)

**"401 Unauthorized"**
- Solution: Login again or sign up
- Check if token is stored in localStorage

**Build errors**
- Solution: Run `npm install` again
- Delete `node_modules` and reinstall

---

## 📝 Quick Checklist

### For Colab Backend:
- [ ] Enable GPU in Colab
- [ ] Run Cell 1 (install dependencies)
- [ ] Run Cell 2 (set API keys - **add your keys!**)
- [ ] Run Cell 3 (create/upload backend files)
- [ ] Run Cell 4 (setup tunnel - **copy the URL!**)
- [ ] Run Cell 5 (start server - **keep running!**)
- [ ] Update `frontend/.env` with public URL

### For Local Backend:
- [ ] Create virtual environment
- [ ] Install dependencies
- [ ] Set environment variables
- [ ] Run `python app.py`
- [ ] Update `frontend/.env` with `http://localhost:5000`

### For Frontend:
- [ ] Install dependencies (`npm install`)
- [ ] Update `.env` with backend URL
- [ ] Run `npm run dev`
- [ ] Open `http://localhost:3000`

---

## 🎯 Next Steps

1. **Sign Up**: Create an account on the frontend (or use Gemini Direct mode without account)
2. **Choose Mode**: 
   - **Backend API**: For full-featured processing (requires backend)
   - **Gemini Direct**: For client-side processing (no backend needed)
3. **Upload Video**: Upload a test video (max 500MB)
4. **Select Options**: Choose summary style, format, and length
5. **Wait for Processing**: Monitor progress in real-time
6. **View Summary**: See results with video player and multiple formats
7. **Export**: Download summary as PDF, Word, or Markdown

## 🌟 Gemini Direct Mode (No Backend Required)

If you don't want to run a backend server, you can use **Gemini Direct** mode:

1. Get a free Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Select "Gemini Direct" mode in the upload form
3. Enter your API key (saved locally in browser)
4. Upload and process videos directly in your browser!

**Benefits:**
- ✅ No backend server needed
- ✅ Works completely offline
- ✅ Free tier available
- ✅ Privacy-focused (videos stay in browser)
- ✅ All features work (player, formats, export)

See [GEMINI_DIRECT_FEATURE.md](./GEMINI_DIRECT_FEATURE.md) for complete documentation.

---

## 📚 Documentation

- **Frontend Details**: See `frontend/README.md`
- **Backend Details**: See `backend/README.md`

---

## ⚠️ Important Notes

1. **Colab Sessions**: Expire after inactivity. Keep notebook active!
2. **Cell 5**: This is your server! Don't stop it.
3. **Public URL**: Changes each time you restart tunnel. Update frontend `.env` if it changes.
4. **API Keys**: Keep them secret! Don't commit to git.
5. **GPU Required**: For model inference. Colab provides free T4 GPU.

---

## 🚀 You're Ready!

Once both backend and frontend are running:
- Backend is processing videos
- Frontend is connected and ready
- You can start uploading videos!

Happy summarizing! 🎉
