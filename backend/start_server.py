#!/usr/bin/env python3
"""
Startup script for VideoWise backend
Handles missing dependencies gracefully
"""
import os
import sys

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Try to load dotenv
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    print("⚠️ python-dotenv not installed, using environment variables")

# Import and run app
try:
    from app import app
    print("\n🚀 Starting VideoWise Backend Server...")
    print("📍 Backend will be available at: http://localhost:5000")
    print("📝 Note: Video processing requires ML dependencies (see requirements.txt)")
    print("   For now, API endpoints will work but video processing may fail.\n")
    app.run(host='0.0.0.0', port=5000, debug=True)
except Exception as e:
    print(f"❌ Error starting server: {e}")
    print("\n💡 To install all dependencies:")
    print("   cd backend")
    print("   source venv/bin/activate")
    print("   pip install -r requirements.txt")
    sys.exit(1)

