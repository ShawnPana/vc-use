# VC Use  <img src="frontend/public/logo.svg" alt="VC Use Logo" width="32" height="32" style="vertical-align: bottom; margin-left: 8px;">

## Setup Instructions
1. Clone the repository into your local machine.
2. In the `backend` directory, create a .env file based on the `.env.example` file and fill in the required environment variables.

You need to run three services in separate terminals:

**Terminal 1 - Backend:**
```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate # On Windows use `venv\Scripts\activate`
pip install -r requirements.txt
uvicorn api:app --reload --port 8000
```

**Terminal 2 - Ngrok (for backend tunneling):**
```bash
ngrok http 8000
# Copy the HTTPS URL and update Convex environment variable:
# npx convex env set BACKEND_API_URL "https://your-ngrok-url.ngrok-free.app"
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm install
npx convex dev # First time setup - you need to set up your own Convex project, see https://docs.convex.dev/quickstart
npm run dev # Run the development server
```

Once all three services are running, open your browser to `http://localhost:5173` to access the application.

## Environment Variables

### Backend (.env)
- See `.env.example` in the backend directory for required variables

### Frontend (Convex Environment)
```bash
npx convex env set BACKEND_API_URL "your-backend-url"
npx convex env set BACKEND_API_KEY "your-api-key"
npx convex env set CEREBRAS_API_KEY "your-cerebras-key"
```

## Features
- AI-powered startup analysis with multiple specialized agents
- Executive summary generation from agent insights
- Founder story and company overview extraction
- Market opportunity visualization
- Funding progress tracking
- Portfolio management for tracking multiple startups
- Expandable dashboard tiles for detailed views

## Tech Stack
- **Frontend:** React, TypeScript, Vite, Convex
- **Backend:** Python, FastAPI, Browser Use
- **AI:** Cerebras API for agent analysis
- **Database:** Convex

> **Notes**
>