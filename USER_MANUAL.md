# VideoWise - Comprehensive User Manual

## Table of Contents
1. [Introduction](#introduction)
2. [Getting Started](#getting-started)
3. [Downloading and Running the Code](#downloading-and-running-the-code)
4. [Using the Deployed Version](#using-the-deployed-version)
5. [Features Guide](#features-guide)
6. [Troubleshooting](#troubleshooting)
7. [FAQ](#faq)

---

## Introduction

**VideoWise** is an AI-powered video summarization platform that automatically generates intelligent summaries of videos by analyzing audio, visual content, and on-screen text. Whether you're a student, professional, content creator, or researcher, VideoWise helps you quickly understand video content without watching the entire video.

### Key Features
- 🎥 **Video Upload**: Upload videos directly or provide YouTube URLs
- 🤖 **AI-Powered Analysis**: Uses advanced AI models to analyze audio, visuals, and text
- 📝 **Multiple Summary Formats**: Paragraph, bullet points, timeline, chapters, and highlights
- 🎨 **Customizable Styles**: Professional, commercial, educational, casual, technical, or default
- 📊 **Personalized Summaries**: Tailored to your expertise and preferences
- 💾 **Export Options**: Download summaries as PDF, Word, or Markdown
- 🌙 **Dark Mode**: Comfortable viewing in light or dark theme
- 📱 **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

---

## Getting Started

### Prerequisites

**For Running Locally:**
- **Backend**: Python 3.8+ (GPU recommended but not required)
- **Frontend**: Node.js 18+ and npm
- **API Keys** (optional but recommended):
  - Groq API Key: [Get free key](https://console.groq.com/)
  - Google Gemini API Key: [Get free key](https://makersuite.google.com/app/apikey)

**For Using Deployed Version:**
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Internet connection
- (Optional) Google Gemini API Key for direct processing mode

---

## Downloading and Running the Code

### Step 1: Download the Code

#### Option A: Using Git (Recommended)
```bash
# Clone the repository
git clone <your-repository-url>
cd Project
```

#### Option B: Download ZIP
1. Download the project ZIP file from your repository
2. Extract it to your desired location
3. Open terminal/command prompt in the extracted folder

### Step 2: Backend Setup

#### Option A: Run Backend on Google Colab (Free GPU - Recommended)

**Why Colab?**
- Free GPU access (T4 GPU)
- No local setup required
- Easy to share and collaborate

**Steps:**

1. **Open Google Colab**
   - Go to [Google Colab](https://colab.research.google.com/)
   - Sign in with your Google account
   - Click **File → New notebook**

2. **Enable GPU**
   - Click **Runtime → Change runtime type**
   - Select **Hardware accelerator: GPU (T4)**
   - Click **Save**

3. **Upload Backend Files**
   - Upload `backend/app.py` to Colab
   - Upload `backend/video_processor.py` to Colab
   - Or copy the code into Colab cells

4. **Install Dependencies**
   ```python
   !pip install -q flask flask-cors flask-jwt-extended cloudflared requests torch torchvision transformers opencv-python librosa easyocr moviepy sentencepiece protobuf groq google-generativeai yt-dlp python-dotenv
   print("✅ Dependencies installed!")
   ```

5. **Set API Keys**
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

6. **Setup Cloudflare Tunnel (Get Public URL)**
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

7. **Start Backend Server**
   ```python
   import sys
   sys.path.insert(0, '/content')
   
   from app import app
   
   print("\n" + "="*60)
   print("🚀 Starting VideoWise Backend Server...")
   print("="*60)
   
   PUBLIC_URL = "https://xxxxx.trycloudflare.com"  # ⬅️ Use URL from step 6
   
   print(f"\n📍 Local URL: http://localhost:5000")
   print(f"🌐 Public URL: {PUBLIC_URL}")
   print(f"\n📋 Add this to frontend/.env:")
   print(f"   VITE_API_BASE_URL={PUBLIC_URL}")
   print("\n✅ Server is starting...")
   print("⚠️  DO NOT CLOSE THIS CELL - Keep it running!")
   print("="*60)
   
   app.run(host='0.0.0.0', port=5000, debug=False, use_reloader=False)
   ```
   
   **⚠️ IMPORTANT**: Keep this cell running! This is your server.

#### Option B: Run Backend Locally

1. **Navigate to Backend Directory**
   ```bash
   cd backend
   ```

2. **Create Virtual Environment**
   ```bash
   # On Linux/Mac:
   python3 -m venv venv
   source venv/bin/activate
   
   # On Windows:
   python -m venv venv
   venv\Scripts\activate
   ```

3. **Install Dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Set Environment Variables**
   
   Create a `.env` file in the `backend/` directory:
   ```env
   JWT_SECRET_KEY=your-secret-key-change-this
   GROQ_API_KEY=your-groq-api-key
   GEMINI_API_KEY=your-gemini-api-key
   UPLOAD_FOLDER=./uploads
   DB_PATH=./videowise.db
   FLASK_ENV=development
   ```

5. **Run Server**
   ```bash
   python app.py
   ```
   
   Server runs on `http://localhost:5000`

### Step 3: Frontend Setup

1. **Navigate to Frontend Directory**
   ```bash
   cd frontend
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   
   Create/update `.env` file in `frontend/` directory:
   ```env
   # For Colab backend:
   VITE_API_BASE_URL=https://xxxxx.trycloudflare.com
   
   # OR for local backend:
   # VITE_API_BASE_URL=http://localhost:5000
   
   # Optional: Gemini API keys for direct processing (fallback)
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_GEMINI_API_KEY_2=optional_fallback_key_1
   VITE_GEMINI_API_KEY_3=optional_fallback_key_2
   ```

4. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   Frontend runs on `http://localhost:3000`

5. **Open in Browser**
   - Navigate to `http://localhost:3000`
   - You should see the VideoWise homepage

### Step 4: Verify Setup

1. **Test Backend**
   - Open browser: `https://your-url.trycloudflare.com/health` (or `http://localhost:5000/health` for local)
   - Should return: `{"status": "healthy", ...}`

2. **Test Frontend**
   - Open `http://localhost:3000`
   - Sign up for a new account
   - Upload a test video
   - Wait for processing
   - View summary

---

## Using the Deployed Version

### Accessing the Website

1. **Get the Deployed URL**
   - The deployed frontend URL will be provided by your instructor/administrator
   - Or check your Vercel/Netlify dashboard if you deployed it yourself

2. **Open in Browser**
   - Simply navigate to the provided URL in any modern web browser
   - No installation or setup required!

### First-Time Setup

1. **Create an Account**
   - Click **"Sign Up"** on the homepage
   - Enter your name, email, and password
   - Click **"Create Account"**
   - You'll be automatically logged in

2. **Configure Profile (Optional)**
   - Go to **Profile** from the navigation menu
   - Add your expertise areas (e.g., "Machine Learning", "Business", "Education")
   - Set your summary preferences
   - This helps personalize your summaries

### Using Direct Processing Mode (No Backend Required)

If the backend is unavailable, you can still use VideoWise with **Direct Processing Mode**:

1. **Get a Gemini API Key**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account
   - Click **"Create API Key"**
   - Copy the key

2. **Enter API Key**
   - When uploading a video, if backend is down, you'll be prompted for an API key
   - Paste your Gemini API key
   - The key is stored locally in your browser (not sent to any server)

3. **Process Videos**
   - Upload videos as normal
   - Processing happens directly in your browser
   - All features work the same way

**Note**: YouTube URLs can be processed even when the backend is down! The frontend will automatically download YouTube videos using public API services and then process them with Gemini. However, if the download services are unavailable, you may need to:
- Download the video manually and upload the file directly
- Ensure your backend server is running (YouTube downloads work more reliably with backend)

---

## Features Guide

### 1. Uploading Videos

#### Method 1: Upload Video File
1. Click **"Upload Video"** tab
2. Click **"Upload a file"** or drag and drop a video
3. Supported formats: MP4, AVI, MOV, MKV (up to 500MB)
4. Select your video file
5. Preview will appear below

#### Method 2: From URL
1. Click **"From URL"** tab
2. Paste the video URL
   - **YouTube URLs**: Supported (requires backend)
   - **Direct video URLs**: Supported (e.g., `https://example.com/video.mp4`)
3. Click **"Start Summarization"**

### 2. Customizing Summary Options

Before processing, you can customize:

#### Number of Frames
- **Range**: 5-20 frames
- **Default**: 10 frames
- **More frames** = Better analysis but slower processing
- **Fewer frames** = Faster processing but less detailed

#### Summary Style
Choose the tone and style:
- **Default**: Standard comprehensive summary
- **Professional**: Formal, business-oriented
- **Commercial**: Marketing-focused, persuasive
- **Educational**: Academic-style, learning-focused
- **Casual**: Relaxed, conversational
- **Technical**: Detailed technical summary

#### Summary Format
Choose how the summary is structured:
- **Paragraph**: Flowing narrative summary
- **Bullet Points**: Quick scanning format
- **Timeline**: Chronological breakdown with timestamps
- **Chapters**: Divided into sections with headings
- **Key Moments**: Only highlights and important points

#### Summary Length
Control the word count:
- **Auto**: Let AI decide optimal length
- **Short**: ~100 words - Quick overview
- **Medium**: ~250 words - Balanced summary
- **Long**: ~500 words - Detailed summary
- **Custom**: Specify exact word count (50-2000 words)

### 3. Processing Videos

1. **Start Processing**
   - Click **"Start Summarization"** button
   - You'll be redirected to the job page

2. **Monitor Progress**
   - Real-time progress bar shows processing status
   - Current step is displayed (e.g., "Extracting frames", "Generating summary")
   - Estimated time remaining is shown

3. **Wait for Completion**
   - Processing typically takes 1-5 minutes depending on video length
   - You can navigate away and come back later
   - Job status is saved and can be accessed from Dashboard

### 4. Viewing Results

Once processing is complete:

1. **Video Player**
   - Watch the video with built-in player
   - Timeline markers show key moments
   - Click markers to jump to important sections

2. **Summary Display**
   - Summary appears in your selected format
   - Switch between formats using tabs
   - Copy text with one click

3. **Export Options**
   - Click **"Export"** button
   - Choose format:
     - **PDF**: Formatted document
     - **Word**: Editable .docx file
     - **Markdown**: Plain text format
   - Or **Copy** to clipboard

### 5. Managing Your Videos

#### Dashboard
- View all your processed videos
- See job status (processing, done, failed)
- Click any job to view results
- Filter by status or date

#### Profile
- Update your profile information
- Set expertise areas
- Configure summary preferences
- These settings personalize future summaries

### 6. Account Management

#### Sign Up
- Create a new account with email and password
- Account is free to create
- No credit card required

#### Login
- Use your email and password
- Stay logged in across sessions
- Secure JWT-based authentication

#### Logout
- Click your profile menu
- Select **"Logout"**
- Clears session data

---

## Troubleshooting

### Backend Issues

#### "ModuleNotFoundError: No module named 'app'"
**Solution**: 
- Make sure `app.py` and `video_processor.py` are in `/content/` in Colab
- Re-run the cell that creates/uploads backend files

#### "No module named 'flask'"
**Solution**: 
- Re-run the dependency installation cell
- Make sure all packages installed successfully

#### Server stops working
**Solution**: 
- Keep the server cell running! Don't stop it
- If Colab disconnects, re-run all cells
- Check for errors in the cell output

#### Can't see public URL
**Solution**: 
- Check Cloudflare tunnel cell output carefully
- URL appears after a few seconds
- Look for `https://xxxxx.trycloudflare.com`
- Try re-running the tunnel cell

#### "Failed to download video from URL"
**Solution**:
- Check if the URL is valid and accessible
- For YouTube URLs, ensure backend is running
- Try a different video URL
- Check your internet connection

### Frontend Issues

#### "Network Error" or "CORS Error"
**Solution**: 
- Check `VITE_API_BASE_URL` in `frontend/.env`
- Make sure backend is running
- Verify URL is correct (no trailing slash)
- For Colab backend, ensure tunnel is active

#### "401 Unauthorized"
**Solution**: 
- Login again or sign up
- Check if token is stored in localStorage
- Clear browser cache and try again

#### Build errors
**Solution**: 
- Run `npm install` again
- Delete `node_modules` and reinstall:
  ```bash
  rm -rf node_modules
  npm install
  ```
- Check Node.js version (should be 18+)

#### "vite: command not found" (Vercel deployment)
**Solution**: 
- This is already fixed in the codebase
- Ensure `package.json` has correct build scripts
- Check `vercel.json` configuration

#### "404: NOT_FOUND" (Vercel deployment)
**Solution**: 
- This is already fixed in the codebase
- Ensure `vercel.json` specifies correct output directory
- Check build output directory matches configuration

### Video Processing Issues

#### "Video processing failed"
**Solution**: 
- Check video file format (MP4, AVI, MOV supported)
- Ensure file size is under 500MB
- Try a shorter video first
- Check backend logs for detailed error

#### "Video processing timed out"
**Solution**: 
- Video might be too long
- Try reducing number of frames
- Check backend resources (GPU memory)
- Try again later

#### Summary is too short/long
**Solution**: 
- Adjust summary length setting
- Use "Custom" option for exact word count
- Try different summary formats

### YouTube URL Issues

#### "YouTube video downloads require backend"
**Solution**: 
- Ensure backend server is running
- Check backend URL is correct in frontend `.env`
- Verify backend has `yt-dlp` installed
- Try a different YouTube video

#### YouTube download fails
**Solution**: 
- Check if video is publicly accessible
- Some videos may be region-restricted
- Try downloading the video manually and uploading the file
- Check backend logs for specific error

---

## FAQ

### General Questions

**Q: Is VideoWise free to use?**
A: Yes! VideoWise is free to use. You only need API keys for some features (Groq and Gemini offer free tiers).

**Q: What video formats are supported?**
A: MP4, AVI, MOV, and MKV formats are supported. Maximum file size is 500MB.

**Q: How long does processing take?**
A: Typically 1-5 minutes depending on video length and number of frames analyzed. Longer videos take more time.

**Q: Can I process multiple videos at once?**
A: Currently, videos are processed one at a time. You can start multiple jobs, but they'll process sequentially.

**Q: Are my videos stored permanently?**
A: Videos are temporarily stored during processing and then deleted. Only summaries and metadata are kept.

**Q: Can I use VideoWise offline?**
A: Direct Processing Mode works offline after initial setup, but YouTube downloads and backend features require internet.

### Technical Questions

**Q: Do I need a GPU?**
A: GPU is recommended for faster processing but not required. Backend will work on CPU (slower).

**Q: Can I run backend on my own server?**
A: Yes! Follow the "Run Backend Locally" instructions. You can deploy to any server that supports Python.

**Q: How do I update the code?**
A: Pull latest changes from git repository, or re-download the code. Then reinstall dependencies if needed.

**Q: Can I customize the AI models?**
A: Yes, you can modify `backend/video_processor.py` to use different models. See backend README for details.

**Q: Is my data secure?**
A: Yes! Videos are processed locally or on your backend. API keys are stored securely. No data is shared with third parties.

### Feature Questions

**Q: Can I edit summaries?**
A: Yes! Export summaries as Word (.docx) to edit them, or copy and paste into any editor.

**Q: Can I share summaries with others?**
A: Yes! Export as PDF or Word and share the file, or copy the text.

**Q: Can I process audio-only files?**
A: Currently, VideoWise requires video files. Audio extraction happens automatically from videos.

**Q: What languages are supported?**
A: Currently, English is the primary language. Multi-language support may be added in future updates.

**Q: Can I integrate VideoWise with other tools?**
A: Yes! Use the API endpoints to integrate with other applications. See backend README for API documentation.

---

## Support and Resources

### Documentation
- **Main README**: `README.md` - Quick start guide
- **Backend README**: `backend/README.md` - Backend technical details
- **Frontend README**: `frontend/README.md` - Frontend technical details
- **Gemini Direct Feature**: `GEMINI_DIRECT_FEATURE.md` - Direct processing guide

### Getting Help
- Check the Troubleshooting section above
- Review error messages carefully
- Check backend/frontend logs for detailed errors
- Consult the FAQ section

### Contributing
- Report bugs or issues
- Suggest new features
- Improve documentation
- Share your feedback

---

## Quick Reference

### Important URLs
- **Frontend (Local)**: `http://localhost:3000`
- **Backend (Local)**: `http://localhost:5000`
- **Backend Health Check**: `http://localhost:5000/health`
- **Google Colab**: https://colab.research.google.com/
- **Groq API**: https://console.groq.com/
- **Gemini API**: https://makersuite.google.com/app/apikey

### Key Commands
```bash
# Backend (Local)
cd backend
python app.py

# Frontend
cd frontend
npm run dev

# Install dependencies
pip install -r requirements.txt  # Backend
npm install                      # Frontend
```

### Environment Variables
```env
# Backend (.env)
JWT_SECRET_KEY=your-secret-key
GROQ_API_KEY=your-groq-key
GEMINI_API_KEY=your-gemini-key
UPLOAD_FOLDER=./uploads
DB_PATH=./videowise.db

# Frontend (.env)
VITE_API_BASE_URL=http://localhost:5000
VITE_GEMINI_API_KEY=your-gemini-key
```

---

## Conclusion

Congratulations! You now know how to:
- ✅ Download and run VideoWise locally
- ✅ Use the deployed version
- ✅ Upload and process videos
- ✅ Customize summaries
- ✅ Export and share results
- ✅ Troubleshoot common issues

**Happy summarizing! 🎉**

If you have any questions or need help, refer to the Troubleshooting section or consult the documentation files.

---

*Last Updated: [Current Date]*
*Version: 1.0*

