"""
VideoWise Backend API Server
Production-ready Flask backend for video summarization
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import os
import tempfile
import uuid
import json
import threading
import time
from datetime import datetime, timedelta
from typing import Dict, Optional
import sqlite3
from pathlib import Path
import yt_dlp

# Import video processor
from video_processor import VideoProcessor

app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER', './uploads')
app.config['MAX_CONTENT_LENGTH'] = 500 * 1024 * 1024  # 500MB max file size

CORS(app)
jwt = JWTManager(app)

# Initialize database
DB_PATH = os.getenv('DB_PATH', './videowise.db')

def init_db():
    """Initialize SQLite database"""
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    
    # Users table
    c.execute('''CREATE TABLE IF NOT EXISTS users
                 (id TEXT PRIMARY KEY, name TEXT, email TEXT UNIQUE, 
                  password_hash TEXT, bio TEXT, role TEXT, expertise TEXT,
                  summary_preferences TEXT, language TEXT, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)''')
    
    # Jobs table
    c.execute('''CREATE TABLE IF NOT EXISTS jobs
                 (id TEXT PRIMARY KEY, user_id TEXT, status TEXT, progress INTEGER,
                  step TEXT, video_path TEXT, num_frames INTEGER, summary_style TEXT,
                  summary_length_words INTEGER, metadata TEXT, result TEXT,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  FOREIGN KEY (user_id) REFERENCES users(id))''')
    
    conn.commit()
    conn.close()

init_db()

# Initialize video processor
video_processor = None
try:
    video_processor = VideoProcessor()
    print("✅ Video processor initialized")
except Exception as e:
    print(f"⚠️ Error initializing video processor: {e}")

# Job status tracking
jobs: Dict[str, Dict] = {}

# ==================== Authentication Endpoints ====================

@app.route('/auth/signup', methods=['POST'])
def signup():
    """User registration"""
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        role = data.get('role', 'user')
        expertise = data.get('expertise', [])
        
        if not name or not email or not password:
            return jsonify({'error': 'Missing required fields'}), 400
        
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        # Check if user exists
        c.execute('SELECT id FROM users WHERE email = ?', (email,))
        if c.fetchone():
            conn.close()
            return jsonify({'error': 'User already exists'}), 400
        
        # Create user
        user_id = str(uuid.uuid4())
        password_hash = generate_password_hash(password)
        summary_prefs = json.dumps({
            'length': 'medium',
            'focus': ['technical', 'highlevel'],
            'tone': 'professional'
        })
        
        c.execute('''INSERT INTO users (id, name, email, password_hash, role, expertise, summary_preferences)
                     VALUES (?, ?, ?, ?, ?, ?, ?)''',
                 (user_id, name, email, password_hash, role, json.dumps(expertise), summary_prefs))
        
        conn.commit()
        conn.close()
        
        # Create access token
        access_token = create_access_token(identity=user_id)
        
        return jsonify({
            'user': {
                'id': user_id,
                'name': name,
                'email': email,
                'role': role
            },
            'token': access_token
        }), 201
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/auth/login', methods=['POST'])
def login():
    """User login"""
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')
        
        if not email or not password:
            return jsonify({'error': 'Missing email or password'}), 400
        
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('SELECT id, name, email, password_hash, role FROM users WHERE email = ?', (email,))
        user = c.fetchone()
        conn.close()
        
        if not user or not check_password_hash(user[3], password):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        access_token = create_access_token(identity=user[0])
        
        return jsonify({
            'user': {
                'id': user[0],
                'name': user[1],
                'email': user[2],
                'role': user[4]
            },
            'token': access_token
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user info"""
    try:
        user_id = get_jwt_identity()
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''SELECT id, name, email, bio, role, expertise, summary_preferences, language
                     FROM users WHERE id = ?''', (user_id,))
        user = c.fetchone()
        conn.close()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'id': user[0],
            'name': user[1],
            'email': user[2],
            'bio': user[3],
            'role': user[4],
            'expertise': json.loads(user[5]) if user[5] else [],
            'summaryPreferences': json.loads(user[6]) if user[6] else {},
            'language': user[7] or 'en'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== User Profile Endpoints ====================

@app.route('/user/profile', methods=['GET'])
@jwt_required()
def get_profile():
    """Get user profile"""
    try:
        user_id = get_jwt_identity()
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''SELECT id, name, email, bio, role, expertise, summary_preferences, language
                     FROM users WHERE id = ?''', (user_id,))
        user = c.fetchone()
        conn.close()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'id': user[0],
            'name': user[1],
            'email': user[2],
            'bio': user[3],
            'role': user[4],
            'expertise': json.loads(user[5]) if user[5] else [],
            'summaryPreferences': json.loads(user[6]) if user[6] else {},
            'language': user[7] or 'en'
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/user/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """Update user profile"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        
        # Build update query
        updates = []
        values = []
        
        if 'name' in data:
            updates.append('name = ?')
            values.append(data['name'])
        if 'bio' in data:
            updates.append('bio = ?')
            values.append(data['bio'])
        if 'role' in data:
            updates.append('role = ?')
            values.append(data['role'])
        if 'expertise' in data:
            updates.append('expertise = ?')
            values.append(json.dumps(data['expertise']))
        if 'summaryPreferences' in data:
            updates.append('summary_preferences = ?')
            values.append(json.dumps(data['summaryPreferences']))
        if 'language' in data:
            updates.append('language = ?')
            values.append(data['language'])
        
        if not updates:
            conn.close()
            return jsonify({'error': 'No fields to update'}), 400
        
        values.append(user_id)
        query = f"UPDATE users SET {', '.join(updates)} WHERE id = ?"
        c.execute(query, values)
        conn.commit()
        conn.close()
        
        return jsonify({'message': 'Profile updated successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# ==================== Video Summarization Endpoints ====================

def process_video_job(job_id: str, video_path: str, num_frames: int, summary_style: str,
                     summary_format: str, summary_length_words: Optional[int], user_profile: Optional[Dict]):
    """Process video in background thread"""
    try:
        jobs[job_id]['status'] = 'processing'
        jobs[job_id]['progress'] = 10
        jobs[job_id]['step'] = 'Extracting frames'
        
        # Process video
        results = video_processor.process_video(
            video_path=video_path,
            num_frames=num_frames,
            use_llm=True,
            summary_style=summary_style,
            summary_format=summary_format,
            summary_length_words=summary_length_words,
            user_profile=user_profile
        )
        
        # Update job status
        jobs[job_id]['status'] = 'done'
        jobs[job_id]['progress'] = 100
        jobs[job_id]['step'] = 'Complete'
        jobs[job_id]['result'] = results
        
        # Save to database
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''UPDATE jobs SET status = ?, progress = ?, step = ?, result = ?, updated_at = CURRENT_TIMESTAMP
                     WHERE id = ?''',
                 ('done', 100, 'Complete', json.dumps(results), job_id))
        conn.commit()
        conn.close()
        
        # Cleanup video file
        if os.path.exists(video_path):
            os.remove(video_path)
            
    except Exception as e:
        jobs[job_id]['status'] = 'failed'
        jobs[job_id]['step'] = f'Error: {str(e)}'
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''UPDATE jobs SET status = ?, step = ?, updated_at = CURRENT_TIMESTAMP
                     WHERE id = ?''',
                 ('failed', f'Error: {str(e)}', job_id))
        conn.commit()
        conn.close()

@app.route('/videos/upload', methods=['POST'])
@jwt_required()
def upload_video():
    """Upload and process video"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        user_id = get_jwt_identity()
        
        # Get parameters
        num_frames = int(request.form.get('num_frames', 10))
        summary_style = request.form.get('summary_style', 'default')
        summary_format = request.form.get('summary_format', 'paragraph')
        summary_length_words = request.form.get('summary_length_words', type=int)
        metadata_json = request.form.get('metadata', '{}')
        
        try:
            metadata = json.loads(metadata_json)
        except:
            metadata = {}
        
        # Get user profile for personalization
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('SELECT expertise, summary_preferences FROM users WHERE id = ?', (user_id,))
        user_data = c.fetchone()
        conn.close()
        
        user_profile = None
        if user_data:
            user_profile = {
                'id': user_id,
                'expertise': json.loads(user_data[0]) if user_data[0] else [],
                'summaryPreferences': json.loads(user_data[1]) if user_data[1] else {}
            }
        
        # Save uploaded file
        filename = secure_filename(file.filename)
        video_path = os.path.join(app.config['UPLOAD_FOLDER'], f"{uuid.uuid4()}_{filename}")
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        file.save(video_path)
        
        # Create job
        job_id = str(uuid.uuid4())
        jobs[job_id] = {
            'id': job_id,
            'user_id': user_id,
            'status': 'queued',
            'progress': 0,
            'step': 'Queued',
            'video_path': video_path,
            'num_frames': num_frames,
            'summary_style': summary_style,
            'summary_format': summary_format,
            'summary_length_words': summary_length_words,
            'metadata': metadata
        }
        
        # Save job to database
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        # Add summary_format column if it doesn't exist
        try:
            c.execute('ALTER TABLE jobs ADD COLUMN summary_format TEXT')
        except:
            pass  # Column already exists
        c.execute('''INSERT INTO jobs (id, user_id, status, progress, step, video_path, num_frames, 
                     summary_style, summary_format, summary_length_words, metadata)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                 (job_id, user_id, 'queued', 0, 'Queued', video_path, num_frames, 
                  summary_style, summary_format, summary_length_words, json.dumps(metadata)))
        conn.commit()
        conn.close()
        
        # Start processing in background
        thread = threading.Thread(
            target=process_video_job,
            args=(job_id, video_path, num_frames, summary_style, summary_format, summary_length_words, user_profile)
        )
        thread.daemon = True
        thread.start()
        
        return jsonify({'jobId': job_id}), 202
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def download_video_from_url(url: str, output_dir: str) -> str:
    """Download video from URL (YouTube, etc.) using yt-dlp"""
    try:
        # Configure yt-dlp options
        ydl_opts = {
            'format': 'best[ext=mp4]/best',  # Prefer MP4, fallback to best available
            'outtmpl': os.path.join(output_dir, '%(title)s.%(ext)s'),
            'quiet': False,
            'no_warnings': False,
        }
        
        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            # Extract info first to get filename
            info = ydl.extract_info(url, download=False)
            video_title = ydl.prepare_filename(info)
            
            # Download the video
            ydl.download([url])
            
            # Return the downloaded file path
            return video_title
    except Exception as e:
        raise Exception(f"Failed to download video from URL: {str(e)}")

@app.route('/videos/from-url', methods=['POST'])
@jwt_required()
def summarize_from_url():
    """Summarize video from URL"""
    try:
        data = request.get_json()
        url = data.get('url')
        
        if not url:
            return jsonify({'error': 'URL is required'}), 400
        
        user_id = get_jwt_identity()
        num_frames = data.get('num_frames', 10)
        summary_style = data.get('summary_style', 'default')
        summary_format = data.get('summary_format', 'paragraph')
        summary_length_words = data.get('summary_length_words')
        metadata = data.get('metadata', {})
        
        # Get user profile
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('SELECT expertise, summary_preferences FROM users WHERE id = ?', (user_id,))
        user_data = c.fetchone()
        conn.close()
        
        user_profile = None
        if user_data:
            user_profile = {
                'id': user_id,
                'expertise': json.loads(user_data[0]) if user_data[0] else [],
                'summaryPreferences': json.loads(user_data[1]) if user_data[1] else {}
            }
        
        # Download video from URL
        os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
        try:
            video_path = download_video_from_url(url, app.config['UPLOAD_FOLDER'])
            # Rename to include UUID for uniqueness
            file_ext = os.path.splitext(video_path)[1]
            new_filename = f"{uuid.uuid4()}{file_ext}"
            new_video_path = os.path.join(app.config['UPLOAD_FOLDER'], new_filename)
            os.rename(video_path, new_video_path)
            video_path = new_video_path
        except Exception as e:
            return jsonify({'error': f'Failed to download video: {str(e)}'}), 400
        
        # Create job
        job_id = str(uuid.uuid4())
        jobs[job_id] = {
            'id': job_id,
            'user_id': user_id,
            'status': 'queued',
            'progress': 0,
            'step': 'Queued',
            'video_path': video_path,
            'num_frames': num_frames,
            'summary_style': summary_style,
            'summary_format': summary_format,
            'summary_length_words': summary_length_words,
            'metadata': metadata
        }
        
        # Save job to database
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        # Add summary_format column if it doesn't exist
        try:
            c.execute('ALTER TABLE jobs ADD COLUMN summary_format TEXT')
        except:
            pass  # Column already exists
        c.execute('''INSERT INTO jobs (id, user_id, status, progress, step, video_path, num_frames, 
                     summary_style, summary_format, summary_length_words, metadata)
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)''',
                 (job_id, user_id, 'queued', 0, 'Queued', video_path, num_frames, 
                  summary_style, summary_format, summary_length_words, json.dumps(metadata)))
        conn.commit()
        conn.close()
        
        # Start processing in background
        thread = threading.Thread(
            target=process_video_job,
            args=(job_id, video_path, num_frames, summary_style, summary_format, summary_length_words, user_profile)
        )
        thread.daemon = True
        thread.start()
        
        return jsonify({'jobId': job_id}), 202
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/videos/status/<job_id>', methods=['GET'])
@jwt_required()
def get_job_status(job_id):
    """Get job processing status"""
    try:
        user_id = get_jwt_identity()
        
        # Check database first
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''SELECT status, progress, step, created_at, updated_at
                     FROM jobs WHERE id = ? AND user_id = ?''', (job_id, user_id))
        job = c.fetchone()
        conn.close()
        
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        # Update from memory if available
        if job_id in jobs:
            job_data = jobs[job_id]
            status = job_data.get('status', job[0])
            progress = job_data.get('progress', job[1])
            step = job_data.get('step', job[2])
        else:
            status = job[0]
            progress = job[1]
            step = job[2]
        
        # Calculate ETA (rough estimate)
        if status == 'processing':
            remaining = 100 - progress
            eta_seconds = remaining * 2  # Rough estimate: 2 seconds per percent
        else:
            eta_seconds = 0
        
        return jsonify({
            'jobId': job_id,
            'status': status,
            'progress': progress,
            'step': step,
            'etaSeconds': eta_seconds
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/videos/result/<job_id>', methods=['GET'])
@jwt_required()
def get_job_result(job_id):
    """Get job result when done"""
    try:
        user_id = get_jwt_identity()
        
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('SELECT status, result FROM jobs WHERE id = ? AND user_id = ?', (job_id, user_id))
        job = c.fetchone()
        conn.close()
        
        if not job:
            return jsonify({'error': 'Job not found'}), 404
        
        if job[0] != 'done':
            return jsonify({'error': 'Job not completed yet'}), 400
        
        result = json.loads(job[1]) if job[1] else {}
        
        # Format visual captions properly
        visual_captions = []
        if result.get('visual_analysis', {}).get('frame_captions'):
            for idx, caption in enumerate(result['visual_analysis']['frame_captions']):
                visual_captions.append({
                    'frame': idx + 1,
                    'caption': caption.split(': ', 1)[-1] if ': ' in caption else caption
                })
        
        return jsonify({
            'jobId': job_id,
            'summary': result.get('final_summary', ''),
            'audio_transcription': result.get('audio_transcription', ''),
            'visualCaptions': visual_captions,
            'transcript': result.get('audio_transcription', ''),
            'highlights': [],  # TODO: Implement highlights extraction
            'videoUrl': result.get('video_url'),  # Add video URL for player
            'summaryFormat': result.get('summary_format', 'paragraph')  # Return format used
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/videos/list', methods=['GET'])
@jwt_required()
def list_jobs():
    """List user's recent jobs"""
    try:
        user_id = get_jwt_identity()
        limit = request.args.get('limit', 20, type=int)
        
        conn = sqlite3.connect(DB_PATH)
        c = conn.cursor()
        c.execute('''SELECT id, status, progress, step, created_at, summary_style
                     FROM jobs WHERE user_id = ? ORDER BY created_at DESC LIMIT ?''',
                 (user_id, limit))
        jobs_list = c.fetchall()
        conn.close()
        
        return jsonify({
            'jobs': [
                {
                    'id': job[0],
                    'status': job[1],
                    'progress': job[2],
                    'step': job[3],
                    'createdAt': job[4],
                    'summaryStyle': job[5]
                }
                for job in jobs_list
            ]
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/', methods=['GET'])
def root():
    """Root endpoint - API information"""
    return jsonify({
        'message': 'VideoWise Backend API',
        'status': 'running',
        'version': '1.0.0',
        'endpoints': {
            'health': '/health',
            'auth': {
                'signup': '/auth/signup',
                'login': '/auth/login',
                'me': '/auth/me'
            },
            'user': {
                'profile': '/user/profile'
            },
            'videos': {
                'upload': '/videos/upload',
                'from-url': '/videos/from-url',
                'status': '/videos/status/<job_id>',
                'result': '/videos/result/<job_id>',
                'list': '/videos/list'
            }
        },
        'models_loaded': video_processor is not None,
        'timestamp': datetime.now().isoformat()
    }), 200

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'models_loaded': video_processor is not None,
        'timestamp': datetime.now().isoformat()
    }), 200

if __name__ == '__main__':
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
    app.run(host='0.0.0.0', port=5000, debug=True)

