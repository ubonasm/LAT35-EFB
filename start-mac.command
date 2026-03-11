#!/bin/bash

echo "========================================"
echo "  Lesson Record Analysis Tool"
echo "========================================"
echo ""

# Move to script directory
cd "$(dirname "$0")"
echo "Working directory: $(pwd)"
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "[Error] Node.js is not installed."
    echo "Please install from https://nodejs.org/"
    echo "Or use Homebrew: brew install node"
    echo ""
    read -p "Press Enter to exit..."
    exit 1
fi

echo "Node.js version: $(node -v)"
echo ""

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    echo "This may take a few minutes..."
    echo ""
    npm install
    if [ $? -ne 0 ]; then
        echo ""
        echo "[Error] Failed to install dependencies."
        read -p "Press Enter to exit..."
        exit 1
    fi
    echo ""
fi

echo "Starting development server..."
echo "Open http://localhost:3000 in your browser"
echo "Press Ctrl+C to stop"
echo "----------------------------------------"
echo ""

npm run dev
