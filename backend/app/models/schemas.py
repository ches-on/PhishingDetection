from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any

class AnalyzeTextRequest(BaseModel):
    raw_email_text: str = Field(..., min_length=1, max_length=200_000)

class Finding(BaseModel):
    code: str
    title: str
    detail: str
    severity: str  # "low" | "medium" | "high"

class AnalyzeResponse(BaseModel):
    risk_score: int
    verdict: str  # "low" | "medium" | "high"
    findings: List[Finding]
    extracted: Dict[str, Any]