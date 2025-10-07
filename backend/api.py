from fastapi import FastAPI, HTTPException, Security, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from pydantic import BaseModel
from typing import Optional
from contextlib import asynccontextmanager
import os
import asyncio
import tracemalloc
import psutil
import httpx
from dotenv import load_dotenv

from scrapers.analyze_company import analyze_company, research_founders, research_hype, research_competitors
from scrapers.models import Company, FounderList, Founder, SocialMedia, Hype, CompetitorList

load_dotenv()

# Start memory tracking
tracemalloc.start()

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    yield
    # Shutdown
    print("Shutting down and cleaning up browser sessions...")
    # Add any cleanup logic here if needed

app = FastAPI(
    title="VC Use API",
    description="API for venture capital company research and analysis",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
# Get allowed origins from environment variable, default to all for development
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "*").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS if ALLOWED_ORIGINS != ["*"] else ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Key Authentication
API_KEY = os.getenv("API_KEY")
api_key_header = APIKeyHeader(name="X-API-Key", auto_error=False)

async def verify_api_key(api_key: str = Security(api_key_header)):
    if api_key != API_KEY:
        raise HTTPException(status_code=403, detail="Invalid API key")
    return api_key

# Request/Response Models
class CompanyAnalysisRequest(BaseModel):
    company_name: str
    debug: Optional[bool] = False
    callback_url: Optional[str] = None

class FounderResearchRequest(BaseModel):
    company_name: str
    founders: FounderList
    company_bio: Optional[str] = None
    company_website: Optional[str] = None
    callback_url: Optional[str] = None

class CompanyAnalysisResponse(BaseModel):
    success: bool
    data: Optional[Company] = None
    error: Optional[str] = None

class FullAnalysisResponse(BaseModel):
    success: bool
    company: Optional[Company] = None
    hype: Optional[Hype] = None
    error: Optional[str] = None

class FounderResearchResponse(BaseModel):
    success: bool
    data: Optional[FounderList] = None
    error: Optional[str] = None

class HypeResearchResponse(BaseModel):
    success: bool
    data: Optional[Hype] = None
    error: Optional[str] = None

class DeepResearchResponse(BaseModel):
    success: bool
    founders: Optional[FounderList] = None
    competitors: Optional[CompetitorList] = None
    error: Optional[str] = None

class CompetitorResearchRequest(BaseModel):
    company_name: str

class CompetitorResearchResponse(BaseModel):
    success: bool
    data: Optional[CompetitorList] = None
    error: Optional[str] = None

# Health check endpoint
@app.get("/")
async def root():
    return {
        "message": "VC Use API",
        "version": "1.0.0",
        "status": "operational"
    }

@app.get("/health")
async def health():
    # Get process memory info
    process = psutil.Process()
    memory_info = process.memory_info()

    # Get system memory info
    system_memory = psutil.virtual_memory()

    # Get top memory consumers from tracemalloc
    snapshot = tracemalloc.take_snapshot()
    top_stats = snapshot.statistics('lineno')[:10]

    top_consumers = [
        {
            "source": str(stat.traceback),
            "size_mb": round(stat.size / 1024 / 1024, 2),
            "count": stat.count
        }
        for stat in top_stats
    ]

    # Convert bytes to MB
    rss_mb = round(memory_info.rss / 1024 / 1024, 2)
    vms_mb = round(memory_info.vms / 1024 / 1024, 2)
    system_available_mb = round(system_memory.available / 1024 / 1024, 2)

    # Determine status based on memory usage
    memory_percent = process.memory_percent()
    status = "healthy"
    if memory_percent > 80:
        status = "critical"
    elif memory_percent > 60:
        status = "degraded"

    response = {
        "status": status,
        "memory": {
            "rss_mb": rss_mb,
            "vms_mb": vms_mb,
            "percent": round(memory_percent, 2),
            "system_available_mb": system_available_mb
        },
        "top_memory_consumers": top_consumers
    }

    # Log memory stats so they appear in Render logs
    print(f"🏥 Health Check - Status: {status} | Memory: {rss_mb}MB ({memory_percent:.2f}%) | Available: {system_available_mb}MB")

    return response

