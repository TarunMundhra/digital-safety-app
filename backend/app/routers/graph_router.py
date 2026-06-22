from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.services import graph_service

router = APIRouter()

@router.post("/detect")
def detect_clusters(db: Session = Depends(get_db)):
    return graph_service.detect_clusters(db)

@router.get("/cross-state")
def get_cross_state_clusters(db: Session = Depends(get_db)):
    return graph_service.get_cross_state_clusters(db)

@router.get("/clusters")
def get_clusters(db: Session = Depends(get_db)):
    return graph_service.get_clusters_bfs(db)

@router.post("/intel-package/{cluster_id}")
def generate_intel_package(cluster_id: str, db: Session = Depends(get_db)):
    pdf_path = graph_service.generate_intel_package(db, cluster_id)
    if not pdf_path:
        raise HTTPException(status_code=404, detail="Cluster not found")
    return FileResponse(pdf_path, media_type="application/pdf", filename=f"intel_package_{cluster_id}.pdf")
