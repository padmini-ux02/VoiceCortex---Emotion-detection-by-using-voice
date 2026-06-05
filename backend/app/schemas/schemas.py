from pydantic import BaseModel, EmailStr, Field
from typing import Dict, List, Optional
from datetime import datetime

# --- User Schemas ---
class UserBase(BaseModel):
    email: EmailStr
    full_name: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=6)

class UserOut(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class UserLogin(BaseModel):
    email: EmailStr
    password: str

# --- Token Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    user_id: Optional[str] = None

# --- Prediction Schemas ---
class PredictionOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    audio_filename: str
    detected_emotion: str
    confidence_scores: Dict[str, float]
    timeline_analysis: Optional[List[dict]] = None
    attention_weights: Optional[List[float]] = None
    feature_importance: Optional[Dict[str, float]] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Report Schemas ---
class ReportOut(BaseModel):
    id: int
    user_id: int
    prediction_id: int
    report_type: str
    file_path: str
    created_at: datetime

    class Config:
        from_attributes = True

# --- AI Assistant Schemas ---
class AIChatRequest(BaseModel):
    prediction_id: int
    message: str

class AIChatResponse(BaseModel):
    response: str
    wellness_tip: str
    communication_suggestion: str
