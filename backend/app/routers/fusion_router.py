from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services import fusion_service

router = APIRouter()

class FusionRequest(BaseModel):
    callSessionId: str

@router.post("/evaluate")
def run_fusion_body(req: FusionRequest, db: Session = Depends(get_db)):
    return fusion_service.evaluate_session(db, req.callSessionId)

@router.post("/evaluate/{call_session_id}")
def run_fusion(call_session_id: str, db: Session = Depends(get_db)):
    return fusion_service.evaluate_session(db, call_session_id)