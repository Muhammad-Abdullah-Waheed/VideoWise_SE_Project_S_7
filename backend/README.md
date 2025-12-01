# Backend Implementation - VideoWise

## Overview

The VideoWise backend is a Flask-based REST API that processes videos, extracts audio/visual content, and generates AI-powered summaries. It uses multiple ML models for comprehensive video analysis and supports various summary styles and formats.

## Technology Stack

- **Framework**: Flask 3.0
- **Authentication**: Flask-JWT-Extended 4.6
- **CORS**: Flask-CORS 4.0
- **Database**: SQLite3
- **ML Models**:
  - BLIP (Salesforce) - Image captioning
  - Whisper (OpenAI) - Audio transcription
  - EasyOCR - Text extraction from frames
- **LLM Integration**:
  - Groq (LLaMA 3.3 70B) - Primary summarization
  - Google Gemini - Fallback summarization
- **Video Processing**: MoviePy, OpenCV
- **Audio Processing**: Librosa

## Project Structure

```
backend/
├── app.py                  # Main Flask application
├── video_processor.py      # Video processing logic
├── requirements.txt        # Python dependencies
├── colab_backend.ipynb     # Colab notebook (embedded files)
├── uploads/                # Uploaded video storage
├── videowise.db           # SQLite database
└── venv/                  # Virtual environment (local)
```

## Core Components

### app.py - Main Application

**Key Features:**
- Flask REST API server
- JWT-based authentication
- SQLite database management
- Background job processing
- File upload handling
- CORS configuration

**Main Endpoints:**
- `GET /` - API information
- `GET /health` - Health check
- `POST /auth/signup` - User registration
- `POST /auth/login` - User login
- `GET /auth/me` - Current user info
- `GET /user/profile` - Get user profile
- `PUT /user/profile` - Update user profile
- `POST /videos/upload` - Upload video
- `POST /videos/from-url` - Summarize from URL
- `GET /videos/status/<job_id>` - Get job status
- `GET /videos/result/<job_id>` - Get job result
- `GET /videos/list` - List user's jobs
- `GET /uploads/<filename>` - Serve video files

### video_processor.py - Video Processing

**Key Features:**
- Model initialization (BLIP, Whisper, EasyOCR)
- Keyframe extraction
- Audio extraction and transcription
- Visual content analysis
- OCR text extraction
- LLM-based summary generation

**Processing Pipeline:**
1. Extract keyframes from video
2. Extract and transcribe audio
3. Analyze visual content (captions + OCR)
4. Combine all information
5. Generate summary using LLM
6. Return structured results

## Database Schema

### Users Table
```sql
CREATE TABLE users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    password_hash TEXT,
    bio TEXT,
    role TEXT,
    expertise TEXT,  -- JSON array
    summary_preferences TEXT,  -- JSON object
    language TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Jobs Table
```sql
CREATE TABLE jobs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    status TEXT,  -- queued, processing, done, failed
    progress INTEGER,  -- 0-100
    step TEXT,
    video_path TEXT,
    num_frames INTEGER,
    summary_style TEXT,
    summary_format TEXT,
    summary_length_words INTEGER,
    metadata TEXT,  -- JSON object
    result TEXT,  -- JSON object
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
)
```

## Video Processing Flow

1. **Upload**: Video file saved to `uploads/` directory
2. **Job Creation**: Job record created in database with status 'queued'
3. **Background Processing**: Thread starts processing
4. **Frame Extraction**: Extract evenly spaced keyframes
5. **Audio Processing**: Extract audio and transcribe with Whisper
6. **Visual Analysis**: Generate captions for each frame with BLIP
7. **OCR Extraction**: Extract text from frames with EasyOCR
8. **Summary Generation**: Combine all data and generate summary with LLM
9. **Result Storage**: Save results to database
10. **Cleanup**: Remove processed video file

## Summary Styles

- **default**: Standard comprehensive summary
- **professional**: Formal, business-oriented
- **commercial**: Marketing-focused advertisement
- **educational**: Academic-style for learning
- **casual**: Relaxed, conversational
- **technical**: Detailed technical summary

## Summary Formats

- **paragraph**: Flowing narrative summary
- **bullet**: Bulleted list format
- **timeline**: Chronological breakdown
- **chapters**: Divided into sections
- **highlights**: Only key highlights

## Configuration

### Environment Variables

```env
JWT_SECRET_KEY=your-secret-key-change-this
GROQ_API_KEY=your-groq-api-key
GEMINI_API_KEY=your-gemini-api-key
UPLOAD_FOLDER=./uploads
DB_PATH=./videowise.db
FLASK_ENV=production
```

### Model Configuration

- **BLIP Model**: `Salesforce/blip-image-captioning-base`
- **Whisper Model**: `openai/whisper-base`
- **EasyOCR**: English language only
- **Groq Model**: `llama-3.3-70b-versatile`
- **Gemini Model**: `gemini-pro`

## API Request/Response Examples

### Upload Video
```http
POST /videos/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

file: <video_file>
num_frames: 10
summary_style: professional
summary_format: paragraph
summary_length_words: 250
```

**Response:**
```json
{
  "jobId": "uuid-here"
}
```

### Get Job Status
```http
GET /videos/status/<job_id>
Authorization: Bearer <token>
```

**Response:**
```json
{
  "jobId": "uuid-here",
  "status": "processing",
  "progress": 45,
  "step": "Generating summary",
  "etaSeconds": 110
}
```

### Get Job Result
```http
GET /videos/result/<job_id>
Authorization: Bearer <token>
```

**Response:**
```json
{
  "jobId": "uuid-here",
  "summary": "Full summary text...",
  "audio_transcription": "Transcribed audio...",
  "visualCaptions": [
    {"frame": 1, "caption": "Frame description..."}
  ],
  "videoUrl": "/uploads/filename.mp4",
  "summaryFormat": "paragraph"
}
```

## Error Handling

- Try-catch blocks around all operations
- Database transaction rollback on errors
- Job status updated to 'failed' on errors
- Error messages returned in JSON format
- HTTP status codes: 400 (bad request), 401 (unauthorized), 404 (not found), 500 (server error)

## Security Features

- JWT token-based authentication
- Password hashing with Werkzeug
- File upload validation (size, type)
- SQL injection prevention (parameterized queries)
- CORS configuration
- Secure filename handling

## Performance Considerations

- Background thread processing (non-blocking)
- Model loading on initialization (cached)
- GPU acceleration when available
- Efficient frame extraction
- Database indexing on user_id and job_id

## Dependencies

See `requirements.txt` for complete list. Key dependencies:
- Flask ecosystem (Flask, Flask-CORS, Flask-JWT-Extended)
- PyTorch and Transformers (ML models)
- OpenCV and MoviePy (video processing)
- Librosa (audio processing)
- EasyOCR (text extraction)
- Groq and Google Generative AI (LLM APIs)

## Deployment Considerations

### Colab Deployment
- Use `colab_backend.ipynb` notebook
- Cloudflare Tunnel for public URL
- GPU required for model inference
- Session persistence important

### Local Deployment
- Virtual environment recommended
- GPU optional but recommended
- Gunicorn for production server
- Environment variables for configuration

## Limitations

- Video file size limit: 500MB
- Processing time depends on video length
- GPU memory requirements for models
- Colab session timeout after inactivity
- SQLite not ideal for high concurrency

## Future Enhancements

- Redis for job queue management
- PostgreSQL for production database
- WebSocket support for real-time updates
- Video compression before processing
- Batch processing support
- Multiple video format support
- Cloud storage integration (S3, etc.)
