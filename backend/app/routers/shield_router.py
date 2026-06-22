import re
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.db.models import CallSession, ScamSignal

router = APIRouter()

class ShieldRequest(BaseModel):
    description: str

SIGNAL_PATTERNS = [
    {
        "type": "IMPERSONATION",
        "patterns": [r'\bcbi\b', r'\bed\b', r'\benforcement directorate\b', r'\bcustoms\b', r'\brbi\b', r'\breserve bank\b', r'\bpolice\b', r'\bcyber crime\b', r'\bit department\b', r'\bincome tax\b', r'\bnarcotics\b'],
        "weight": 30,
        "description": "Impersonation of government authority"
    },
    {
        "type": "THREAT_ARREST",
        "patterns": [r'\barrest', r'\bjail\b', r'\bcustody\b', r'\bwarrant\b', r'\bimprison', r'\bdetain', r'\bremand\b', r'\bbehind bars\b'],
        "weight": 25,
        "description": "Threat of arrest or detention"
    },
    {
        "type": "FINANCIAL_DEMAND",
        "patterns": [r'\botp\b', r'\bupi\b', r'\bpay\b', r'\btransfer\b', r'\baccount\b', r'\bverify\b', r'\bgpay\b', r'\bgoogle pay\b', r'\bphonepe\b', r'\bpaytm\b', r'\bneft\b', r'\bimps\b', r'\brtgs\b'],
        "weight": 25,
        "description": "Financial demand or payment instruction"
    },
    {
        "type": "URGENCY",
        "patterns": [r'\bimmediately\b', r'\bright now\b', r'\burgent\b', r'\btoday\b', r'\bwithin 24 hours\b', r'\bdon\'?t tell anyone\b', r'\bdo not tell\b', r'\bkeep it secret\b', r'\bno one should know\b', r'\bact fast\b'],
        "weight": 15,
        "description": "Urgency or secrecy pressure"
    },
    {
        "type": "PERSONAL_INFO",
        "patterns": [r'\baadhaar\b', r'\bpan\b', r'\bbank details\b', r'\batm pin\b', r'\bcvv\b', r'\bcard number\b', r'\bpin\b', r'\bkyc\b', r'\bpassport\b'],
        "weight": 20,
        "description": "Request for sensitive personal information"
    },
    {
        "type": "COURTS",
        "patterns": [r'\bcourt\b', r'\bjudge\b', r'\bfir\b', r'\bcase filed\b', r'\bsued\b', r'\blitigation\b', r'\bjudicial\b', r'\bmagistrate\b'],
        "weight": 20,
        "description": "Reference to legal/court proceedings"
    },
    {
        "type": "DIGITAL_ARREST",
        "patterns": [r'\bdigital arrest\b', r'\bstay on video\b', r'\bdon\'?t disconnect\b', r'\bkeep line open\b', r'\bdo not disconnect\b', r'\bdon\'?t turn off\b', r'\bvideo surveillance\b', r'\bunder observation\b', r'\bhouse arrest\b'],
        "weight": 35,
        "description": "Digital arrest coercion tactics"
    }
]

def analyze_transcript_nlp(transcript: str):
    matched_signals = []
    risk_score = 0
    transcript_lower = transcript.lower()

    for pattern_group in SIGNAL_PATTERNS:
        matched_terms = []
        for pattern in pattern_group["patterns"]:
            matches = re.findall(pattern, transcript_lower)
            if matches:
                matched_terms.extend(matches)
        
        if matched_terms:
            unique_terms = list(set(matched_terms))
            matched_signals.append({
                "signalType": pattern_group["type"],
                "description": pattern_group["description"],
                "weight": pattern_group["weight"],
                "matchedTerms": unique_terms
            })
            risk_score += pattern_group["weight"]

    return matched_signals, min(100.0, risk_score)

def get_threat_level(score: float) -> str:
    if score > 80: return "CRITICAL"
    if score > 50: return "HIGH"
    if score > 25: return "MEDIUM"
    return "LOW"

def get_verdict(score: float) -> str:
    if score > 70: return "⚠️ HIGH RISK: This appears to be a Digital Arrest Scam."
    if score > 40: return "⚠️ MODERATE RISK: Suspicious patterns detected."
    return "✅ LOW RISK: No major scam indicators found."

def get_next_steps(score: float) -> str:
    if score > 70:
        steps = [
          "1. Do NOT share any OTP, UPI PIN, or bank details with the caller.",
          "2. Disconnect the call immediately — real agencies never make such calls.",
          "3. Do not install any remote access apps (AnyDesk, TeamViewer) they may suggest.",
          "4. Report the incident to the Cyber Crime Helpline: call 1930 or visit cybercrime.gov.in.",
          "5. Inform your bank and block any transactions if you have already shared details.",
          "6. File a complaint at your nearest police station with the caller's number and details."
        ]
    elif score > 40:
        steps = [
          "1. Be cautious — some suspicious patterns were detected in the description.",
          "2. Do not share OTP, PIN, or personal financial information.",
          "3. Verify any claims by calling the official agency directly (not the number that called you).",
          "4. If the caller becomes threatening, disconnect and report to 1930.",
          "5. Monitor your bank accounts for any unauthorized transactions."
        ]
    else:
        steps = [
          "1. Stay vigilant and do not share personal information with unknown callers.",
          "2. Remember: Government agencies never ask for OTP or payment over phone calls.",
          "3. If in doubt, verify the caller's identity by contacting the agency directly.",
          "4. Report suspicious calls to 1930 (Cyber Crime Helpline) if they recur."
        ]
    return "\n".join(steps)

@router.post("/check")
def check_scam(req: ShieldRequest, db: Session = Depends(get_db)):
    matched_signals, risk_score = analyze_transcript_nlp(req.description)
    
    threat_level = get_threat_level(risk_score)
    verdict = get_verdict(risk_score)
    next_steps = get_next_steps(risk_score)
    
    # Identify claimed identity from impersonation signals
    claimed_identity = None
    impersonation_signals = [s for s in matched_signals if s["signalType"] == "IMPERSONATION"]
    if impersonation_signals:
        claimed_identity = f"Claimed {impersonation_signals[0]['matchedTerms'][0].upper()} officer"
        
    # Store anonymously in the database
    db_session = CallSession(
        caller_number="ANONYMOUS_CITIZEN",
        state_code="UNKNOWN",
        claimed_identity=claimed_identity,
        duration_seconds=0,
        is_video=False,
        transcript_text=req.description,
        risk_score=risk_score,
        status="citizen_check"
    )
    db.add(db_session)
    db.flush() # Populate ID
    
    for sig in matched_signals:
        db_signal = ScamSignal(
            call_session_id=db_session.id,
            signal_type=sig["signalType"],
            detail=f"{sig['description']}: {', '.join(sig['matchedTerms'])}",
            weight=float(sig["weight"])
        )
        db.add(db_signal)
        
    db.commit()
    
    return {
        "verdict": verdict,
        "nextSteps": next_steps,
        "riskScore": risk_score,
        "matchedSignals": [
            {
                "signalType": sig["signalType"],
                "detail": f"{sig['description']}: {', '.join(sig['matchedTerms'])}",
                "weight": sig["weight"]
            } for sig in matched_signals
        ],
        "threatLevel": threat_level
    }