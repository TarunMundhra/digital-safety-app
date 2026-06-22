from sqlalchemy import Column, String, Integer, Float, DateTime, ForeignKey, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID, ARRAY
from geoalchemy2 import Geography
from pgvector.sqlalchemy import Vector
from datetime import datetime
import uuid
from app.db.database import Base

class Entity(Base):
    __tablename__ = "entities"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = Column(String, nullable=False)
    value = Column(String, nullable=False, index=True)
    state_code = Column(String, index=True) # Phase 11: Jurisdiction sharding
    first_seen = Column(DateTime, default=datetime.utcnow)
    risk_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class EntityLink(Base):
    __tablename__ = "entity_links"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    entity_a_id = Column(UUID(as_uuid=True), ForeignKey("entities.id"), nullable=False)
    entity_b_id = Column(UUID(as_uuid=True), ForeignKey("entities.id"), nullable=False)
    link_type = Column(String)
    weight = Column(Float, default=1.0)
    evidence_ref = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

class CallSession(Base):
    __tablename__ = "call_sessions"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    caller_number = Column(String, index=True)
    state_code = Column(String, index=True) # Phase 11: Jurisdiction sharding
    claimed_identity = Column(String)
    started_at = Column(DateTime, default=datetime.utcnow)
    duration_seconds = Column(Integer, default=0)
    is_video = Column(Boolean, default=False)
    transcript_text = Column(Text)
    transcript_embedding = Column(Vector(384)) # FastEmbed BAAI/bge-small-en-v1.5
    risk_score = Column(Float, default=0.0)
    status = Column(String, default="analyzed")
    created_at = Column(DateTime, default=datetime.utcnow)

class ScamSignal(Base):
    __tablename__ = "scam_signals"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    call_session_id = Column(UUID(as_uuid=True), ForeignKey("call_sessions.id"), nullable=False)
    signal_type = Column(String, nullable=False)
    detail = Column(Text)
    weight = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

class VictimReport(Base):
    __tablename__ = "victim_reports"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    location = Column(Geography(geometry_type='POINT', srid=4326))
    report_type = Column(String)
    severity = Column(Integer, default=1)
    reported_at = Column(DateTime, default=datetime.utcnow)
    related_call_session_id = Column(UUID(as_uuid=True), ForeignKey("call_sessions.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

class FraudCluster(Base):
    __tablename__ = "fraud_clusters"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    label = Column(String)
    member_entity_ids = Column(ARRAY(UUID(as_uuid=True)))
    confidence = Column(Float, default=0.0)
    detected_at = Column(DateTime, default=datetime.utcnow)

class IntelligencePackage(Base):
    __tablename__ = "intelligence_packages"
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    fraud_cluster_id = Column(UUID(as_uuid=True), ForeignKey("fraud_clusters.id"))
    package_hash = Column(String, unique=True)
    generated_at = Column(DateTime, default=datetime.utcnow)
    pdf_path = Column(String)