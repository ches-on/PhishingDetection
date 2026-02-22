from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Header, Query
from ..models.schemas import AnalyzeTextRequest, AnalyzeResponse, Finding
from ..services.email_parser import parse_eml_bytes, parse_raw_text
from ..services.scoring import score_email
from ..core.config import settings
import json
from fastapi import Depends
from sqlalchemy.orm import Session
from ..db.database import get_db
from ..db.models import ScanResult
from sqlalchemy import desc
import json
from collections import Counter
from sqlalchemy import desc
from ..services.url_utils import domain_of_url
from fastapi import Header
from ..core.config import settings


router = APIRouter()

def require_admin_api_key(x_api_key: str | None = Header(default=None, alias="X-API-Key")):
    configured_key = (settings.admin_api_key or "").strip()

    # If no key is configured, allow access (dev mode)
    if not configured_key:
        return True

    if not x_api_key or x_api_key.strip() != configured_key:
        raise HTTPException(status_code=401, detail="Unauthorized")

    return True

@router.get("/health")
def health():
    return {"status": "ok"}

@router.post("/analyze/text", response_model=AnalyzeResponse)
def analyze_text(payload: AnalyzeTextRequest, db: Session = Depends(get_db)):
    parsed = parse_raw_text(payload.raw_email_text)
    result = score_email(parsed)
    _save_scan(db, parsed, result)
    return _to_response(result)

@router.post("/analyze/eml", response_model=AnalyzeResponse)
async def analyze_eml(file: UploadFile = File(...), db: Session = Depends(get_db)):
    data = await file.read()
    parsed = parse_eml_bytes(data)
    result = score_email(parsed)
    _save_scan(db, parsed, result)
    return _to_response(result)

def _to_response(result: dict) -> AnalyzeResponse:
    findings = [Finding(**f) for f in result["findings"]]
    return AnalyzeResponse(
        risk_score=result["risk_score"],
        verdict=result["verdict"],
        findings=findings,
        extracted=result["extracted"],
    )
def _save_scan(db: Session, parsed: dict, result: dict) -> None:
    record = ScanResult(
        verdict=result["verdict"],
        risk_score=result["risk_score"],
        subject=parsed.get("subject", ""),
        from_header=parsed.get("from", ""),
        reply_to=parsed.get("reply_to", ""),
        to_header=parsed.get("to", ""),
        urls_json=json.dumps(result["extracted"].get("urls", [])),
        findings_json=json.dumps(result.get("findings", [])),
        extracted_json=json.dumps(result.get("extracted", {})),
    )
    db.add(record)
    db.commit()
     
@router.get("/scans/recent")
def recent_scans(
    limit: int = 20,
    db: Session = Depends(get_db),
    _auth: bool = Depends(require_admin_api_key),
):
    limit = max(1, min(100, limit))

    rows = (
        db.query(ScanResult)
        .order_by(desc(ScanResult.created_at))
        .limit(limit)
        .all()
    )

    return [
        {
            "id": r.id,
            "created_at": r.created_at,
            "verdict": r.verdict,
            "risk_score": r.risk_score,
            "subject": r.subject,
            "from": r.from_header,
        }
        for r in rows
    ]
    
@router.get("/scans/trends")
def scan_trends(
    limit: int = Query(200, ge=1, le=1000),
    db: Session = Depends(get_db),
    # _auth: bool = Depends(require_admin_api_key),
):
    limit = max(20, min(1000, limit))

    rows = (
        db.query(ScanResult)
        .order_by(desc(ScanResult.created_at))
        .limit(limit)
        .all()
    )

    verdict_counts = Counter()
    score_values = []
    domain_counts = Counter()
    finding_code_counts = Counter()

    for r in rows:
        verdict_counts[r.verdict] += 1
        score_values.append(r.risk_score)

        # Extract domains
        try:
            extracted = json.loads(r.extracted_json or "{}")
        except Exception:
            extracted = {}

        urls = extracted.get("urls", [])
        if not isinstance(urls, list):
            urls = []

        for u in urls:
            d = domain_of_url(str(u))
            if d:
                domain_counts[d] += 1

        # Extract finding codes
        try:
            findings = json.loads(r.findings_json or "[]")
        except Exception:
            findings = []

        if isinstance(findings, list):
            for f in findings:
                code = (f or {}).get("code")
                if code:
                    finding_code_counts[str(code)] += 1

    avg_score = round(sum(score_values) / len(score_values), 2) if score_values else 0

    return {
        "sample_size": len(rows),
        "average_score": avg_score,
        "verdict_counts": {
            "low": verdict_counts.get("low", 0),
            "medium": verdict_counts.get("medium", 0),
            "high": verdict_counts.get("high", 0),
        },
        "top_link_domains": domain_counts.most_common(10),
        "top_finding_codes": finding_code_counts.most_common(10),
    }
    
@router.get("/scans/{scan_id}")
def get_scan_by_id(
    scan_id: int,
    db: Session = Depends(get_db),
    _auth: bool = Depends(require_admin_api_key),
):
    row = db.query(ScanResult).filter(ScanResult.id == scan_id).first()
    if not row:
        raise HTTPException(status_code=404, detail="Scan not found.")

    try:
        findings = json.loads(row.findings_json or "[]")
    except Exception:
        findings = []

    try:
        extracted = json.loads(row.extracted_json or "{}")
    except Exception:
        extracted = {
            "subject": row.subject or "",
            "from": row.from_header or "",
            "reply_to": row.reply_to or "",
            "to": row.to_header or "",
            "urls": json.loads(row.urls_json or "[]") if row.urls_json else [],
            "auth_results": "",
        }

    # Backward compatibility for older rows without extracted_json data
    if not extracted:
        try:
            urls = json.loads(row.urls_json or "[]")
        except Exception:
            urls = []
        extracted = {
            "subject": row.subject or "",
            "from": row.from_header or "",
            "reply_to": row.reply_to or "",
            "to": row.to_header or "",
            "urls": urls,
            "auth_results": "",
        }

    return {
        "id": row.id,
        "created_at": row.created_at,
        "risk_score": row.risk_score,
        "verdict": row.verdict,
        "findings": findings,
        "extracted": extracted,
    }
    