@app.post("/api/cleanup")
async def cleanup_sessions(api_key: str = Security(verify_api_key)):
    """
    Manually trigger cleanup of browser sessions.
    Useful for killing sessions when Browser Use cloud limit is hit.
    """
    print("🧹 Manual cleanup triggered")
    # Browser sessions auto-cleanup when endpoints finish
    # This is mainly for forcing garbage collection
    import gc
    gc.collect()
    return {"status": "cleanup_complete", "message": "Forced garbage collection"}

# Company analysis endpoint
@app.post("/api/analyze-company", response_model=CompanyAnalysisResponse)
async def api_analyze_company(
    request: CompanyAnalysisRequest,
    api_key: str = Security(verify_api_key)
):
    """
    Analyze a company to gather:
    - Company website
    - Company bio
    - Founder names
    - Company summary

    Note: Use /api/full-analysis for parallel company + hype research
    """
    try:
        company, browser = await analyze_company(request.company_name)
        await browser.stop()
        return CompanyAnalysisResponse(
            success=True,
            data=company
        )
    except Exception as e:
        return CompanyAnalysisResponse(
            success=False,
            error=str(e)
        )

# Founder research endpoint
@app.post("/api/research-founders", response_model=FounderResearchResponse)
async def api_research_founders(
    request: FounderResearchRequest,
    api_key: str = Security(verify_api_key)
):
    """
    Research founders to gather:
    - LinkedIn profiles
    - X (Twitter) profiles
    - Personal websites
    - Bios
    """
    try:
        result = await research_founders(request.company_name, request.founders)
        return FounderResearchResponse(
            success=True,
            data=result
        )
    except Exception as e:
        return FounderResearchResponse(
            success=False,
            error=str(e)
        )

# Competitor research endpoint
@app.post("/api/research-competitor", response_model=CompetitorResearchResponse)
async def api_research_competitor(
    request: CompetitorResearchRequest,
    api_key: str = Security(verify_api_key)
):
    """
    Research competitors to gather:
    - Competitor names
    - Competitor websites
    - Brief descriptions
    """
    try:
        competitors, browser = await research_competitors(request.company_name)
        await browser.stop()
        return CompetitorResearchResponse(
            success=True,
            data=competitors
        )
    except Exception as e:
        return CompetitorResearchResponse(
            success=False,
            error=str(e)
        )

# Background task for full analysis
async def process_full_analysis_background(request: CompanyAnalysisRequest, api_key: str):
    """Background task that does the actual scraping and sends callback"""
    try:
        print(f"🔄 [Background] Starting full analysis for: {request.company_name}")

        # Run analyze_company and research_hype in parallel
        results = await asyncio.gather(
            analyze_company(request.company_name),
            research_hype(request.company_name)
        )

        (company, browser1), (hype, browser2) = results

        # Stop both browsers after both complete
        await browser1.stop()
        await browser2.stop()

        print(f"✅ [Background] Completed scraping for: {request.company_name}")

        # If callback URL provided, send results there
        if request.callback_url:
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    await client.post(
                        request.callback_url,
                        json={
                            "startupName": request.company_name,
                            "company": company.model_dump(),
                            "hype": hype.model_dump()
                        },
                        headers={
                            "Content-Type": "application/json",
                            "X-API-Key": api_key
                        }
                    )
                print(f"✅ Sent full analysis results to callback: {request.callback_url}")
            except Exception as callback_error:
                print(f"⚠️ Failed to send callback: {callback_error}")
    except Exception as e:
        print(f"❌ [Background] Error in full analysis for {request.company_name}: {e}")

