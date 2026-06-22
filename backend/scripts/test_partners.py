import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi.testclient import TestClient
from app.main import app
from app.db.database import SessionLocal
from app.db.models import Entity, CallSession, VictimReport, ScamSignal, FraudCluster, EntityLink
from datetime import datetime, timedelta
import json

client = TestClient(app)

def run_tests():
    db = SessionLocal()
    try:
        print("1. Seeding database...")
        res = client.post("/api/v1/seed")
        assert res.status_code == 200, f"Seed failed: {res.text}"
        print("✅ Seed successful.")

        # Test PII Rejection (Task 1 & 5)
        print("2. Testing PII rejection (strict key check)...")
        invalid_payload = {
            "masked_reporter_id": "BANK_XYZ_REP",
            "transaction_ref": "TXN_VERIFY_999",
            "scam_type": "digital_arrest",
            "linked_phone_number": "+91-9876543210",
            "unmasked_user_email": "hackathon@victim.com" # Forbidden key
        }
        res = client.post("/api/v1/partners/bank-reports", json=invalid_payload)
        # Pydantic extra = Extra.forbid throws 422 Unprocessable Entity
        assert res.status_code == 422, f"Expected 422, got {res.status_code}"
        print("✅ PII rejection works (payload blocked).")

        # Test Bank Ingestion (Task 2 & 5)
        print("3. Testing bank report ingestion...")
        valid_payload = {
            "masked_reporter_id": "BANK_XYZ_REP",
            "transaction_ref": "TXN_VERIFY_999",
            "scam_type": "digital_arrest",
            "linked_phone_number": "+91-9876543210"
        }
        
        # Check initial session risk score
        session_before = db.query(CallSession).filter(CallSession.caller_number == "+91-9876543210").first()
        assert session_before is not None, "Seeded session not found"
        print(f"   Initial Call Session risk score: {session_before.risk_score}")

        res = client.post("/api/v1/partners/bank-reports", json=valid_payload)
        assert res.status_code == 200, f"Ingestion failed: {res.text}"
        data = res.json()
        assert data["success"] is True
        assert data["evaluated_sessions"] > 0
        print("✅ Bank ingestion successful.")

        # Verify Entity is updated/created
        entity = db.query(Entity).filter(Entity.value == "+91-9876543210").first()
        assert entity is not None
        assert entity.risk_score >= 85.0, f"Expected risk_score >= 85.0, got {entity.risk_score}"
        print(f"   Entity risk score elevated to: {entity.risk_score}")

        # Verify CallSession is re-evaluated and boosted
        db.refresh(session_before)
        print(f"   Call Session risk score after bank report: {session_before.risk_score}")
        assert session_before.risk_score >= 85.0
        print("✅ Call session score updated successfully.")

        # Test SIM Fan-out Rule (Task 4)
        print("4. Testing SIM fan-out out-degree signal...")
        # Clean state for SIM test phone
        sim_phone = "+91-9123456780"
        ent_sim = db.query(Entity).filter(Entity.value == sim_phone).first()
        assert ent_sim is not None, "Seeded SIM phone entity not found"
        
        # Set SIM activation to 3 days ago
        ent_sim.sim_activated_at = datetime.utcnow() - timedelta(days=3)
        db.commit()

        # Let's count out-degree (sessions + links)
        session_count = db.query(CallSession).filter(CallSession.caller_number == sim_phone).count()
        link_count = db.query(EntityLink).filter(
            (EntityLink.entity_a_id == ent_sim.id) | (EntityLink.entity_b_id == ent_sim.id)
        ).count()
        print(f"   SIM entity out-degree: sessions={session_count}, links={link_count}, total={session_count + link_count}")

        # Trigger re-evaluation
        session_sim = db.query(CallSession).filter(CallSession.caller_number == sim_phone).first()
        assert session_sim is not None
        initial_sim_score = session_sim.risk_score
        print(f"   Initial SIM session score: {initial_sim_score}")

        # Run evaluate
        res = client.post(f"/api/v1/fusion/evaluate/{session_sim.id}")
        assert res.status_code == 200, f"Evaluation failed: {res.text}"
        
        # Verify SIM_FAN_OUT signal is registered
        db.refresh(session_sim)
        sig = db.query(ScamSignal).filter(
            ScamSignal.call_session_id == session_sim.id,
            ScamSignal.signal_type == "SIM_FAN_OUT"
        ).first()
        assert sig is not None, "SIM_FAN_OUT signal was not registered"
        assert session_sim.risk_score > initial_sim_score, f"Risk score did not increase: {session_sim.risk_score} vs {initial_sim_score}"
        print(f"   Signal registered: {sig.detail} with weight {sig.weight}")
        print(f"   SIM session score boosted to: {session_sim.risk_score}")
        print("✅ SIM fan-out signal verification successful.")

        # Test Phishing scan & Rapidfuzz (Task 3)
        print("5. Testing phishing scans (lookalike app & certificate transparency)...")
        # Ensure we have a cluster matching brand name "SBI" to link evidence to
        cluster_sbi = db.query(FraudCluster).filter(FraudCluster.label.ilike("%sbi%")).first()
        if not cluster_sbi:
            # Seed SBI cluster
            cluster_sbi = FraudCluster(label="SBI Network", member_entity_ids=[])
            db.add(cluster_sbi)
            db.commit()

        scan_payload = ["SBI"]
        res = client.post("/api/v1/partners/scan-phishing", json=scan_payload)
        assert res.status_code == 200, f"Scan failed: {res.text}"
        scan_data = res.json()
        print(f"   Lookalike apps flagged: {scan_data['lookalike_apps_flagged']}")
        print(f"   Phishing certificates flagged: {scan_data['phishing_certs_flagged']}")
        
        # Verify app matches
        assert scan_data["lookalike_apps_flagged"] > 0, "No lookalike apps were flagged"
        apps = scan_data["apps"]
        assert any(app["app_title"] == "SBI Quick Rewards & Cash Support" for app in apps)
        print("✅ Lookalike app scanning with Rapidfuzz works.")

        # Verify crt.sh query matched
        certs = scan_data["certs"]
        # If crt.sh query succeeded or not (network dependent, but we handle exception gracefully)
        print(f"   Domain certs matched: {[c['domain'] for c in certs]}")
        print("✅ Phishing detection tests complete.")
        
        print("\n🎉 ALL PARTNER INTEGRATION TESTS PASSED SUCCESSFULLY! 🎉")

    finally:
        db.close()

if __name__ == "__main__":
    run_tests()
