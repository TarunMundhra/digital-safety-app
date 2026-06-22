from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import CallSession, VictimReport, Entity, EntityLink, ScamSignal, FraudCluster, IntelligencePackage
import uuid
from datetime import datetime

router = APIRouter()

SAMPLE_SESSIONS = [
  {
    "callerNumber": "+91-9876543210",
    "stateCode": "DL",
    "claimedIdentity": "Claimed CBI officer",
    "durationSeconds": 1800,
    "isVideo": True,
    "transcript":
      "I am calling from CBI headquarters. Your Aadhaar number has been linked to a money laundering case involving ₹50 lakhs. A warrant has been issued for your arrest. You need to stay on this video call and do not disconnect. We are putting you under digital arrest until the investigation is complete. You must immediately verify your identity by sharing your bank account details and the OTP we just sent to your registered mobile number. This is urgent - you must act right now. Do not tell anyone about this call as it is a classified investigation. If you disconnect, you will be arrested within 24 hours.",
    "riskScore": 100,
    "status": "analyzed",
    "signalTypes": [
      "IMPERSONATION",
      "THREAT_ARREST",
      "FINANCIAL_DEMAND",
      "VIDEO_COERCION",
      "URGENCY",
      "PERSONAL_INFO",
      "COURTS",
      "DIGITAL_ARREST",
    ],
  },
  {
    "callerNumber": "+91-9123456780",
    "stateCode": "MH",
    "claimedIdentity": "Claimed RBI officer",
    "durationSeconds": 900,
    "isVideo": True,
    "transcript":
      "This is the Reserve Bank of India calling. We have detected unauthorized transactions from your bank account. Your account will be frozen within the next 2 hours unless you verify your identity immediately. Please share your UPI PIN and the OTP sent to your phone. A case has been filed against you for suspected fraud. Do not tell anyone or your account will be permanently closed.",
    "riskScore": 95,
    "status": "analyzed",
    "signalTypes": [
      "IMPERSONATION",
      "THREAT_ARREST",
      "FINANCIAL_DEMAND",
      "VIDEO_COERCION",
      "URGENCY",
      "PERSONAL_INFO",
      "COURTS",
      "DIGITAL_ARREST",
    ],
  },
  {
    "callerNumber": "+91-8765432198",
    "stateCode": "KA",
    "claimedIdentity": "Claimed ED officer",
    "durationSeconds": 2400,
    "isVideo": True,
    "transcript":
      "Sir, I am Inspector Sharma from the Enforcement Directorate. We have a digital arrest warrant against you in connection with the Nirav Modi scam. Your name has appeared in the seized documents. You are under house arrest. Keep this video call active. Do not turn off your phone. We need you to transfer ₹2 lakhs to our verification account immediately through GPay to prove your innocence. The court has ordered this verification process. Tell no one about this.",
    "riskScore": 95,
    "status": "analyzed",
    "signalTypes": [
      "IMPERSONATION",
      "THREAT_ARREST",
      "FINANCIAL_DEMAND",
      "VIDEO_COERCION",
      "URGENCY",
      "PERSONAL_INFO",
      "COURTS",
      "DIGITAL_ARREST",
    ],
  },
  {
    "callerNumber": "+91-9988776655",
    "stateCode": "TG",
    "claimedIdentity": "Claimed Police officer",
    "durationSeconds": 720,
    "isVideo": False,
    "transcript":
      "I am Senior Inspector Rao from Cyber Crime police station. Your PAN card has been used for illegal cryptocurrency trading. An FIR has been registered against you. You need to come to the police station today or we will send a team to arrest you. Share your bank details and ATM pin so we can verify your transactions. This is very urgent.",
    "riskScore": 85,
    "status": "analyzed",
    "signalTypes": [
      "IMPERSONATION",
      "THREAT_ARREST",
      "FINANCIAL_DEMAND",
      "URGENCY",
      "PERSONAL_INFO",
      "COURTS",
    ],
  },
  {
    "callerNumber": "+91-8877665544",
    "stateCode": "TN",
    "claimedIdentity": "Claimed Customs officer",
    "durationSeconds": 600,
    "isVideo": True,
    "transcript":
      "This is the Customs Department. A parcel in your name containing contraband has been intercepted at Chennai port. An arrest warrant has been issued. You are under digital arrest. Stay on this video call. Pay ₹50,000 through UPI as clearance fee immediately or you will be sent to jail within 24 hours. Don't tell anyone.",
    "riskScore": 85,
    "status": "analyzed",
    "signalTypes": [
      "IMPERSONATION",
      "THREAT_ARREST",
      "FINANCIAL_DEMAND",
      "VIDEO_COERCION",
      "URGENCY",
      "DIGITAL_ARREST",
    ],
  },
  {
    "callerNumber": "+91-7766554433",
    "stateCode": "WB",
    "claimedIdentity": "Claimed Income Tax officer",
    "durationSeconds": 480,
    "isVideo": False,
    "transcript":
      "I am calling from the Income Tax Department. There is a discrepancy in your tax returns for the last 3 years amounting to ₹8 lakhs. A case has been filed in the Income Tax tribunal. You need to verify your identity by sharing your Aadhaar number and bank account details immediately. If you don't comply today, a warrant will be issued for your arrest.",
    "riskScore": 75,
    "status": "analyzed",
    "signalTypes": [
      "IMPERSONATION",
      "THREAT_ARREST",
      "FINANCIAL_DEMAND",
      "URGENCY",
      "PERSONAL_INFO",
      "COURTS",
    ],
  },
  {
    "callerNumber": "+91-6655443322",
    "stateCode": "RJ",
    "claimedIdentity": "Claimed Cyber Crime officer",
    "durationSeconds": 1200,
    "isVideo": True,
    "transcript":
      "This is Cyber Crime Jaipur. Your phone number has been linked to a child pornography ring. The CBI has issued a warrant. You are placed under digital arrest. Keep the video call on. You need to share your OTP and bank account number for verification. This is extremely urgent. Do not disconnect or tell anyone. The judge has ordered immediate verification.",
    "riskScore": 90,
    "status": "analyzed",
    "signalTypes": [
      "IMPERSONATION",
      "THREAT_ARREST",
      "FINANCIAL_DEMAND",
      "VIDEO_COERCION",
      "URGENCY",
      "PERSONAL_INFO",
      "COURTS",
      "DIGITAL_ARREST",
    ],
  },
  {
    "callerNumber": "+91-5544332211",
    "stateCode": "UP",
    "claimedIdentity": "Claimed Police officer",
    "durationSeconds": 300,
    "isVideo": False,
    "transcript":
      "I am Sub-Inspector Verma from Lucknow police. We have received a complaint that your Aadhaar card was used to open fake bank accounts. You need to visit the police station today with your PAN card and bank statements. This is an urgent matter.",
    "riskScore": 40,
    "status": "analyzed",
    "signalTypes": ["IMPERSONATION", "URGENCY", "PERSONAL_INFO", "COURTS"],
  },
  {
    "callerNumber": "+91-4433221100",
    "stateCode": "GJ",
    "claimedIdentity": "Claimed bank officer",
    "durationSeconds": 180,
    "isVideo": False,
    "transcript":
      "Hello, I am calling from SBI Ahmedabad branch. Your KYC needs to be updated immediately or your account will be blocked. Please share your Aadhaar number, PAN number, and the OTP sent to your registered mobile number for verification.",
    "riskScore": 55,
    "status": "analyzed",
    "signalTypes": [
      "FINANCIAL_DEMAND",
      "URGENCY",
      "PERSONAL_INFO",
    ],
  },
  {
    "callerNumber": "+91-3322110099",
    "stateCode": "DL",
    "claimedIdentity": None,
    "durationSeconds": 60,
    "isVideo": False,
    "transcript":
      "Hello, your account has been debited ₹5,000. If you did not make this transaction, please share the OTP sent to your phone to cancel it immediately.",
    "riskScore": 45,
    "status": "analyzed",
    "signalTypes": ["FINANCIAL_DEMAND", "URGENCY"],
  },
  {
    "callerNumber": "+91-2211009988",
    "stateCode": "MH",
    "claimedIdentity": None,
    "durationSeconds": 45,
    "isVideo": False,
    "transcript":
      "Sir, I am from Paytm. Your account is being upgraded. Please share the 6-digit OTP we just sent to complete the process. This will only take 2 minutes.",
    "riskScore": 40,
    "status": "analyzed",
    "signalTypes": ["FINANCIAL_DEMAND", "URGENCY"],
  },
  {
    "callerNumber": "+91-1100998877",
    "stateCode": "KA",
    "claimedIdentity": None,
    "durationSeconds": 30,
    "isVideo": False,
    "transcript":
      "Congratulations! You have won a lottery of ₹25 lakhs. To claim your prize, please pay ₹5,000 as processing fee. Transfer the amount through UPI to claim your reward.",
    "riskScore": 25,
    "status": "analyzed",
    "signalTypes": ["FINANCIAL_DEMAND"],
  },
  {
    "callerNumber": "+91-9009887766",
    "stateCode": "TN",
    "claimedIdentity": None,
    "durationSeconds": 120,
    "isVideo": False,
    "transcript":
      "Hello madam, I am calling from the Electricity Board. Your electricity bill of ₹15,000 is overdue. Pay immediately through PhonePe or your connection will be disconnected today. Send the payment to this UPI ID.",
    "riskScore": 25,
    "status": "analyzed",
    "signalTypes": ["FINANCIAL_DEMAND", "URGENCY"],
  },
  {
    "callerNumber": "+91-8008776655",
    "stateCode": "TG",
    "claimedIdentity": None,
    "durationSeconds": 200,
    "isVideo": False,
    "transcript":
      "Hello, I am from Amazon customer care. There is a problem with your recent order. We need to verify your identity. Please share the CVV of your registered card and the OTP to process a refund.",
    "riskScore": 45,
    "status": "analyzed",
    "signalTypes": ["FINANCIAL_DEMAND", "PERSONAL_INFO"],
  },
  {
    "callerNumber": "+91-7007665544",
    "stateCode": "DL",
    "claimedIdentity": None,
    "durationSeconds": 15,
    "isVideo": False,
    "transcript":
      "Hi, this is just a regular customer feedback call from your bank. We wanted to check if you are satisfied with our services. Have a good day!",
    "riskScore": 0,
    "status": "legitimate",
    "signalTypes": [],
  },
  {
    "callerNumber": "+91-6006554433",
    "stateCode": "KA",
    "claimedIdentity": None,
    "durationSeconds": 90,
    "isVideo": False,
    "transcript":
      "Hello, I am calling from your insurance company regarding your policy renewal. Your premium of ₹12,000 is due next month. Would you like to renew it now?",
    "riskScore": 0,
    "status": "legitimate",
    "signalTypes": [],
  },
  {
    "callerNumber": "+91-5005443322",
    "stateCode": "MH",
    "claimedIdentity": "Claimed IT Department officer",
    "durationSeconds": 1500,
    "isVideo": True,
    "transcript":
      "Sir, I am calling from the IT Department. We found discrepancies in your income tax returns. A court has issued a warrant against you. You are under digital arrest - do not disconnect this video call. Share your bank account details and ATM PIN for immediate verification. If you do not comply within 24 hours, you will be arrested and sent to jail. This is extremely urgent. Don't tell anyone about this investigation.",
    "riskScore": 95,
    "status": "analyzed",
    "signalTypes": [
      "IMPERSONATION",
      "THREAT_ARREST",
      "FINANCIAL_DEMAND",
      "VIDEO_COERCION",
      "URGENCY",
      "PERSONAL_INFO",
      "COURTS",
      "DIGITAL_ARREST",
    ],
  },
]

