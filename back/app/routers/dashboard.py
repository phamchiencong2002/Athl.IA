from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_account
from app.db.session import get_db
from app.models import Account, ReadinessLog, WorkoutSession
from app.schemas import DashboardOut
from app.services.analytics_service import compute_analytics, compute_progress

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/summary", response_model=DashboardOut)
def summary(
    current: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> DashboardOut:
    account_id = current.id

    readiness_log = (
        db.query(ReadinessLog)
        .filter(ReadinessLog.account_id == account_id)
        .order_by(ReadinessLog.log_date.desc())
        .first()
    )

    today_session = (
        db.query(WorkoutSession)
        .filter(
            WorkoutSession.account_id == account_id,
            WorkoutSession.session_date == date.today(),
        )
        .first()
    )

    analytics = compute_analytics(db, account_id)
    progress = compute_progress(db, account_id)

    readiness_data = None
    if readiness_log:
        readiness_data = {
            "readiness_score": readiness_log.readiness_score,
            "ai_advice": readiness_log.ai_advice,
            "sleep_hours": readiness_log.sleep_hours,
            "fatigue": readiness_log.fatigue,
            "stress": readiness_log.stress,
            "soreness": readiness_log.soreness,
            "pain_level": readiness_log.pain_level,
            "log_date": readiness_log.log_date.isoformat(),
        }

    today_session_data = None
    if today_session:
        today_session_data = {
            "id": today_session.id,
            "name": today_session.name,
            "session_date": today_session.session_date,
            "planned_duration_min": today_session.planned_duration_min,
            "planned_intensity": today_session.planned_intensity,
            "adjusted_intensity": today_session.adjusted_intensity,
            "status": today_session.status,
        }

    return DashboardOut(
        user={"id": current.id, "username": current.username, "avatar": current.avatar},
        readiness=readiness_data,
        today_session=today_session_data,
        analytics=analytics,
        progress=progress,
    )
