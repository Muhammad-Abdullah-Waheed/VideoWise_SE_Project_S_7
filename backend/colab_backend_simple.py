"""
Simplified Colab Backend Setup
Use this if you want to avoid ngrok authentication
"""

# Install dependencies
!pip install -q flask flask-cors flask-jwt-extended werkzeug python-dotenv
!pip install -q localtunnel  # Alternative to ngrok, no signup needed

# Set environment variables
import os
os.environ['JWT_SECRET_KEY'] = 'dev-secret-key-12345'
os.environ['GROQ_API_KEY'] = ''  # Add your key
os.environ['GEMINI_API_KEY'] = ''  # Add your key
os.environ['UPLOAD_FOLDER'] = '/content/uploads'
os.environ['DB_PATH'] = '/content/videowise.db'

# Create directories
!mkdir -p /content/uploads

# Start localtunnel (no authentication needed)
import subprocess
import threading
import time

def start_tunnel():
    process = subprocess.Popen(
        ['npx', 'local-tunnel', '--port', '5000'],
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True
    )
    
    # Read output to get URL
    for line in process.stdout:
        if 'your url is:' in line.lower() or 'https://' in line:
            print(f"\n🌐 TUNNEL URL: {line.strip()}")
            print(f"\n📋 Copy this URL to your frontend .env:")
            print(f"   VITE_API_BASE_URL=<url-from-above>")
        print(line, end='')

tunnel_thread = threading.Thread(target=start_tunnel, daemon=True)
tunnel_thread.start()

# Wait for tunnel
time.sleep(8)

# Import and start Flask app
import sys
sys.path.insert(0, '/content')

from app import app

print("\n🚀 Starting backend server...")
print("📍 Local: http://localhost:5000")
print("\n⚠️  Check the tunnel URL above and use it in frontend .env")
print("⚠️  Keep this cell running!\n")

app.run(host='0.0.0.0', port=5000, debug=False)

