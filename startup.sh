#!/bin/bash

# Azure Web App startup script
# This script runs when the container starts

echo "Starting StudAI Application..."

# Navigate to the backend directory
cd /home/site/wwwroot

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install --production
fi

# Start the application
echo "Starting Node.js application..."
npm start
