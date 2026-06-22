from fastapi import APIRouter
from app.services import geo_service

router = APIRouter()

@router.get("/hotspots")
def get_hotspots(days: int = 30):
    return geo_service.get_hotspots(days)