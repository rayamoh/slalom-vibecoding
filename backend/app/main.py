"""Main FastAPI application entry point."""

from contextlib import asynccontextmanager
from datetime import datetime
from typing import Dict

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.config import settings
from app.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager for startup and shutdown events."""
    # Startup
    print(f"🚀 Starting {settings.PROJECT_NAME} v{settings.VERSION}")
    init_db()
    print("✅ Database initialized")
    yield
    # Shutdown
    print("👋 Shutting down application")


# Create FastAPI app
app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Fraud Detection API for mobile money transactions",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check() -> Dict:
    """
    Check if the API is running and healthy.
    
    Returns:
        Dict: Health status information
    """
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "timestamp": datetime.utcnow().isoformat(),
    }


# Root endpoint
@app.get("/", tags=["Root"])
async def root() -> Dict:
    """
    Root endpoint with API information.
    
    Returns:
        Dict: API welcome message and links
    """
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "version": settings.VERSION,
        "docs": "/docs",
        "health": "/health",
    }


# Import and include routers (will be created in subsequent tasks)
# from app.api import alerts, cases, entities, transactions, scoring
# app.include_router(alerts.router, prefix=f"{settings.API_V1_PREFIX}/alerts", tags=["Alerts"])
# app.include_router(cases.router, prefix=f"{settings.API_V1_PREFIX}/cases", tags=["Cases"])
# app.include_router(entities.router, prefix=f"{settings.API_V1_PREFIX}/entities", tags=["Entities"])
# app.include_router(transactions.router, prefix=f"{settings.API_V1_PREFIX}/transactions", tags=["Transactions"])
# app.include_router(scoring.router, prefix=f"{settings.API_V1_PREFIX}/score", tags=["Scoring"])


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower(),
    )
