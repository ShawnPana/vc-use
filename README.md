# VC Use  <img src="frontend/public/logo.svg" alt="VC Use Logo" width="32" height="32" style="vertical-align: bottom; margin-left: 8px;">

**Comprehensive, agentic startup analysis in minutes.** Deployed at https://vc-use.dev. 

## Overview

VC-Use automates venture capital due diligence using a multi-agent AI system. Research agents deliver structured insights in minutes instead of weeks.

### The Problem

Venture capital scouts and analysts spend 20-40 hours per week on tedious, repetitive research across scattered sources. Traditional tools like Pitchbook and Crunchbase miss 60-70% of early-stage startups, and VCs have no systematic framework for conducting thorough, unbiased analysis across financial, legal, market, competitive, team, and technical dimensions.

### The Solution

- **Multi-agent architecture**: Specialized agents analyze any company
- **Web-powered research**: Works for companies missing from traditional databases
- **Unlimited custom agents**: Power users can create dozens of specialized agents for vertical-specific workflows
- **User authentication**: Personal portfolios and custom agent flows
- **Real-time updates**: Powered by Convex, a real-time noSQL database

### Key Features

- AI-powered startup analysis with multiple specialized agents
- Executive summary generation from agent insights
- Founder story and company overview extraction
- Market opportunity visualization
- Funding progress tracking
- Portfolio management for tracking multiple startups
- Expandable dashboard tiles for detailed views

### Tech Stack

- **Frontend:** React, TypeScript, Vite, Convex (real-time database + auth)
- **Backend:** Python, FastAPI, Browser Use (web scraping)
- **AI Infrastructure:** Cerebras Inference API running Llama 3.3 70B
- **Database:** Convex
---

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