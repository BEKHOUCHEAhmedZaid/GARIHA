from pydantic_settings import BaseSettings
from typing import List
import os
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://gariha_user:gariha_pass@localhost:5432/gariha_db")

    # Google OAuth
    GOOGLE_CLIENT_ID: str = os.getenv("GOOGLE_CLIENT_ID", "")
    GOOGLE_CLIENT_SECRET: str = os.getenv("GOOGLE_CLIENT_SECRET", "")

    # JWT
    JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "gariha-super-secret-jwt-key")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRATION_MINUTES: int = int(os.getenv("JWT_EXPIRATION_MINUTES", "1440"))

    # Frontend
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")

    # Admin emails (comma-separated)
    ADMIN_EMAILS: str = os.getenv("ADMIN_EMAILS", "admin@gariha.com")

    @property
    def admin_emails_list(self) -> List[str]:
        return [e.strip() for e in self.ADMIN_EMAILS.split(",") if e.strip()]

    class Config:
        env_file = ".env"


settings = Settings()
