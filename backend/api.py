from fastapi import FastAPI, HTTPException, Security
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import APIKeyHeader
from pydantic import BaseModel
from typing import Optional
import os
import asyncio
from dotenv import load_dotenv

from scrapers.analyze_company import analyze_company, research_founders
from scrapers.models import Company, FounderList, Founder, SocialMedia

load_dotenv()

app = FastAPI(
    title="VC Use API",
    description="API for venture capital company research and analysis",
    version="1.0.0"
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

class FounderResearchRequest(BaseModel):
    company_name: str
    founders: FounderList

class CompanyAnalysisResponse(BaseModel):
    success: bool
    data: Optional[Company] = None
    error: Optional[str] = None

class FounderResearchResponse(BaseModel):
    success: bool
    data: Optional[FounderList] = None
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
    return {"status": "healthy"}

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
    """
    try:
        result = await analyze_company(request.company_name)
        return CompanyAnalysisResponse(
            success=True,
            data=result
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

# Full company analysis (company + founders)
@app.post("/api/full-analysis", response_model=CompanyAnalysisResponse)
async def api_full_analysis(
    request: CompanyAnalysisRequest,
    api_key: str = Security(verify_api_key)
):
    """
    Complete company analysis including company info and detailed founder research
    """
    try:
        # Step 1: Analyze company
        company = await analyze_company(request.company_name)

        # Step 2: Research founders
        founders = await research_founders(request.company_name, company.founders_info)

        # Step 3: Update company with researched founders
        company.founders_info = founders

        return CompanyAnalysisResponse(
            success=True,
            data=company
        )
    except Exception as e:
        return CompanyAnalysisResponse(
            success=False,
            error=str(e)
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
