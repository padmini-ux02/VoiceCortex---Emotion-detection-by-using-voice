from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from app.core.database import get_db
from app.models.models import Prediction, User
from app.schemas.schemas import AIChatRequest, AIChatResponse
from app.api.deps import get_optional_current_user
from app.services.assistant import get_ai_assistant_insights

router = APIRouter()

@router.post("/chat", response_model=AIChatResponse)
def chat_with_assistant(
    req: AIChatRequest,
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_current_user)
):
    """
    Query the AI assistant regarding a specific speech emotion prediction.
    Provides targeted analysis explanation, wellness guidance, and communication suggestions.
    """
    pred = db.query(Prediction).filter(Prediction.id == req.prediction_id).first()
    if not pred:
        raise HTTPException(status_code=404, detail="Vocal prediction not found")
        
    # Security: If the prediction is owned by a user, check access rights
    if pred.user_id and (not current_user or pred.user_id != current_user.id):
        raise HTTPException(
            status_code=403,
            detail="Access denied: This prediction belongs to a registered account."
        )
        
    try:
        insights = get_ai_assistant_insights(pred, req.message)
        return AIChatResponse(
            response=insights["response"],
            wellness_tip=insights["wellness_tip"],
            communication_suggestion=insights["communication_suggestion"]
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred in the AI assistant service: {str(e)}"
        )
