from datetime import date
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from sqlalchemy.exc import IntegrityError

from app.db.session import get_db
from app.models import Account, ReadinessLog, UserProfile, WorkoutSession
from app.schemas import ReadinessIn, ReadinessOut
from app.services.adaptation import build_advice, compute_readiness_score, suggest_intensity

router = APIRouter(prefix="/readiness", tags=["readiness"])


@router.post("", response_model=ReadinessOut)
def submit_readiness(payload: ReadinessIn, db: Session = Depends(get_db)) -> ReadinessOut:
    account = db.query(Account).filter(Account.id == payload.account_id).first()
    if not account:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account not found — please log out and log back in",
        )

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

    try:
        db.commit()
    except IntegrityError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Readiness already submitted for today",
        ) from e

    return ReadinessOut(readiness_score=score, ai_advice=advice)


@router.get("/history")
def readiness_history(account_id: str, limit: int = 30, db: Session = Depends(get_db)) -> list[dict]:
    logs = (
        db.query(ReadinessLog)
        .filter(ReadinessLog.account_id == account_id)
        .order_by(ReadinessLog.log_date.desc())
        .limit(min(limit, 90))
        .all()
    )
    return [
        {
            "log_date": log.log_date.isoformat(),
            "sleep_hours": log.sleep_hours,
            "fatigue": log.fatigue,
            "stress": log.stress,
            "soreness": log.soreness,
            "pain_level": log.pain_level,
            "readiness_score": log.readiness_score,
            "ai_advice": log.ai_advice,
        }
        for log in logs
    ]


@router.get("/latest")
def latest_readiness(account_id: str, db: Session = Depends(get_db)) -> dict:
    log = (
        db.query(ReadinessLog)
        .filter(ReadinessLog.account_id == account_id)
        .order_by(ReadinessLog.log_date.desc())
        .first()
    )
    if not log:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No readiness log found")

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
