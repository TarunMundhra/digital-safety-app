from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services.partner_ingestion_service import ingest_bank_report, get_partners_summary
from app.services.phishing_detection_service import scan_app_listings, scan_certificate_transparency
from pydantic import BaseModel, Extra, Field
from datetime import datetime
from typing import Optional

router = APIRouter()

class BankReportInput(BaseModel):
    masked_reporter_id: str
    transaction_ref: str
    scam_type: str
    reported_at: datetime = Field(default_factory=datetime.utcnow)
    linked_phone_number: Optional[str] = None
    device_fingerprint: Optional[str] = None

    class Config:
        extra = Extra.forbid

@router.post("/bank-reports")
def post_bank_report(payload: BankReportInput, db: Session = Depends(get_db)):
    res = ingest_bank_report(db, payload.dict())
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error"))
    return res

@router.get("/bank-reports/intelligence-summary")
def get_summary(days: int = Query(7, ge=1), db: Session = Depends(get_db)):
    return get_partners_summary(db, days)

@router.post("/scan-phishing")
def post_phishing_scan(brands: list[str], db: Session = Depends(get_db)):
    apps = scan_app_listings(db, brands)
    certs = scan_certificate_transparency(db, brands)
    return {
        "lookalike_apps_flagged": len(apps), 
        "phishing_certs_flagged": len(certs),
        "apps": apps,
        "certs": certs
    }