SIGNAL_WEIGHTS = {
  "IMPERSONATION": 30,
  "THREAT_ARREST": 25,
  "FINANCIAL_DEMAND": 25,
  "VIDEO_COERCION": 20,
  "URGENCY": 15,
  "PERSONAL_INFO": 20,
  "COURTS": 20,
  "DIGITAL_ARREST": 35,
}

SAMPLE_ENTITIES = [
  { "type": "phone_number", "value": "+91-9876543210", "stateCode": "DL", "riskScore": 95 },
  { "type": "phone_number", "value": "+91-9123456780", "stateCode": "MH", "riskScore": 85 },
  { "type": "phone_number", "value": "+91-8765432198", "stateCode": "KA", "riskScore": 90 },
  { "type": "phone_number", "value": "+91-9988776655", "stateCode": "TG", "riskScore": 80 },
  { "type": "phone_number", "value": "+91-8877665544", "stateCode": "TN", "riskScore": 78 },
  { "type": "phone_number", "value": "+91-7766554433", "stateCode": "WB", "riskScore": 70 },
  { "type": "phone_number", "value": "+91-6655443322", "stateCode": "RJ", "riskScore": 88 },
  { "type": "phone_number", "value": "+91-5005443322", "stateCode": "MH", "riskScore": 92 },
  { "type": "phone_number", "value": "+91-5544332211", "stateCode": "UP", "riskScore": 35 },
  { "type": "phone_number", "value": "+91-4433221100", "stateCode": "GJ", "riskScore": 50 },
  { "type": "phone_number", "value": "+91-3322110099", "stateCode": "DL", "riskScore": 40 },
  { "type": "upi_id", "value": "scammer@upi", "stateCode": "DL", "riskScore": 75 },
  { "type": "upi_id", "value": "fraudster@paytm", "stateCode": "MH", "riskScore": 68 },
  { "type": "upi_id", "value": "fakeofficer@gpay", "stateCode": "KA", "riskScore": 72 },
  { "type": "upi_id", "value": "verify_quick@ybl", "stateCode": "TG", "riskScore": 55 },
  { "type": "bank_account", "value": "XXXX-XXXX-1234", "stateCode": "DL", "riskScore": 65 },
  { "type": "bank_account", "value": "XXXX-XXXX-5678", "stateCode": "MH", "riskScore": 60 },
  { "type": "bank_account", "value": "XXXX-XXXX-9012", "stateCode": "KA", "riskScore": 58 },
  { "type": "bank_account", "value": "XXXX-XXXX-3456", "stateCode": "TN", "riskScore": 52 },
  { "type": "bank_account", "value": "XXXX-XXXX-7890", "stateCode": "RJ", "riskScore": 45 },
  { "type": "phone_number", "value": "+91-2211009988", "stateCode": "MH", "riskScore": 38 },
  { "type": "phone_number", "value": "+91-1100998877", "stateCode": "KA", "riskScore": 22 },
  { "type": "phone_number", "value": "+91-9009887766", "stateCode": "TN", "riskScore": 25 },
  { "type": "phone_number", "value": "+91-8008776655", "stateCode": "TG", "riskScore": 42 },
  { "type": "phone_number", "value": "+91-7007665544", "stateCode": "DL", "riskScore": 5 },
  { "type": "phone_number", "value": "+91-6006554433", "stateCode": "KA", "riskScore": 3 },
]

