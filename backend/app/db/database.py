from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

def clean_db_url(url: str) -> str:
    return url.replace("?pgbouncer=true", "").replace("&pgbouncer=true", "")

db_url = clean_db_url(settings.DATABASE_URL)
engine = create_engine(db_url)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
