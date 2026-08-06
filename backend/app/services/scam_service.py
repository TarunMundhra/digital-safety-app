import re
import json
import logging
import redis
from sqlalchemy.orm import Session
from app.db.models import CallSession, ScamSignal, Entity
from fastembed import TextEmbedding
import numpy as np
from app.core.config import settings

logger = logging.getLogger(__name__)

# Phase 11: Redis cache for known-bad lookups.
# Best-effort only: the cache is a pure optimization, so any Redis failure
# (unreachable host, archived Upstash DB, timeout) degrades to a normal
# recompute instead of crashing the request. Short socket timeouts fail fast.
try:
    redis_client = redis.from_url(
        settings.REDIS_URL,
        socket_connect_timeout=2,
        socket_timeout=2,
    )
except Exception as exc:  # malformed REDIS_URL etc.
    logger.warning("Redis client init failed, caching disabled: %s", exc)
    redis_client = None


def cache_is_known_bad(cache_key: str) -> bool:
    if redis_client is None:
        return False
    try:
        return bool(redis_client.exists(cache_key))
    except redis.RedisError as exc:
        logger.warning("Redis lookup failed, treating as cache miss: %s", exc)
        return False


def cache_flag_known_bad(cache_key: str, ttl: int = 3600) -> None:
    if redis_client is None:
        return
    try:
        redis_client.setex(cache_key, ttl, "high_risk")
    except redis.RedisError as exc:
        logger.warning("Redis write failed, skipping cache: %s", exc)


def cache_ping() -> str:
    """Best-effort cache status for health checks: 'up' | 'down' | 'disabled'."""
    if redis_client is None:
        return "disabled"
    try:
        redis_client.ping()
        return "up"
    except redis.RedisError:
        return "down"

# Phase 3: FastEmbed (ONNX, CPU-friendly, no PyTorch)
embedding_model = TextEmbedding(model_name="BAAI/bge-small-en-v1.5")

# Synthetic known scam corpus (in reality, queried from DB)
known_scam_phrases = [
    "passage: This is CBI officer speaking, there is a warrant for your arrest.",
    "passage: Your Aadhaar number is linked to illegal activities, you will be arrested.",
    "passage: You need to pay a fine to avoid customs arrest at the airport."
]
known_scam_embeddings = list(embedding_model.embed(known_scam_phrases))

def extract_signals(transcript: str, is_video: bool, duration: int) -> list:
    signals = []
    transcript_lower = transcript.lower()
    
    if re.search(r'\b(cbi|ed|enforcement directorate|customs|rbi|police)\b', transcript_lower):
        signals.append({"signal_type": "IMPERSONATION", "detail": "Claimed official identity", "weight": 30.0})
    if re.search(r'arrest|jail|custody|warrant', transcript_lower):
        signals.append({"signal_type": "THREAT_ARREST", "detail": "Threat of legal action/arrest", "weight": 25.0})
    if re.search(r'otp|upi|pay|transfer|account|verify', transcript_lower):
        signals.append({"signal_type": "FINANCIAL_DEMAND", "detail": "Requested financial info/transaction", "weight": 25.0})
    if is_video and duration > 600:
        signals.append({"signal_type": "VIDEO_COERCION", "detail": "Long video call (digital arrest setup)", "weight": 20.0})
        
    return signals

def calculate_embedding_score(transcript: str) -> float:
    # Phase 3: Prefix with "query: " for best retrieval accuracy
    query_text = f"query: {transcript}"
    embedding = list(embedding_model.embed([query_text]))[0]
    
    similarities = np.dot(known_scam_embeddings, embedding) / (
        np.linalg.norm(known_scam_embeddings, axis=1) * np.linalg.norm(embedding)
    )
    max_sim = np.max(similarities)
    return max_sim * 50.0

def analyze_session(db: Session, transcript: str, caller_number: str, is_video: bool, duration: int, state_code: str = "DL") -> dict:
    # Phase 11: Check Redis cache first for known-bad actor
    cache_key = f"known_bad:{caller_number}"
    if cache_is_known_bad(cache_key):
        risk_score = 95.0
        recommendation = "Immediate escalation (Cached known-bad actor)"
    else:
        signals_data = extract_signals(transcript, is_video, duration)
        embedding_score = calculate_embedding_score(transcript)
        
        rule_score = sum(s["weight"] for s in signals_data)
        risk_score = min(100.0, rule_score + embedding_score)
        recommendation = "Immediate escalation to Cybercrime unit" if risk_score > 80 else "Monitor"
        
        # Cache if high risk (best-effort)
        if risk_score > 80:
            cache_flag_known_bad(cache_key)

    db_session = CallSession(
        caller_number=caller_number,
        state_code=state_code,
        transcript_text=transcript,
        is_video=is_video,
        duration_seconds=duration,
        risk_score=risk_score
    )
    db.add(db_session)
    db.flush()
    
    if 'signals_data' in locals():
        for sig in signals_data:
            db_signal = ScamSignal(call_session_id=db_session.id, **sig)
            db.add(db_signal)
            
    db.commit()
    
    return {
        "session_id": str(db_session.id),
        "risk_score": risk_score,
        "matched_signals": locals().get('signals_data', []),
        "recommendation": recommendation
    }