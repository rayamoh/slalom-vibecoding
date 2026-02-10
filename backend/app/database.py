"""Database connection and session management."""

from typing import Generator

from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import Session, sessionmaker

from app.config import settings

# Create database engine
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False} if "sqlite" in settings.DATABASE_URL else {},
    echo=settings.DEBUG,
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for ORM models
Base = declarative_base()


def get_db() -> Generator[Session, None, None]:
    """
    Dependency function to get database session.
    
    Yields:
        Session: SQLAlchemy database session
        
    Example:
        @app.get("/alerts")
        def get_alerts(db: Session = Depends(get_db)):
            return db.query(Alert).all()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db() -> None:
    """Initialize database by creating all tables."""
    Base.metadata.create_all(bind=engine)
