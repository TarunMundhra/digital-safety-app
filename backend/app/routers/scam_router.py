from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services import scam_service
from app.db.models import CallSession, ScamSignal

router = APIRouter()

class AnalyzeRequest(BaseModel):
    transcript: str
    caller_number: str
    is_video: bool = True
    duration: int = 1200
    state_code: str = "DL"

@router.post("/analyze")
def analyze_call(req: AnalyzeRequest, db: Session = Depends(get_db)):
    return scam_service.analyze_session(db, req.transcript, req.caller_number, req.is_video, req.duration, req.state_code)

@router.get("")
def get_sessions(
    limit: int = 20,
    stateCode: str = None,
    minRisk: float = None,
    db: Session = Depends(get_db)
):
    query = db.query(CallSession)
    if stateCode:
        query = query.filter(CallSession.state_code == stateCode)
    if minRisk is not None:
        query = query.filter(CallSession.risk_score >= minRisk)
    
    sessions = query.order_by(CallSession.created_at.desc()).limit(limit).all()
    
    result = []
    for s in sessions:
        signals = db.query(ScamSignal).filter(ScamSignal.call_session_id == s.id).all()
        result.append({
            "id": str(s.id),
            "callerNumber": s.caller_number,
            "stateCode": s.state_code,
            "claimedIdentity": s.claimed_identity,
            "durationSeconds": s.duration_seconds,
            "isVideo": s.is_video,
            "riskScore": s.risk_score,
            "status": s.status,
            "transcriptText": s.transcript_text,
            "createdAt": s.created_at.isoformat() if s.created_at else None,
            "signals": [
                {
                    "id": str(sig.id),
                    "signalType": sig.signal_type,
                    "detail": sig.detail,
                    "weight": sig.weight
                } for sig in signals
            ]
        })
    return result