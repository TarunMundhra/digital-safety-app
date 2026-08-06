from fastapi import FastAPI
from prometheus_fastapi_instrumentator import Instrumentator
from app.routers import scam_router, graph_router, fusion_router, geo_router, shield_router, seed_router, partners_router
from app.db.database import engine, Base

from sqlalchemy import text

# Create all database tables on startup
Base.metadata.create_all(bind=engine)

def run_schema_migrations(engine):
    with engine.connect() as conn:
        conn.execute(text("ALTER TABLE entities ADD COLUMN IF NOT EXISTS sim_activated_at TIMESTAMP;"))
        conn.execute(text("ALTER TABLE intelligence_packages ADD COLUMN IF NOT EXISTS evidence_type VARCHAR;"))
        conn.execute(text("ALTER TABLE intelligence_packages ADD COLUMN IF NOT EXISTS evidence_details TEXT;"))
        conn.commit()

run_schema_migrations(engine)

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
app.include_router(partners_router.router, prefix="/api/v1/partners", tags=["Partners"])

@app.api_route("/", methods=["GET", "HEAD"])
def root():
    return {"status": "healthy", "service": "Digital Public Safety Intelligence Platform API"}

@app.api_route("/health", methods=["GET", "HEAD"])
def health_check():
    from app.services.scam_service import cache_ping
    return {"status": "healthy", "redis": cache_ping()}
