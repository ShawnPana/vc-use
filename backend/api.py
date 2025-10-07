from fastapi import FastAPI, HTTPException, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from pydantic import BaseModel
from typing import Optional
from contextlib import asynccontextmanager
import os
import asyncio
import tracemalloc
import psutil
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

class FounderResearchRequest(BaseModel):
    company_name: str
    founders: FounderList
    company_bio: Optional[str] = None
    company_website: Optional[str] = None
    callback_url: Optional[str] = None
    user_id: Optional[str] = None

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

# Full company analysis (company + hype in parallel)
@app.post("/api/full-analysis", response_model=FullAnalysisResponse)
async def api_full_analysis(
    request: CompanyAnalysisRequest,
    api_key: str = Security(verify_api_key)
):
    """
    Complete company analysis including company info and hype research.
    Runs analyze_company and research_hype in parallel.
    Returns company data and hype info. Frontend should call /api/deep-research separately for founders + competitors.

    Use debug=true to return mock data instantly for testing.
    """
    try:
        # Debug mode: return mock data immediately
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

        # Run analyze_company and research_hype in parallel
        results = await asyncio.gather(
            analyze_company(request.company_name),
            research_hype(request.company_name)
        )

        (company, browser1), (hype, browser2) = results

        # Stop both browsers after both complete
        await browser1.stop()
        await browser2.stop()

        return FullAnalysisResponse(
            success=True,
            company=company,
            hype=hype
        )
    except Exception as e:
        return FullAnalysisResponse(
            success=False,
            error=str(e)
        )

# Deep research endpoint (founders + competitors in parallel)
@app.post("/api/deep-research", response_model=DeepResearchResponse)
async def api_deep_research(
    request: FounderResearchRequest,
    api_key: str = Security(verify_api_key)
):
    """
    Deep research on company founders and competitors.
    Runs research_founders and research_competitors in parallel.

    If callback_url is provided, runs asynchronously and POSTs results to callback when complete.
    Otherwise, waits and returns results synchronously (may timeout for long operations).
    """
    # If callback URL is provided, run asynchronously
    if request.callback_url:
        # Start the research in the background
        asyncio.create_task(run_deep_research_async(
            request.company_name,
            request.founders,
            request.company_bio,
            request.company_website,
            request.callback_url,
            api_key,
            request.user_id
        ))

        # Return immediately
        return DeepResearchResponse(
            success=True,
            founders=FounderList(founders=[]),
            competitors=CompetitorList(competitors=[])
        )

    # Synchronous mode (legacy, may timeout)
    try:
        # Run research_founders and research_competitors in parallel
        results = await asyncio.gather(
            research_founders(request.company_name, request.founders),
            research_competitors(request.company_name, request.company_bio, request.company_website)
        )

        (founders, browser1), (competitors, browser2) = results

        # Stop both browsers after both complete
        await browser1.stop()
        await browser2.stop()

        return DeepResearchResponse(
            success=True,
            founders=founders,
            competitors=competitors
        )
    except Exception as e:
        return DeepResearchResponse(
            success=False,
            error=str(e)
        )

# Background task for async deep research with callback
async def run_deep_research_async(
    company_name: str,
    founders: FounderList,
    company_bio: Optional[str],
    company_website: Optional[str],
    callback_url: str,
    api_key: str,
    user_id: Optional[str] = None
):
    """
    Run deep research asynchronously and POST results to callback URL when complete.
    """
    import httpx

    print(f"[run_deep_research_async] Starting async deep research for {company_name}")
    print(f"[run_deep_research_async] Will callback to: {callback_url}")
    print(f"[run_deep_research_async] User ID: {user_id}")

    try:
        # Run research_founders and research_competitors in parallel
        results = await asyncio.gather(
            research_founders(company_name, founders),
            research_competitors(company_name, company_bio, company_website)
        )

        (enriched_founders, browser1), (competitors, browser2) = results

        # Stop both browsers after both complete
        await browser1.stop()
        await browser2.stop()

        print(f"[run_deep_research_async] Research completed for {company_name}")
        print(f"[run_deep_research_async] Found {len(enriched_founders.founders)} founders, {len(competitors.competitors)} competitors")

        # Prepare callback payload
        payload = {
            "startupName": company_name,
            "userId": user_id,
            "founders": {
                "founders": [
                    {
                        "name": f.name,
                        "social_media": {
                            "linkedin": f.social_media.linkedin if f.social_media else None,
                            "X": f.social_media.X if f.social_media else None,
                        },
                        "personal_website": f.personal_website,
                        "bio": f.bio,
                    }
                    for f in enriched_founders.founders
                ]
            },
            "competitors": {
                "competitors": [
                    {
                        "name": c.name,
                        "website": c.website,
                        "description": c.description,
                    }
                    for c in competitors.competitors
                ]
            }
        }

        # POST results to callback URL
        print(f"[run_deep_research_async] Posting results to callback URL")
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                callback_url,
                json=payload,
                headers={"X-API-Key": api_key}
            )

            if response.status_code == 200:
                print(f"[run_deep_research_async] Successfully posted results to callback")
            else:
                print(f"[run_deep_research_async] Callback failed with status {response.status_code}: {response.text}")

    except Exception as e:
        print(f"[run_deep_research_async] Error during async research: {e}")
        import traceback
        traceback.print_exc()

        # Try to notify callback of error
        try:
            import httpx
            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.post(
                    callback_url,
                    json={"error": str(e), "startupName": company_name},
                    headers={"X-API-Key": api_key}
                )
        except Exception as callback_error:
            print(f"[run_deep_research_async] Failed to send error to callback: {callback_error}")

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
