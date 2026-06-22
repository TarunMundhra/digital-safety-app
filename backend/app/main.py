from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator
from app.routers import scam_router, graph_router, fusion_router, geo_router, shield_router, seed_router
from app.db.database import engine, Base

# Create all database tables on startup
Base.metadata.create_all(bind=engine)

from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Digital Public Safety Intelligence Platform")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Phase 11: Observability
Instrumentator().instrument(app).expose(app)

app.include_router(scam_router.router, prefix="/api/v1/scam-sessions", tags=["Scam Detection"])
app.include_router(graph_router.router, prefix="/api/v1/graph", tags=["Graph Intelligence"])
app.include_router(fusion_router.router, prefix="/api/v1/fusion", tags=["Agentic Fusion"])
app.include_router(geo_router.router, prefix="/api/v1/geo", tags=["Geospatial"])
app.include_router(shield_router.router, prefix="/api/v1/shield", tags=["Citizen Shield"])
app.include_router(seed_router.router, prefix="/api/v1/seed", tags=["Database Seeding"])

@app.get("/health")
def health_check():
    return {"status": "healthy"}