VICTIM_REPORTS = [
  { "stateCode": "DL", "latitude": 28.6139, "longitude": 77.209, "reportType": "digital_arrest", "severity": 5 },
  { "stateCode": "DL", "latitude": 28.65, "longitude": 77.22, "reportType": "otp_fraud", "severity": 3 },
  { "stateCode": "DL", "latitude": 28.58, "longitude": 77.18, "reportType": "digital_arrest", "severity": 5 },
  { "stateCode": "DL", "latitude": 28.63, "longitude": 77.25, "reportType": "kyc_scam", "severity": 4 },
  { "stateCode": "DL", "latitude": 28.7, "longitude": 77.15, "reportType": "digital_arrest", "severity": 5 },
  { "stateCode": "MH", "latitude": 19.076, "longitude": 72.8777, "reportType": "digital_arrest", "severity": 5 },
  { "stateCode": "MH", "latitude": 19.1, "longitude": 72.88, "reportType": "otp_fraud", "severity": 3 },
  { "stateCode": "MH", "latitude": 18.52, "longitude": 73.857, "reportType": "kyc_scam", "severity": 4 },
  { "stateCode": "MH", "latitude": 19.05, "longitude": 72.86, "reportType": "bank_fraud", "severity": 4 },
  { "stateCode": "MH", "latitude": 19.12, "longitude": 72.9, "reportType": "digital_arrest", "severity": 5 },
  { "stateCode": "KA", "latitude": 12.9716, "longitude": 77.5946, "reportType": "digital_arrest", "severity": 5 },
  { "stateCode": "KA", "latitude": 12.98, "longitude": 77.6, "reportType": "otp_fraud", "severity": 3 },
  { "stateCode": "KA", "latitude": 12.95, "longitude": 77.58, "reportType": "lottery_scam", "severity": 2 },
  { "stateCode": "KA", "latitude": 13.0, "longitude": 77.61, "reportType": "digital_arrest", "severity": 5 },
  { "stateCode": "TG", "latitude": 17.385, "longitude": 78.4867, "reportType": "digital_arrest", "severity": 5 },
  { "stateCode": "TG", "latitude": 17.4, "longitude": 78.5, "reportType": "otp_fraud", "severity": 3 },
  { "stateCode": "TG", "latitude": 17.35, "longitude": 78.45, "reportType": "bank_fraud", "severity": 4 },
  { "stateCode": "TN", "latitude": 13.0827, "longitude": 80.2707, "reportType": "digital_arrest", "severity": 5 },
  { "stateCode": "TN", "latitude": 13.06, "longitude": 80.25, "reportType": "otp_fraud", "severity": 3 },
  { "stateCode": "TN", "latitude": 13.1, "longitude": 80.29, "reportType": "digital_arrest", "severity": 4 },
  { "stateCode": "WB", "latitude": 22.5726, "longitude": 88.3639, "reportType": "tax_scam", "severity": 4 },
  { "stateCode": "WB", "latitude": 22.55, "longitude": 88.35, "reportType": "digital_arrest", "severity": 5 },
  { "stateCode": "WB", "latitude": 22.59, "longitude": 88.38, "reportType": "kyc_scam", "severity": 3 },
  { "stateCode": "RJ", "latitude": 26.9124, "longitude": 75.7873, "reportType": "digital_arrest", "severity": 5 },
  { "stateCode": "RJ", "latitude": 26.9, "longitude": 75.77, "reportType": "digital_arrest", "severity": 5 },
  { "stateCode": "RJ", "latitude": 26.92, "longitude": 75.8, "reportType": "otp_fraud", "severity": 3 },
  { "stateCode": "UP", "latitude": 26.8467, "longitude": 80.9462, "reportType": "digital_arrest", "severity": 4 },
  { "stateCode": "UP", "latitude": 26.85, "longitude": 80.95, "reportType": "tax_scam", "severity": 3 },
  { "stateCode": "UP", "latitude": 28.5355, "longitude": 77.391, "reportType": "digital_arrest", "severity": 4 },
  { "stateCode": "GJ", "latitude": 23.0225, "longitude": 72.5714, "reportType": "kyc_scam", "severity": 4 },
  { "stateCode": "GJ", "latitude": 23.03, "longitude": 72.58, "reportType": "otp_fraud", "severity": 3 },
  { "stateCode": "GJ", "latitude": 23.01, "longitude": 72.56, "reportType": "bank_fraud", "severity": 3 },
]

