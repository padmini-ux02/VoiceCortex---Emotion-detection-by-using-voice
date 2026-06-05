import datetime
from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, JSON, Float
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    full_name = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    predictions = relationship("Prediction", back_populates="user", cascade="all, delete-orphan")
    reports = relationship("Report", back_populates="user", cascade="all, delete-orphan")

class Prediction(Base):
    __tablename__ = "predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    audio_filename = Column(String, nullable=False)
    detected_emotion = Column(String, nullable=False)
    
    # Store analytics, features, and explainability maps as JSON objects
    confidence_scores = Column(JSON, nullable=False) # e.g. {"Happy": 0.85, ...}
    timeline_analysis = Column(JSON, nullable=True) # e.g. [{"time": 0.5, "emotion": "Happy", "confidence": 0.8}, ...]
    attention_weights = Column(JSON, nullable=True) # e.g. [0.01, 0.05, ...]
    feature_importance = Column(JSON, nullable=True) # e.g. {"MFCC": 25.5, ...}
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="predictions")
    reports = relationship("Report", back_populates="prediction", cascade="all, delete-orphan")

class Report(Base):
    __tablename__ = "reports"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    prediction_id = Column(Integer, ForeignKey("predictions.id", ondelete="CASCADE"), nullable=False)
    report_type = Column(String, nullable=False) # "pdf", "excel", "csv"
    file_path = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="reports")
    prediction = relationship("Prediction", back_populates="reports")
