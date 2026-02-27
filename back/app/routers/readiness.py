from datetime import date
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import ReadinessLog, UserProfile, WorkoutSession
from app.schemas import ReadinessIn, ReadinessOut
from app.services.adaptation import build_advice, compute_readiness_score, suggest_intensity

router = APIRouter(prefix="/readiness", tags=["readiness"])


@router.post("", response_model=ReadinessOut)
def submit_readiness(payload: ReadinessIn, db: Session = Depends(get_db)) -> ReadinessOut:
    profile = db.query(UserProfile).filter(UserProfile.account_id == payload.account_id).first()

    score = compute_readiness_score(
        payload.sleep_hours,
        payload.fatigue,
        payload.stress,
        payload.soreness,
        payload.pain_level,
    )
    advice = build_advice(score, payload.pain_level)

    log = ReadinessLog(
        id=str(uuid4()),
        account_id=payload.account_id,
        profile_id=profile.id if profile else None,
        log_date=date.today(),
        sleep_hours=payload.sleep_hours,
        fatigue=payload.fatigue,
        stress=payload.stress,
        soreness=payload.soreness,
        pain_level=payload.pain_level,
        readiness_score=score,
        ai_advice=advice,
    )
    db.add(log)

    today_sessions = (
        db.query(WorkoutSession)
        .filter(WorkoutSession.account_id == payload.account_id, WorkoutSession.session_date == date.today())
        .all()
    )
    for session in today_sessions:
        session.adjusted_intensity = suggest_intensity(
            session.planned_intensity,
            score,
            payload.pain_level,
        )

    db.commit()

    return ReadinessOut(readiness_score=score, ai_advice=advice)


@router.get("/latest")
def latest_readiness(account_id: str, db: Session = Depends(get_db)) -> dict:
    log = (
        db.query(ReadinessLog)
        .filter(ReadinessLog.account_id == account_id)
        .order_by(ReadinessLog.log_date.desc())
        .first()
    )
    if not log:
        raise HTTPException(status_code=404, detail="No readiness found")

    return {
        "log_date": log.log_date.isoformat(),
        "sleep_hours": log.sleep_hours,
        "fatigue": log.fatigue,
        "stress": log.stress,
        "soreness": log.soreness,
        "pain_level": log.pain_level,
        "readiness_score": log.readiness_score,
        "ai_advice": log.ai_advice,
    }