@router.post("")
def seed_db(db: Session = Depends(get_db)):
    try:
        # Clear existing data respecting Foreign Key constraints
        db.query(ScamSignal).delete()
        db.query(IntelligencePackage).delete()
        db.query(CallSession).delete()
        db.query(EntityLink).delete()
        db.query(FraudCluster).delete()
        db.query(Entity).delete()
        db.query(VictimReport).delete()
        db.commit()

        # 1. Seed Call Sessions and Signals
        signal_count = 0
        for session in SAMPLE_SESSIONS:
            db_session = CallSession(
                caller_number=session["callerNumber"],
                state_code=session["stateCode"],
                claimed_identity=session["claimedIdentity"],
                duration_seconds=session["durationSeconds"],
                is_video=session["isVideo"],
                transcript_text=session["transcript"],
                risk_score=float(session["riskScore"]),
                status=session["status"]
            )
            db.add(db_session)
            db.flush() # Populate ID

            for signal_type in session["signalTypes"]:
                db_signal = ScamSignal(
                    call_session_id=db_session.id,
                    signal_type=signal_type,
                    detail=f"{signal_type} detected in transcript",
                    weight=float(SIGNAL_WEIGHTS.get(signal_type, 0))
                )
                db.add(db_signal)
                signal_count += 1
        
        # 2. Seed Entities
        db_entities = []
        for ent in SAMPLE_ENTITIES:
            db_ent = Entity(
                type=ent["type"],
                value=ent["value"],
                state_code=ent["stateCode"],
                risk_score=float(ent["riskScore"])
            )
            db.add(db_ent)
            db_entities.append(db_ent)
        db.flush() # Populate IDs

        entity_by_value = {e.value: e for e in db_entities}

        # 3. Create Entity Links
        links_data = []

        # Phones to UPI IDs
        phone_upi_pairs = [
          ("+91-9876543210", "scammer@upi"),
          ("+91-9123456780", "fraudster@paytm"),
          ("+91-8765432198", "fakeofficer@gpay"),
          ("+91-9988776655", "verify_quick@ybl"),
          ("+91-6655443322", "scammer@upi"),
          ("+91-5005443322", "fraudster@paytm"),
        ]
        for phone, upi in phone_upi_pairs:
            p_ent = entity_by_value.get(phone)
            u_ent = entity_by_value.get(upi)
            if p_ent and u_ent:
                links_data.append(EntityLink(entity_a_id=p_ent.id, entity_b_id=u_ent.id, link_type="uses_upi", weight=0.9))

        # Phones to Bank accounts
        phone_bank_pairs = [
          ("+91-9876543210", "XXXX-XXXX-1234"),
          ("+91-9123456780", "XXXX-XXXX-5678"),
          ("+91-8765432198", "XXXX-XXXX-9012"),
          ("+91-8877665544", "XXXX-XXXX-3456"),
          ("+91-6655443322", "XXXX-XXXX-7890"),
          ("+91-5005443322", "XXXX-XXXX-1234"),
        ]
        for phone, bank in phone_bank_pairs:
            p_ent = entity_by_value.get(phone)
            b_ent = entity_by_value.get(bank)
            if p_ent and b_ent:
                links_data.append(EntityLink(entity_a_id=p_ent.id, entity_b_id=b_ent.id, link_type="linked_account", weight=0.85))

        # Cross-linked phone numbers
        cross_links = [
          ("+91-9876543210", "+91-3322110099"),
          ("+91-9123456780", "+91-5005443322"),
          ("+91-9123456780", "+91-2211009988"),
          ("+91-6655443322", "+91-9876543210"),
        ]
        for phone_a, phone_b in cross_links:
            ent_a = entity_by_value.get(phone_a)
            ent_b = entity_by_value.get(phone_b)
            if ent_a and ent_b:
                links_data.append(EntityLink(entity_a_id=ent_a.id, entity_b_id=ent_b.id, link_type="associated", weight=0.7))

        # UPI IDs to bank accounts
        upi_bank_pairs = [
          ("scammer@upi", "XXXX-XXXX-1234"),
          ("fraudster@paytm", "XXXX-XXXX-5678"),
          ("fakeofficer@gpay", "XXXX-XXXX-9012"),
          ("verify_quick@ybl", "XXXX-XXXX-3456"),
        ]
        for upi, bank in upi_bank_pairs:
            u_ent = entity_by_value.get(upi)
            b_ent = entity_by_value.get(bank)
            if u_ent and b_ent:
                links_data.append(EntityLink(entity_a_id=u_ent.id, entity_b_id=b_ent.id, link_type="uses_account", weight=0.8))

        for link in links_data:
            db.add(link)

        # 4. Seed Victim Reports
        for rep in VICTIM_REPORTS:
            db_rep = VictimReport(
                location=f"POINT({rep['longitude']} {rep['latitude']})",
                report_type=rep["reportType"],
                severity=rep["severity"]
            )
            # Add state_code if the schema supports it. Wait, the SQLAlchemy model has state_code? Let's check models.py
            # Let's check models.py VictimReport:
            # class VictimReport(Base):
            #     __tablename__ = "victim_reports"
            #     id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
            #     location = Column(Geography(geometry_type='POINT', srid=4326))
            #     report_type = Column(String)
            #     severity = Column(Integer, default=1)
            #     reported_at = Column(DateTime, default=datetime.utcnow)
            #     related_call_session_id = Column(UUID(as_uuid=True), ForeignKey("call_sessions.id"))
            #     created_at = Column(DateTime, default=datetime.utcnow)
            # Wait! The model does NOT have state_code! But nextjs database does?
            # Oh, the geo/hotspots/route.ts in nextjs checks `report.stateCode`.
            # Wait, how does it check `report.stateCode` if it's not in the database?
            # Ah, in Python model, there is no state_code in VictimReport!
            # Wait, but wait! Let's check geo_service.py in backend.
            # In geo_service.py:
            # cutoff = datetime.utcnow() - timedelta(days=days)
            # results = db.query(func.ST_AsGeoJSON(VictimReport.location).label("geom"), func.count(VictimReport.id).label("count")).filter(VictimReport.reported_at >= cutoff).group_by(VictimReport.location).all()
            # It just counts reports per location! It doesn't use state_code.
            # In see-how's GET hotspots route:
            # It groups reports by report.stateCode and counts them, and maps the states to CITY_COORDINATES to get cities and coordinates!
            # Since in our Python model, VictimReport stores the actual Geography location POINT directly, we can write a python geo service that either uses the location geographic coordinates to find the nearest Indian city, or we can just parse the coordinates from the geometry column, or we can hardcode the hotspot states based on the locations!
            # Let's check: if we extract coordinates from VictimReport.location using GeoAlchemy2/PostGIS:
            # `func.ST_X(VictimReport.location)` and `func.ST_Y(VictimReport.location)`!
            # And then we can match them back to our city coordinates dictionary to find which city/state it belongs to!
            # This is extremely elegant and doesn't require state_code to be in VictimReport!
            # Let's design that: WKT contains the exact coordinates of Delhi, Bangalore, Mumbai, etc.
            # So in the DB query, we query WKT or longitude/latitude, and map it.
            # Yes! This is perfect!
            db.add(db_rep)

        db.commit()
        return {
            "success": True,
            "sessions": len(SAMPLE_SESSIONS),
            "entities": len(SAMPLE_ENTITIES),
            "links": len(links_data),
            "reports": len(VICTIM_REPORTS),
            "signals": signal_count
        }
    except Exception as e:
        db.rollback()
        return {"error": "Failed to seed database", "details": str(e)}
