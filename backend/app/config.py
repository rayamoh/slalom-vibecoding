"""Application configuration and settings."""

from functools import lru_cache
from typing import List

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # API Settings
    PROJECT_NAME: str = "Fraud Detection API"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api"
    DEBUG: bool = False

    # Database
    DATABASE_URL: str = "sqlite:///./fraud_detection.db"

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    @property
    def cors_origins(self) -> List[str]:
        """Parse comma-separated CORS origins."""
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",")]

    # Pagination
    DEFAULT_PAGE_SIZE: int = 25
    MAX_PAGE_SIZE: int = 100

    # ML Scoring
    ML_SERVICE_URL: str = "http://localhost:8001"
    ML_MODEL_PATH: str = "../models/fraud_detector_v1.pkl"
    SCORING_TIMEOUT: int = 30
    USE_MOCK_SCORING: bool = True

    # File Upload
    MAX_UPLOAD_SIZE_MB: int = 10

    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"

    # Security (Phase 2)
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    JWT_SECRET_KEY: str = "dev-jwt-secret-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # Dataset
    DATASET_PATH: str = "../dataset/Synthetic_Financial_datasets_log.csv"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="allow",
    )


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance."""
    return Settings()


# Global settings instance
settings = get_settings()
