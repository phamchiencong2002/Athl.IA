from datetime import date, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import ReadinessLog, WorkoutSession


def compute_progress(db: Session, account_id: str) -> dict[str, float]:
    total_sessions = (
        db.query(func.count(WorkoutSession.id))
        .filter(WorkoutSession.account_id == account_id)
        .scalar()
        or 0
    )
    completed_sessions = (
        db.query(func.count(WorkoutSession.id))
        .filter(WorkoutSession.account_id == account_id, WorkoutSession.status == "done")
        .scalar()
        or 0
    )
    average_rpe = (
        db.query(func.avg(WorkoutSession.rpe_reported))
        .filter(WorkoutSession.account_id == account_id, WorkoutSession.rpe_reported.is_not(None))
        .scalar()
        or 0
    )
    readiness_avg = (
        db.query(func.avg(ReadinessLog.readiness_score))
        .filter(ReadinessLog.account_id == account_id)
        .scalar()
        or 0
    )

    completion_rate = (completed_sessions / total_sessions * 100.0) if total_sessions else 0.0

    return {
        "completed_sessions": float(completed_sessions),
        "completion_rate": round(completion_rate, 2),
        "average_rpe": round(float(average_rpe), 2),
        "readiness_average": round(float(readiness_avg), 2),
    }


def compute_analytics(db: Session, account_id: str) -> dict[str, int | bool | None]:
    week_start = date.today() - timedelta(days=6)

    planned = (
        db.query(func.count(WorkoutSession.id))
        .filter(WorkoutSession.account_id == account_id, WorkoutSession.session_date >= week_start)
        .scalar()
        or 0
    )
    done = (
        db.query(func.count(WorkoutSession.id))
        .filter(
            WorkoutSession.account_id == account_id,
            WorkoutSession.session_date >= week_start,
            WorkoutSession.status == "done",
        )
        .scalar()
        or 0
    )

    last_readiness = (
        db.query(ReadinessLog)
        .filter(ReadinessLog.account_id == account_id)
        .order_by(ReadinessLog.log_date.desc())
        .first()
    )

    next_session = (
        db.query(WorkoutSession)
        .filter(
            WorkoutSession.account_id == account_id,
            WorkoutSession.session_date >= date.today(),
            WorkoutSession.status == "planned",
        )
        .order_by(WorkoutSession.session_date.asc())
        .first()
    )

    injury_risk = bool(last_readiness and (last_readiness.pain_level >= 7 or last_readiness.readiness_score < 30))

    return {
        "weekly_sessions_done": int(done),
        "weekly_sessions_planned": int(planned),
        "injury_risk_flag": injury_risk,
        "next_session_intensity": int(next_session.adjusted_intensity) if next_session else None,
    }
