from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://admin:admin@localhost:5432/psci_db"
    OLLAMA_URL: str = "http://localhost:11434"
    REDIS_URL: str = "redis://localhost:6379/0"

settings = Settings()