import uvicorn
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.database import engine, Base
from app.api.auth import router as auth_router
from app.api.predict import router as predict_router
from app.api.reports import router as reports_router
from app.api.assistant import router as assistant_router

# Create DB tables automatically on startup (SQLite or PostgreSQL if active)
try:
    Base.metadata.create_all(bind=engine)
    print("Database tables initialized successfully.")
except Exception as e:
    print(f"Warning: Could not create database tables on startup. Proceeding... Error: {e}")

# Rate limiter setup
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Attach rate limiter to app state and error handlers
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS Policy configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this to specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API routes mount
app.include_router(auth_router, prefix=f"{settings.API_V1_STR}/auth", tags=["Authentication"])
app.include_router(predict_router, prefix=f"{settings.API_V1_STR}/audio", tags=["Vocal Predictions"])
app.include_router(reports_router, prefix=f"{settings.API_V1_STR}/reports", tags=["Export Reports"])
app.include_router(assistant_router, prefix=f"{settings.API_V1_STR}/assistant", tags=["AI Wellness Advisor"])

@app.get("/")
def read_root():
    return {
        "status": "online",
        "service": "VoiceCortex Engine",
        "documentation": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
