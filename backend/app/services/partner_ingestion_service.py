from sqlalchemy.orm import Session
from app.db.models import Entity, VictimReport, CallSession, FraudCluster
from app.services.fusion_service import evaluate_session
from datetime import datetime, timedelta

def ingest_bank_report(db: Session, payload: dict) -> dict:
    entity_val = payload.get("linked_phone_number") or payload.get("device_fingerprint")
    ent_type = "phone_number" if payload.get("linked_phone_number") else "device_fingerprint"
    
    if not entity_val:
        return {"success": False, "error": "No identifier provided"}
        
    entity = db.query(Entity).filter(Entity.value == entity_val).first()
    if not entity:
        entity = Entity(type=ent_type, value=entity_val, risk_score=85.0)
        db.add(entity)
    else:
        entity.risk_score = max(entity.risk_score, 85.0)
    db.flush()

    # Save VictimReport
    loc_wkt = "POINT(77.2090 28.6139)" # Default Delhi
    db_report = VictimReport(
        location=loc_wkt,
        report_type=payload["scam_type"],
        severity=4,
        reported_at=payload.get("reported_at") or datetime.utcnow()
    )
    db.add(db_report)
    db.flush()

    # Evaluate associated sessions
    evaluated_count = 0
    if ent_type == "phone_number":
        sessions = db.query(CallSession).filter(CallSession.caller_number == entity_val).all()
        for s in sessions:
            evaluate_session(db, str(s.id))
            evaluated_count += 1
            
    db.commit()
    return {"success": True, "entity_id": str(entity.id), "evaluated_sessions": evaluated_count}

def get_partners_summary(db: Session, days: int) -> dict:
    cutoff = datetime.utcnow() - timedelta(days=days)
    clusters = db.query(FraudCluster).all()
    
    cluster_members = set()
    for c in clusters:
        if c.member_entity_ids:
            cluster_members.update(c.member_entity_ids)
            
    # Count newly reported partner entities in clusters
    partner_entities = db.query(Entity).filter(
        Entity.created_at >= cutoff,
        Entity.id.in_(list(cluster_members))
    ).all()
    
    phone_count = sum(1 for e in partner_entities if e.type == "phone_number")
    device_count = sum(1 for e in partner_entities if e.type == "device_fingerprint")
    
    return {
        "days": days,
        "total_entities_linked_to_clusters": len(partner_entities),
        "phone_number_count": phone_count,
        "device_fingerprint_count": device_count
    }
