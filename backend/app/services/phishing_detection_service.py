from sqlalchemy.orm import Session
from app.db.models import IntelligencePackage, FraudCluster
from rapidfuzz import fuzz
import requests
import json
import uuid

# Seed mock app store listings
MOCK_APP_STORE = [
    {"title": "SBI Quick - Personal Banking", "publisher": "State Bank of India", "is_official": True},
    {"title": "SBI Quick Rewards & Cash Support", "publisher": "Bonus Devs Inc", "is_official": False},
    {"title": "Paytm Wallet & UPI", "publisher": "Paytm", "is_official": True},
    {"title": "Paytem Cash Online Loans", "publisher": "ScamApps Ltd", "is_official": False},
]

def scan_app_listings(db: Session, bank_brand_names: list) -> list:
    flagged = []
    for brand in bank_brand_names:
        for app in MOCK_APP_STORE:
            score = fuzz.partial_ratio(brand.lower(), app["title"].lower())
            if score > 80.0 and not app["is_official"]:
                # Match cluster if it exists
                cluster = db.query(FraudCluster).filter(FraudCluster.label.ilike(f"%{brand}%")).first()
                cluster_id = cluster.id if cluster else None
                
                evidence = {
                    "app_title": app["title"],
                    "publisher": app["publisher"],
                    "similarity_score": float(score)
                }
                
                # Save intelligence package
                pkg = IntelligencePackage(
                    fraud_cluster_id=cluster_id,
                    package_hash=uuid.uuid4().hex,
                    evidence_type="lookalike_app",
                    evidence_details=json.dumps(evidence)
                )
                db.add(pkg)
                flagged.append(evidence)
    db.commit()
    return flagged

def scan_certificate_transparency(db: Session, bank_brand_names: list) -> list:
    flagged = []
    for brand in bank_brand_names:
        try:
            # Fetch from public crt.sh API (with timeout protection)
            url = f"https://crt.sh/?q={brand}&output=json"
            res = requests.get(url, timeout=5)
            if res.status_code == 200:
                certs = res.json()
                # Process first 5 results to avoid slow iterations
                for cert in certs[:5]:
                    domain = cert.get("name_value", "")
                    # Reject legitimate domains
                    if f"{brand.lower()}.co.in" in domain or f"{brand.lower()}.com" in domain:
                        continue
                        
                    cluster = db.query(FraudCluster).filter(FraudCluster.label.ilike(f"%{brand}%")).first()
                    cluster_id = cluster.id if cluster else None
                    
                    evidence = {
                        "domain": domain,
                        "issuer": cert.get("issuer_name", ""),
                        "crt_id": cert.get("id")
                    }
                    pkg = IntelligencePackage(
                        fraud_cluster_id=cluster_id,
                        package_hash=uuid.uuid4().hex,
                        evidence_type="phishing_cert",
                        evidence_details=json.dumps(evidence)
                    )
                    db.add(pkg)
                    flagged.append(evidence)
        except Exception:
            pass
    db.commit()
    return flagged
