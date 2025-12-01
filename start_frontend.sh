#!/bin/bash
# Quick script to start the frontend

echo "🚀 Starting VideoWise Frontend..."
echo ""

cd frontend

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "⚠️  .env file not found. Creating from example..."
    cat > .env << 'EOF'
# Backend API URL
# For Colab: Use the ngrok URL from Colab notebook
# Example: VITE_API_BASE_URL=https://abc123.ngrok.io
VITE_API_BASE_URL=http://localhost:5000

VITE_APP_NAME=VideoWise
VITE_ENVIRONMENT=development
EOF
    echo "✅ .env file created. Please update VITE_API_BASE_URL with your backend URL!"
    echo ""
fi

echo "🌐 Starting development server..."
echo "📍 Frontend will be available at: http://localhost:3000"
echo ""
echo "⚠️  Make sure your backend is running (Colab/Railway) and .env is configured!"
echo ""

npm run dev

