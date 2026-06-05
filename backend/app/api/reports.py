import os
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.core.config import settings
from app.core.database import get_db
from app.models.models import Prediction, Report
from app.api.deps import get_current_user
from app.services.reports import generate_pdf_report, generate_excel_history, generate_csv_history

router = APIRouter()

# Directory for storing generated reports
REPORTS_DIR = os.path.join(settings.UPLOAD_DIR, "reports")
os.makedirs(REPORTS_DIR, exist_ok=True)

@router.get("/pdf/{prediction_id}")
def download_pdf(
    prediction_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Generate and download a PDF report containing emotion analytics, XAI metrics,
    and mental wellness/communication insights.
    """
    pred = db.query(Prediction).filter(Prediction.id == prediction_id, Prediction.user_id == current_user.id).first()
    if not pred:
        raise HTTPException(status_code=404, detail="Prediction analysis not found")
        
    filename = f"report_VoiceCortex_{prediction_id}.pdf"
    pdf_path = os.path.join(REPORTS_DIR, filename)
    
    try:
        generate_pdf_report(pred, current_user, pdf_path)
        
        # Save report log in DB
        report_log = db.query(Report).filter(Report.prediction_id == prediction_id, Report.report_type == "pdf").first()
        if not report_log:
            report_log = Report(
                user_id=current_user.id,
                prediction_id=prediction_id,
                report_type="pdf",
                file_path=pdf_path
            )
            db.add(report_log)
            db.commit()
            
        return FileResponse(
            path=pdf_path,
            filename=f"VoiceCortex_Report_{prediction_id}.pdf",
            media_type="application/pdf"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while generating the PDF report: {str(e)}"
        )

@router.get("/excel")
def download_excel(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Generate and download an Excel spreadsheet containing history data.
    """
    predictions = db.query(Prediction).filter(Prediction.user_id == current_user.id).order_by(Prediction.created_at.desc()).all()
    if not predictions:
        raise HTTPException(status_code=404, detail="No prediction logs found to export.")
        
    filename = f"VoiceCortex_history_{current_user.id}.xlsx"
    excel_path = os.path.join(REPORTS_DIR, filename)
    
    try:
        generate_excel_history(predictions, excel_path)
        return FileResponse(
            path=excel_path,
            filename="VoiceCortex_Export.xlsx",
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while generating the Excel report: {str(e)}"
        )

@router.get("/csv")
def download_csv(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user)
):
    """
    Generate and download a CSV table containing prediction history.
    """
    predictions = db.query(Prediction).filter(Prediction.user_id == current_user.id).order_by(Prediction.created_at.desc()).all()
    if not predictions:
        raise HTTPException(status_code=404, detail="No prediction logs found to export.")
        
    filename = f"VoiceCortex_history_{current_user.id}.csv"
    csv_path = os.path.join(REPORTS_DIR, filename)
    
    try:
        generate_csv_history(predictions, csv_path)
        return FileResponse(
            path=csv_path,
            filename="VoiceCortex_Export.csv",
            media_type="text/csv"
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"An error occurred while generating the CSV export: {str(e)}"
        )
