#!/bin/bash

# Script to run the application

echo "Starting vc-use application..."

# Function to cleanup background processes on exit
cleanup() {
    echo "Shutting down..."
    kill $(jobs -p) 2>/dev/null
    exit
}

trap cleanup SIGINT SIGTERM

# Start backend (FastAPI)
echo "Starting backend..."
cd backend
python3 api.py &
BACKEND_PID=$!

# Start frontend (Vite)
echo "Starting frontend..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo "Application started!"
echo "Backend running on http://localhost:8000"
echo "Frontend running on http://localhost:5173"
echo "Press Ctrl+C to stop all services"

# Wait for all background processes
wait