# Full company analysis (company + hype in parallel)
@app.post("/api/full-analysis", response_model=FullAnalysisResponse)
async def api_full_analysis(
    request: CompanyAnalysisRequest,
    background_tasks: BackgroundTasks,
    api_key: str = Security(verify_api_key)
):
    """
    Complete company analysis including company info and hype research.
    Returns immediately and processes in background, calling webhook when done.

    Use debug=true to return mock data instantly for testing.
    """
    # Debug mode: return mock data immediately (synchronous)
    if request.debug:
        return FullAnalysisResponse(
            success=True,
            company=Company(
                company_website=f"https://{request.company_name.lower().replace(' ', '')}.com",
                company_bio=f"Debug mode: {request.company_name} is a test company.",
                company_summary=f"Mock summary for {request.company_name}. This is debug data.",
                founders_info=FounderList(
                    founders=[
                        Founder(
                            name="Debug Founder",
                            social_media=SocialMedia(linkedin="https://linkedin.com/in/debug", X="https://x.com/debug"),
                            personal_website="https://debug.com",
                            bio="Mock founder bio for debugging"
                        )
                    ]
                )
            ),
            hype=Hype(
                hype_summary="Debug hype summary",
                numbers="Debug funding data",
                recent_news="Debug news"
            )
        )

    # Schedule background task
    background_tasks.add_task(process_full_analysis_background, request, api_key)

    print(f"📨 Accepted full-analysis request for: {request.company_name}, processing in background...")

    # Return immediately
    return FullAnalysisResponse(
        success=True,
        company=None,
        hype=None
    )

# Background task for deep research
async def process_deep_research_background(request: FounderResearchRequest, api_key: str):
    """Background task that does the actual deep research and sends callback"""
    try:
        print(f"🔄 [Background] Starting deep research for: {request.company_name}")

        # Run research_founders and research_competitors in parallel
        results = await asyncio.gather(
            research_founders(request.company_name, request.founders),
            research_competitors(request.company_name, request.company_bio, request.company_website)
        )

        (founders, browser1), (competitors, browser2) = results

        # Stop both browsers after both complete
        await browser1.stop()
        await browser2.stop()

        print(f"✅ [Background] Completed deep research for: {request.company_name}")

        # If callback URL provided, send results there
        if request.callback_url:
            try:
                async with httpx.AsyncClient(timeout=30.0) as client:
                    await client.post(
                        request.callback_url,
                        json={
                            "startupName": request.company_name,
                            "founders": founders.model_dump(),
                            "competitors": competitors.model_dump()
                        },
                        headers={
                            "Content-Type": "application/json",
                            "X-API-Key": api_key
                        }
                    )
                print(f"✅ Sent deep research results to callback: {request.callback_url}")
            except Exception as callback_error:
                print(f"⚠️ Failed to send callback: {callback_error}")
    except Exception as e:
        print(f"❌ [Background] Error in deep research for {request.company_name}: {e}")

# Deep research endpoint (founders + competitors in parallel)
@app.post("/api/deep-research", response_model=DeepResearchResponse)
async def api_deep_research(
    request: FounderResearchRequest,
    background_tasks: BackgroundTasks,
    api_key: str = Security(verify_api_key)
):
    """
    Deep research on company founders and competitors.
    Returns immediately and processes in background, calling webhook when done.
    """
    # Schedule background task
    background_tasks.add_task(process_deep_research_background, request, api_key)

    print(f"📨 Accepted deep-research request for: {request.company_name}, processing in background...")

    # Return immediately
    return DeepResearchResponse(
        success=True,
        founders=None,
        competitors=None
    )

if __name__ == "__main__":
    import uvicorn
    import signal

    def signal_handler(sig, frame):
        print("\n🛑 Received shutdown signal, cleaning up...")
        # Browser sessions will be cleaned up by the shutdown event
        exit(0)

    # Register signal handlers
    signal.signal(signal.SIGINT, signal_handler)
    signal.signal(signal.SIGTERM, signal_handler)

    uvicorn.run(app, host="0.0.0.0", port=8000)
