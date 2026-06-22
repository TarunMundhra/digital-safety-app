import sys
sys.path.append('/app')
import ollama
from app.db.database import SessionLocal
from app.db.models import CallSession, VictimReport, Entity, EntityLink, ScamSignal, FraudCluster, IntelligencePackage
import uuid
from datetime import datetime

def generate_transcripts():
    db = SessionLocal()
    
    # 1. Clean existing records in dependency order to avoid ForeignKeyViolations
    print("Clearing existing seed data...")
    db.query(EntityLink).delete()
    db.query(Entity).delete()
    db.query(ScamSignal).delete()
    db.query(VictimReport).delete()
    db.query(IntelligencePackage).delete()
    db.query(CallSession).delete()
    db.query(FraudCluster).delete()
    db.commit()

    # 2. Seed Call Sessions
    prompt = "Generate a realistic 2-paragraph transcript of an Indian 'Digital Arrest' scam where someone impersonates a CBI officer."
    
    print("Generating scam transcript via Ollama...")
    try:
        response = ollama.generate(model='llama3.1', prompt=prompt)
        scam_text = response['response']
        print("Scam transcript generated successfully using Ollama.")
    except Exception as e:
        print(f"Ollama call failed or model not pulled: {e}")
        print("Falling back to high-quality pre-defined Indian 'Digital Arrest' transcript.")
        scam_text = (
            "This is Officer Vikram Rathore from the CBI Headquarters, New Delhi. "
            "We are calling to inform you that your Aadhaar card has been found linked to a suspicious package "
            "intercepted at the customs department in Mumbai containing illegal substances, fake passports, "
            "and active credit cards. A case has been registered under your name under the NDPS Act. "
            "You are currently placed under 'digital arrest' and must remain on this video call for verification. "
            "Do not talk to anyone or leave your camera view, or we will dispatch the local police to arrest you."
        )
    
    db.add(CallSession(
        caller_number="+91999999999",
        state_code="DL",
        transcript_text=scam_text,
        risk_score=85.0,
        duration_seconds=900,
        is_video=True
    ))
    
    legit_text = "Hello, this is your bank's customer service. Is this a good time to talk about your new credit card offer?"
    db.add(CallSession(
        caller_number="+91888888888",
        state_code="KA",
        transcript_text=legit_text,
        risk_score=10.0,
        duration_seconds=120,
        is_video=False
    ))
    db.commit()

    # 3. Seed Victim Reports (Geospatial Points in WKT format)
    print("Seeding Victim Reports (Geospatial)...")
    db.add(VictimReport(
        location="POINT(77.2090 28.6139)", # Delhi
        report_type="Digital Arrest",
        severity=3
    ))
    db.add(VictimReport(
        location="POINT(77.2200 28.6300)", # Near Delhi
        report_type="Digital Arrest",
        severity=4
    ))
    db.add(VictimReport(
        location="POINT(72.8777 19.0760)", # Mumbai
        report_type="Customs Scam",
        severity=2
    ))
    db.add(VictimReport(
        location="POINT(77.5946 12.9716)", # Bangalore
        report_type="RBI Impersonation",
        severity=4
    ))
    db.commit()

    # 4. Seed Entities & EntityLinks (Graph Network)
    print("Seeding Entities & Entity Links...")
    
    # Phone numbers
    e1 = Entity(type="phone", value="+91999999999", state_code="DL", risk_score=85.0)
    e2 = Entity(type="phone", value="+91999999998", state_code="DL", risk_score=90.0)
    e3 = Entity(type="phone", value="+91888888887", state_code="KA", risk_score=75.0)
    # Scammer Bank Accounts & UPI
    e4 = Entity(type="bank_account", value="1234567890", state_code="MH", risk_score=95.0)
    e5 = Entity(type="upi", value="scammer@okaxis", state_code="DL", risk_score=80.0)
    
    db.add_all([e1, e2, e3, e4, e5])
    db.commit()

    # Refresh to load IDs
    db.refresh(e1)
    db.refresh(e2)
    db.refresh(e3)
    db.refresh(e4)
    db.refresh(e5)

    # Establish links to form a network
    # Phone 1 linked to Scammer bank account
    db.add(EntityLink(entity_a_id=e1.id, entity_b_id=e4.id, link_type="transacted_to", weight=2.0, evidence_ref="Co-accused statements"))
    # Phone 2 linked to the same Scammer bank account
    db.add(EntityLink(entity_a_id=e2.id, entity_b_id=e4.id, link_type="transacted_to", weight=1.5, evidence_ref="Call log records"))
    # Phone 3 (KA) linked to Scammer UPI (DL) - cross-jurisdictional link
    db.add(EntityLink(entity_a_id=e3.id, entity_b_id=e5.id, link_type="registered_with", weight=1.0, evidence_ref="IP correlation"))
    
    db.commit()
    print("Transcripts and fraud network seeded successfully.")

if __name__ == "__main__":
    generate_transcripts()