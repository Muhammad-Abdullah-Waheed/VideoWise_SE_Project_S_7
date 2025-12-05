# VideoWise - Comprehensive User Manual

## Table of Contents
1. [Introduction](#introduction)
2. [Prerequisites](#prerequisites)
3. [Downloading and Running the Code](#downloading-and-running-the-code)
   - [Backend Setup](#backend-setup)
   - [Frontend Setup](#frontend-setup)
4. [Using the Deployed Version](#using-the-deployed-version)
5. [Features and Usage Guide](#features-and-usage-guide)
6. [YouTube URL Support](#youtube-url-support)
7. [Troubleshooting](#troubleshooting)
8. [FAQs](#faqs)

---

## Introduction

**VideoWise** is an AI-powered video summarization platform that automatically generates intelligent summaries of videos by analyzing audio, visual content, and on-screen text. The platform uses state-of-the-art AI models including BLIP (image captioning), Whisper (audio transcription), EasyOCR (text extraction), and advanced LLM models (Groq LLaMA and Google Gemini) to create comprehensive summaries.

### Key Features
- **Multiple Summary Styles**: Default, Professional, Commercial, Educational, Casual, Technical
- **Multiple Summary Formats**: Paragraph, Bullet Points, Timeline, Chapters, Key Moments
- **Customizable Length**: Auto, Short (~100 words), Medium (~250 words), Long (~500 words), or Custom word count
- **YouTube Support**: Download and summarize videos directly from YouTube URLs
- **Video Player**: Watch videos with interactive timeline and key moments
- **Export Options**: Download summaries as PDF, Word document, or Markdown
- **User Profiles**: Personalized summaries based on your expertise and preferences
- **Dark Mode**: Comfortable viewing in light or dark theme
- **Offline Mode**: Process videos directly in browser using Gemini API (no backend required)

---

## Prerequisites

### For Running Backend Locally
- **Python 3.8 or higher** ([Download](https://www.python.org/downloads/))
- **pip** (Python package manager, usually comes with Python)
- **Git** ([Download](https://git-scm.com/downloads))
- **GPU (Recommended)**: For faster processing, though CPU will work
- **API Keys**:
  - **Groq API Key** (Free tier available): [Get it here](https://console.groq.com/)
  - **Google Gemini API Key** (Free tier available): [Get it here](https://makersuite.google.com/app/apikey)

### For Running Frontend Locally
- **Node.js 18 or higher** ([Download](https://nodejs.org/))
- **npm** (comes with Node.js)

### For Using Deployed Version
- **Modern Web Browser**: Chrome, Firefox, Safari, or Edge (latest versions)
- **Internet Connection**: Required for accessing the deployed application
- **Optional**: Google Gemini API Key (for offline/direct processing mode)

---

## Downloading and Running the Code

### Step 1: Clone or Download the Repository

#### Option A: Using Git (Recommended)
```bash
git clone https://github.com/Muhammad-Abdullah-Waheed/VideoWise_SE_Project_S_7.git
cd VideoWise_SE_Project_S_7
```

#### Option B: Download ZIP
1. Go to the GitHub repository: `https://github.com/Muhammad-Abdullah-Waheed/VideoWise_SE_Project_S_7`
2. Click the green **"Code"** button
3. Select **"Download ZIP"**
4. Extract the ZIP file to your desired location
5. Open terminal/command prompt in the extracted folder

---

## Backend Setup

### Method 1: Running Backend Locally (Recommended for Development)

#### Step 1: Navigate to Backend Directory
```bash
cd backend
```

#### Step 2: Create Virtual Environment
**On Linux/Mac:**
```bash
python3 -m venv venv
source venv/bin/activate
```

**On Windows:**
```bash
python -m venv venv
venv\Scripts\activate
```

You should see `(venv)` in your terminal prompt, indicating the virtual environment is active.

#### Step 3: Install Dependencies
```bash
pip install -r requirements.txt
```

**Note**: This may take 10-15 minutes as it downloads large ML models and dependencies.

#### Step 4: Set Up Environment Variables
Create a `.env` file in the `backend/` directory:

```env
JWT_SECRET_KEY=your-secret-key-change-this-to-something-random
GROQ_API_KEY=your-groq-api-key-here
GEMINI_API_KEY=your-gemini-api-key-here
UPLOAD_FOLDER=./uploads
DB_PATH=./videowise.db
FLASK_ENV=development
```

**Important**: Replace the placeholder values with your actual API keys.

#### Step 5: Create Uploads Directory
```bash
mkdir uploads
mkdir uploads/downloads
```

#### Step 6: Run the Backend Server
```bash
python app.py
```

You should see output like:
```
✅ Video processor initialized
🚀 Starting VideoWise Backend Server...
📍 Server running on http://localhost:5000
```

**Keep this terminal window open** - the server must stay running.

### Method 2: Running Backend on Google Colab (Free GPU)

#### Step 1: Open Google Colab
1. Go to [Google Colab](https://colab.research.google.com/)
2. Sign in with your Google account
3. Click **File → New notebook**

#### Step 2: Enable GPU
1. Click **Runtime → Change runtime type**
2. Select **Hardware accelerator: GPU (T4)**
3. Click **Save**

#### Step 3: Upload Backend Files
1. Upload `backend/app.py` and `backend/video_processor.py` to Colab
2. Or copy their contents into Colab cells

#### Step 4: Install Dependencies
Create a new cell and run:
```python
!pip install -q flask flask-cors flask-jwt-extended torch torchvision transformers opencv-python librosa easyocr moviepy sentencepiece protobuf groq google-generativeai yt-dlp python-dotenv
print("✅ Dependencies installed!")
```

#### Step 5: Set API Keys
Create a new cell and run:
```python
import os

os.environ['JWT_SECRET_KEY'] = 'your-secret-key-change-this'
os.environ['GROQ_API_KEY'] = 'your-groq-api-key'
os.environ['GEMINI_API_KEY'] = 'your-gemini-api-key'
os.environ['UPLOAD_FOLDER'] = '/content/uploads'
os.environ['DB_PATH'] = '/content/videowise.db'

print("✅ API keys configured")
```

#### Step 6: Setup Cloudflare Tunnel (For Public Access)
Create a new cell and run:
```python
import subprocess
import time

!wget -q https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -O cloudflared
!chmod +x cloudflared

process = subprocess.Popen(
    ['./cloudflared', 'tunnel', '--url', 'http://localhost:5000'],
    stdout=subprocess.PIPE,
    stderr=subprocess.STDOUT,
    text=True
)

time.sleep(8)
print("\n🌐 Look for the public URL above (https://xxxxx.trycloudflare.com)")
print("⚠️  COPY THIS URL - You'll need it for frontend!")
```

**Copy the public URL** that appears (e.g., `https://xxxxx.trycloudflare.com`)

#### Step 7: Start Backend Server
Create a new cell and run:
```python
import sys
sys.path.insert(0, '/content')

from app import app

print("🚀 Starting VideoWise Backend Server...")
print("⚠️  DO NOT CLOSE THIS CELL - Keep it running!")

app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)
```

**Keep this cell running** - this is your server.

---

## Frontend Setup

### Step 1: Navigate to Frontend Directory
Open a **new terminal window** (keep backend running in the other terminal) and run:
```bash
cd frontend
```

### Step 2: Install Dependencies
```bash
npm install
```

This may take 2-5 minutes.

### Step 3: Configure Environment Variables
Create a `.env` file in the `frontend/` directory:

**For Local Backend:**
```env
VITE_API_BASE_URL=http://localhost:5000
VITE_GEMINI_API_KEY=your-gemini-api-key-here
VITE_GEMINI_API_KEY_2=optional-second-key
VITE_GEMINI_API_KEY_3=optional-third-key
```

**For Colab/Remote Backend:**
```env
VITE_API_BASE_URL=https://xxxxx.trycloudflare.com
VITE_GEMINI_API_KEY=your-gemini-api-key-here
VITE_GEMINI_API_KEY_2=optional-second-key
VITE_GEMINI_API_KEY_3=optional-third-key
```

**Important**: 
- Replace `https://xxxxx.trycloudflare.com` with your actual backend URL
- Replace `your-gemini-api-key-here` with your actual Gemini API key
- The additional API keys (`VITE_GEMINI_API_KEY_2`, `VITE_GEMINI_API_KEY_3`) are optional fallbacks

### Step 4: Start Development Server
```bash
npm run dev
```

You should see output like:
```
  VITE v5.x.x  ready in xxx ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
```

### Step 5: Open in Browser
Open your web browser and navigate to:
```
http://localhost:3000
```

You should see the VideoWise homepage!

---

## Using the Deployed Version

### Accessing the Deployed Application

The frontend is deployed on **Vercel** and can be accessed at:
```
https://your-vercel-deployment-url.vercel.app
```

(Replace with your actual Vercel deployment URL)

### First-Time Setup

1. **Open the Website**: Navigate to the deployed URL in your browser
2. **Create an Account**: Click "Sign Up" and fill in:
   - Name
   - Email address
   - Password
   - Optional: Role and expertise areas
3. **Sign In**: After creating an account, sign in with your credentials

### Using Without Backend (Offline Mode)

If the backend server is not available, you can still use VideoWise in **Direct Processing Mode**:

1. **Ensure API Key is Configured**: The frontend will use API keys from environment variables
2. **Upload Video**: Select a video file (not YouTube URL - those require backend)
3. **Process**: The video will be processed directly in your browser using Gemini API
4. **View Results**: Summary will be displayed once processing completes

**Note**: YouTube URLs require the backend server. For YouTube videos, ensure the backend is running and accessible.

---

## Features and Usage Guide

### 1. Creating an Account

1. Click **"Sign Up"** on the homepage or navigation bar
2. Fill in the registration form:
   - **Name**: Your full name
   - **Email**: A valid email address (used for login)
   - **Password**: A secure password (minimum 6 characters)
   - **Role** (Optional): Your profession or role
   - **Expertise** (Optional): Areas of expertise (e.g., "Technology", "Business", "Education")
3. Click **"Create Account"**
4. You'll be automatically logged in and redirected to the dashboard

### 2. Signing In

1. Click **"Sign In"** on the homepage or navigation bar
2. Enter your **email** and **password**
3. Click **"Sign In"**
4. You'll be redirected to your dashboard

### 3. Uploading and Processing a Video

#### Option A: Upload Video File

1. **Navigate to Upload Page**: Click "New Summary" or "Upload Video" from the dashboard
2. **Select Upload Tab**: Ensure "Upload Video" tab is selected
3. **Choose File**: 
   - Click "Upload a file" or drag and drop a video file
   - Supported formats: MP4, AVI, MOV, WebM, MKV
   - Maximum file size: 500MB
4. **Preview** (Optional): Review the video before processing
5. **Configure Options** (see below)
6. **Click "Start Summarization"**

#### Option B: Process from URL

1. **Navigate to Upload Page**: Click "New Summary" or "Upload Video"
2. **Select URL Tab**: Click "From URL" tab
3. **Enter URL**: 
   - For YouTube: `https://youtube.com/watch?v=VIDEO_ID` or `https://youtu.be/VIDEO_ID`
   - For direct video links: Any direct link to a video file (MP4, etc.)
4. **Configure Options** (see below)
5. **Click "Start Summarization"**

**Note**: YouTube URLs require the backend server to be running. Direct video URLs can work with or without backend.

### 4. Configuring Summary Options

Before starting summarization, you can customize:

#### Summary Style
- **Default**: Standard comprehensive summary
- **Professional**: Formal, business-oriented language
- **Commercial**: Marketing-focused, persuasive tone
- **Educational**: Academic-style, learning-focused
- **Casual**: Relaxed, conversational tone
- **Technical**: Detailed technical summary with terminology

#### Summary Format
- **Paragraph**: Flowing narrative summary
- **Bullet Points**: Quick scanning format with bullet points
- **Timeline**: Chronological breakdown with timestamps
- **Chapters**: Divided into clear sections with headings
- **Key Moments**: Only highlights and important points

#### Summary Length
- **Auto**: Let AI decide optimal length
- **Short**: ~100 words - Quick overview
- **Medium**: ~250 words - Balanced summary
- **Long**: ~500 words - Detailed summary
- **Custom**: Specify exact word count (50-2000 words)

#### Number of Frames
- Controls how many frames are analyzed from the video
- Range: 5-20 frames
- More frames = better analysis but slower processing
- Recommended: 10 frames for most videos

### 5. Monitoring Processing Progress

After clicking "Start Summarization":

1. **Job Created**: You'll be redirected to the job page
2. **Progress Bar**: Shows real-time processing progress (0-100%)
3. **Status Updates**: Displays current step:
   - "Queued" - Waiting to start
   - "Extracting frames" - Analyzing video frames
   - "Transcribing audio" - Converting speech to text
   - "Analyzing visual content" - Generating captions
   - "Generating summary" - Creating final summary
   - "Complete" - Processing finished
4. **Wait Time**: Processing typically takes 1-5 minutes depending on video length and options

### 6. Viewing Results

Once processing is complete:

1. **Video Player**: Watch the video with playback controls
2. **Summary Display**: View the summary in your selected format
3. **Format Switcher**: Switch between different summary formats (Paragraph, Bullet, Timeline, etc.)
4. **Key Moments**: Click timestamps to jump to important moments in the video
5. **Export Options**: Download summary as PDF, Word, or Markdown

### 7. Exporting Summaries

1. **Click Export Button**: Located near the summary display
2. **Select Format**:
   - **PDF**: Formatted document suitable for printing
   - **Word**: Editable `.docx` file
   - **Markdown**: Plain text markdown format
   - **Copy**: Copy summary to clipboard
3. **Download**: File will be downloaded to your default download folder

### 8. Managing Your Profile

1. **Navigate to Profile**: Click your name/avatar → "Profile"
2. **Update Information**:
   - Name, Bio, Role
   - Expertise areas
   - Summary preferences (length, focus areas)
3. **Save Changes**: Click "Save Profile"
4. **Personalization**: Your profile information helps generate personalized summaries

### 9. Viewing Job History

1. **Dashboard**: Click "Dashboard" in navigation
2. **Job List**: See all your processed videos
3. **Status Indicators**: 
   - Green = Completed
   - Yellow = Processing
   - Red = Failed
4. **Click Job**: Open any job to view details and summary

### 10. Dark Mode

1. **Toggle Theme**: Click the theme icon (sun/moon) in the navigation bar
2. **System Preference**: Theme automatically matches your system preference on first visit
3. **Persistent**: Your theme choice is saved and remembered

---

## YouTube URL Support

### How It Works

VideoWise supports downloading and summarizing videos directly from YouTube URLs using `yt-dlp`, a powerful YouTube downloader.

### Supported YouTube URL Formats

- Full URL: `https://www.youtube.com/watch?v=VIDEO_ID`
- Short URL: `https://youtu.be/VIDEO_ID`
- Mobile URL: `https://m.youtube.com/watch?v=VIDEO_ID`

### Requirements

- **Backend Server Must Be Running**: YouTube download requires the backend server
- **yt-dlp Installed**: Automatically installed when you install backend dependencies
- **Public Videos Only**: Private or age-restricted videos cannot be downloaded

### How to Use

1. **Ensure Backend is Running**: Start the backend server (see [Backend Setup](#backend-setup))
2. **Navigate to Upload Page**: Click "New Summary" or "Upload Video"
3. **Select URL Tab**: Click "From URL" tab
4. **Enter YouTube URL**: Paste any YouTube video URL
5. **Configure Options**: Select summary style, format, and length
6. **Start Processing**: Click "Start Summarization"
7. **Wait for Download**: The backend will download the video (may take 1-2 minutes)
8. **Processing**: Video will be processed normally after download

### Limitations

- **Backend Required**: YouTube URLs cannot be processed in offline/direct mode
- **Public Videos Only**: Private, unlisted (without link), or age-restricted videos may fail
- **Download Time**: Large videos may take longer to download
- **Video Quality**: Best available quality is downloaded (usually 720p or 1080p)

### Troubleshooting YouTube URLs

**Error: "Video unavailable"**
- Video may be private, deleted, or region-restricted
- Try a different public video

**Error: "Backend server required"**
- Ensure backend is running
- Check `VITE_API_BASE_URL` in frontend `.env` file

**Error: "Download failed"**
- Check your internet connection
- Video may be too large or unavailable
- Try a different video

---

## Troubleshooting

### Backend Issues

#### "ModuleNotFoundError: No module named 'flask'"
**Solution**: 
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
```

#### "Port 5000 already in use"
**Solution**: 
- Stop other applications using port 5000
- Or change port in `app.py`: `app.run(port=5001)`
- Update frontend `.env`: `VITE_API_BASE_URL=http://localhost:5001`

#### "API key invalid" or "401 Unauthorized"
**Solution**:
- Check your `.env` file in `backend/` directory
- Ensure API keys are correct and not expired
- Get new keys from [Groq](https://console.groq.com/) or [Google AI Studio](https://makersuite.google.com/app/apikey)

#### "Video processing failed"
**Solution**:
- Check video file is not corrupted
- Ensure video format is supported (MP4, AVI, MOV, etc.)
- Check video file size is under 500MB
- Review backend logs for detailed error messages

#### "yt-dlp download failed" (YouTube URLs)
**Solution**:
- Ensure `yt-dlp` is installed: `pip install yt-dlp`
- Check video is public and accessible
- Try a different YouTube video
- Check internet connection

### Frontend Issues

#### "Network Error" or "CORS Error"
**Solution**:
- Check backend is running (`http://localhost:5000/health`)
- Verify `VITE_API_BASE_URL` in `frontend/.env` matches backend URL
- Ensure no trailing slash in URL (use `http://localhost:5000` not `http://localhost:5000/`)
- Check backend CORS is enabled (should be automatic)

#### "Cannot find module" errors
**Solution**:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```

#### "Port 3000 already in use"
**Solution**:
- Stop other applications using port 3000
- Or change port: `npm run dev -- --port 3001`

#### "401 Unauthorized" when accessing pages
**Solution**:
- Sign out and sign in again
- Clear browser localStorage: Open DevTools → Application → Local Storage → Clear
- Check backend JWT_SECRET_KEY is set correctly

#### "YouTube URLs require backend"
**Solution**:
- This is expected behavior - YouTube URLs need backend server
- Start the backend server (see [Backend Setup](#backend-setup))
- Or upload video file directly instead of using URL

### General Issues

#### "Processing stuck at X%"
**Solution**:
- Wait a few more minutes (processing can take 5-10 minutes for long videos)
- Check backend logs for errors
- Refresh the page and check job status
- If stuck for >10 minutes, cancel and retry

#### "Summary is too short/long"
**Solution**:
- Adjust "Summary Length" option before processing
- Use "Custom" length to specify exact word count
- Reprocess video with different length setting

#### "Video player not loading"
**Solution**:
- Check video file exists and is accessible
- Try refreshing the page
- Check browser console for errors (F12 → Console)
- Ensure video format is supported by browser

#### "Export not working"
**Solution**:
- Check browser allows downloads
- Try a different export format
- Check browser console for errors
- Ensure summary is loaded before exporting

---

## FAQs

### Q: Do I need a GPU to run the backend?
**A**: GPU is recommended for faster processing, but CPU will work. Processing will be slower on CPU.

### Q: Can I use VideoWise without a backend server?
**A**: Yes! Use "Direct Processing Mode" with a Gemini API key. However, YouTube URLs require backend.

### Q: How much does it cost to use VideoWise?
**A**: 
- **Backend**: Free if running locally or on Colab (free GPU)
- **Groq API**: Free tier available (generous limits)
- **Gemini API**: Free tier available (60 requests/minute)
- **Deployment**: Vercel free tier for frontend

### Q: What video formats are supported?
**A**: MP4, AVI, MOV, WebM, MKV, and most common video formats.

### Q: What's the maximum video file size?
**A**: 500MB per video file.

### Q: How long does processing take?
**A**: Typically 1-5 minutes depending on:
- Video length
- Number of frames analyzed
- Backend processing power (GPU vs CPU)
- Current server load

### Q: Can I process multiple videos at once?
**A**: Currently, videos are processed one at a time. Multiple jobs can be queued.

### Q: Are my videos stored permanently?
**A**: 
- **Backend**: Videos are deleted after processing (stored temporarily)
- **Frontend**: Summaries are stored in browser localStorage (local only)
- **Database**: Only summary results are stored, not video files

### Q: Is my data secure?
**A**: 
- Passwords are hashed (never stored in plain text)
- JWT tokens for authentication
- Videos processed locally or on your server
- No video files stored permanently

### Q: Can I use VideoWise offline?
**A**: Partially - Direct Processing Mode works offline if you have a Gemini API key, but YouTube URLs require internet and backend.

### Q: How do I update VideoWise?
**A**: 
```bash
# Backend
cd backend
git pull
pip install -r requirements.txt

# Frontend
cd frontend
git pull
npm install
```

### Q: Where can I get API keys?
**A**: 
- **Groq**: https://console.groq.com/ (free tier)
- **Gemini**: https://makersuite.google.com/app/apikey (free tier)

### Q: Can I customize summary styles?
**A**: Yes! You can select from 6 predefined styles, or your profile preferences will influence the summary.

### Q: Does VideoWise support multiple languages?
**A**: Currently optimized for English, but can process videos in other languages (accuracy may vary).

---

## Support and Contact

For issues, questions, or contributions:
- **GitHub Repository**: https://github.com/Muhammad-Abdullah-Waheed/VideoWise_SE_Project_S_7
- **Report Issues**: Use GitHub Issues
- **Documentation**: See `README.md` and `backend/README.md` for technical details

---

## Version Information

- **Current Version**: 1.0.0
- **Last Updated**: 2024
- **License**: See repository for license information

---

**Thank you for using VideoWise!** 🎉

For the best experience, ensure both backend and frontend are running, and use a modern web browser with a stable internet connection.

