from sqlalchemy.orm import Session
from app.db.models import CallSession, Entity, FraudCluster

def evaluate_session(db: Session, call_session_id: str) -> dict:
    session = db.query(CallSession).filter(CallSession.id == call_session_id).first()
    if not session:
        return {"error": "Session not found"}
        
    original_risk_score = session.risk_score
    caller_number = session.caller_number
    
    entity = db.query(Entity).filter(Entity.value == caller_number).first()
    network_corroborated = False
    cluster_id = None
    fused_risk_score = original_risk_score
    
    if entity:
        clusters = db.query(FraudCluster).all()
        for cluster in clusters:
            if entity.id in cluster.member_entity_ids:
                network_corroborated = True
                cluster_id = str(cluster.id)
                boost_factor = 1.0 + (cluster.confidence or 0.0) * 0.3
                fused_risk_score = min(100.0, original_risk_score * boost_factor + 10)
                break
                
    # Generate recommendation
    if network_corroborated and fused_risk_score > 80:
        recommendation = "Network-corroborated critical threat. The caller number is part of a known fraud network. Immediate coordinated action required across law enforcement agencies."
    elif network_corroborated and fused_risk_score > 50:
        recommendation = "Network-corroborated threat detected. The caller is associated with a known fraud cluster. Escalate for cross-reference investigation."
    elif network_corroborated:
        recommendation = "Weak network correlation found. Monitor for additional corroborating evidence from other sessions."
    elif fused_risk_score > 80:
        recommendation = "High risk session without network corroboration. Recommend deep analysis of call patterns and immediate intervention."
    elif fused_risk_score > 50:
        recommendation = "Moderate risk session. Continue monitoring and cross-reference with known scam databases."
    else:
        recommendation = "Low risk session. No network corroboration found. Standard monitoring protocol applies."

    session.risk_score = fused_risk_score
    session.status = "network_corroborated" if network_corroborated else "analyzed"
    db.commit()

    return {
        "callSessionId": str(session.id),
        "originalRiskScore": original_risk_score,
        "fusedRiskScore": fused_risk_score,
        "networkCorroborated": network_corroborated,
        "clusterId": cluster_id,
        "recommendation": recommendation
    }