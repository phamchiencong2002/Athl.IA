from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas import AnalyticsOut, ProgressOut
from app.services.analytics_service import compute_analytics, compute_progress

router = APIRouter(tags=["analytics"])


@router.get("/progress/{account_id}", response_model=ProgressOut)
def progress(account_id: str, db: Session = Depends(get_db)) -> ProgressOut:
    data = compute_progress(db, account_id)
    return ProgressOut(
        completed_sessions=int(data["completed_sessions"]),
        completion_rate=float(data["completion_rate"]),
        average_rpe=float(data["average_rpe"]),
        readiness_average=float(data["readiness_average"]),
    )


@router.get("/analytics/{account_id}", response_model=AnalyticsOut)
def analytics(account_id: str, db: Session = Depends(get_db)) -> AnalyticsOut:
    data = compute_analytics(db, account_id)
    return AnalyticsOut(**data)
