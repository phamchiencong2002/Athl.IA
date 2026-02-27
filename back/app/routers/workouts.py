from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Account, Exercise, WorkoutSession
from app.schemas import GenerateProgramIn, ProgramOut, SessionFeedbackIn, SessionOut
from app.services.program_service import ensure_seed_exercises, generate_program

router = APIRouter(prefix="/workouts", tags=["workouts"])


@router.post("/programs/generate", response_model=ProgramOut)
def create_program(payload: GenerateProgramIn, db: Session = Depends(get_db)) -> ProgramOut:
    account = db.query(Account).filter(Account.id == payload.account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    ensure_seed_exercises(db)
    program = generate_program(db, payload.account_id, payload.goal, payload.week_availability)
    sessions = (
        db.query(WorkoutSession)
        .filter(WorkoutSession.program_id == program.id)
        .order_by(WorkoutSession.session_date.asc())
        .all()
    )

    return ProgramOut(
        id=program.id,
        title=program.title,
        goal=program.goal,
        sessions=[
            SessionOut(
                id=s.id,
                name=s.name,
                session_date=s.session_date,
                planned_duration_min=s.planned_duration_min,
                planned_intensity=s.planned_intensity,
                adjusted_intensity=s.adjusted_intensity,
                status=s.status,
            )
            for s in sessions
        ],
    )


@router.get("/sessions/today")
def get_today_session(account_id: str, db: Session = Depends(get_db)) -> dict:
    session = (
        db.query(WorkoutSession)
        .filter(WorkoutSession.account_id == account_id, WorkoutSession.session_date == date.today())
        .order_by(WorkoutSession.id.asc())
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="No session for today")

    return {
        "id": session.id,
        "name": session.name,
        "planned_duration_min": session.planned_duration_min,
        "planned_intensity": session.planned_intensity,
        "adjusted_intensity": session.adjusted_intensity,
        "status": session.status,
    }


@router.post("/sessions/{session_id}/complete")
def complete_session(session_id: str, payload: SessionFeedbackIn, db: Session = Depends(get_db)) -> dict:
    session = db.query(WorkoutSession).filter(WorkoutSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    session.status = "done"
    session.rpe_reported = payload.rpe_reported
    session.notes = payload.notes
    db.commit()
    db.refresh(session)

    return {
        "id": session.id,
        "status": session.status,
        "rpe_reported": session.rpe_reported,
        "notes": session.notes,
    }


@router.get("/sessions")
def list_sessions(account_id: str, db: Session = Depends(get_db)) -> list[dict]:
    sessions = (
        db.query(WorkoutSession)
        .filter(WorkoutSession.account_id == account_id)
        .order_by(WorkoutSession.session_date.desc())
        .all()
    )
    return [
        {
            "id": s.id,
            "name": s.name,
            "session_date": s.session_date.isoformat(),
            "planned_duration_min": s.planned_duration_min,
            "planned_intensity": s.planned_intensity,
            "adjusted_intensity": s.adjusted_intensity,
            "status": s.status,
            "rpe_reported": s.rpe_reported,
        }
        for s in sessions
    ]


@router.get("/exercises")
def list_exercises(db: Session = Depends(get_db)) -> list[dict]:
    ensure_seed_exercises(db)
    exercises = db.query(Exercise).order_by(Exercise.name.asc()).all()
    return [
        {
            "id": ex.id,
            "name": ex.name,
            "category": ex.category,
            "muscle_groups": ex.muscle_groups,
            "equipment": ex.equipment,
            "duration_min": ex.duration_min,
        }
        for ex in exercises
    ]
