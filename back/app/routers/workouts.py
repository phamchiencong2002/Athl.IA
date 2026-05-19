from datetime import date
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, joinedload

from app.db.session import get_db
from app.models import Account, Exercise, Injury, SessionExercise, UserProfile, WorkoutSession
from app.schemas import GenerateProgramIn, ProgramOut, SessionExerciseOut, SessionFeedbackIn, SessionOut
from app.services.program_service import ensure_seed_exercises, generate_program, get_fallback_exercises

router = APIRouter(prefix="/workouts", tags=["workouts"])


def _session_exercises_out(session: WorkoutSession) -> list[SessionExerciseOut]:
    return [
        SessionExerciseOut(
            id=ex.id,
            order_index=ex.order_index,
            name=ex.name,
            sets=ex.sets,
            reps=ex.reps,
            equipment=ex.equipment,
            muscle_groups=ex.muscle_groups,
            notes=ex.notes,
        )
        for ex in session.exercises
    ]


def _session_out(s: WorkoutSession) -> SessionOut:
    return SessionOut(
        id=s.id,
        name=s.name,
        session_date=s.session_date,
        planned_duration_min=s.planned_duration_min,
        planned_intensity=s.planned_intensity,
        adjusted_intensity=s.adjusted_intensity,
        status=s.status,
        notes=s.notes,
        exercises=_session_exercises_out(s),
    )



def _populate_missing_exercises(session: WorkoutSession, db: Session, *, commit: bool = True) -> None:
    """Generate and persist exercises for a session that has none stored.

    This fixes sessions created when the AI returned empty exercise lists.
    """
    if session.exercises:
        return
    session_index = session.session_date.weekday() if session.session_date else 0
    items = get_fallback_exercises(goal="fitness", session_index=session_index)
    for order, ex in enumerate(items):
        db.add(
            SessionExercise(
                id=str(uuid4()),
                session_id=session.id,
                order_index=order,
                name=ex.name,
                sets=ex.sets,
                reps=ex.reps,
                equipment=ex.equipment or None,
                muscle_groups=ex.muscle_groups or None,
                notes=ex.notes or None,
            )
        )
    if commit:
        db.commit()


@router.post("/programs/generate", response_model=ProgramOut)
def create_program(payload: GenerateProgramIn, db: Session = Depends(get_db)) -> ProgramOut:
    account = db.query(Account).filter(Account.id == payload.account_id).first()
    if not account:
        raise HTTPException(status_code=404, detail="Account not found")

    ensure_seed_exercises(db)
    profile = db.query(UserProfile).filter(UserProfile.account_id == payload.account_id).first()
    injuries = (
        db.query(Injury)
        .filter(Injury.account_id == payload.account_id, Injury.is_active.is_(True))
        .order_by(Injury.created_at.desc())
        .all()
    )
    program = generate_program(
        db,
        payload.account_id,
        payload.goal,
        payload.week_availability,
        profile=profile,
        injuries=injuries,
    )
    sessions = (
        db.query(WorkoutSession)
        .options(joinedload(WorkoutSession.exercises))
        .filter(WorkoutSession.program_id == program.id)
        .order_by(WorkoutSession.session_date.asc())
        .all()
    )

    return ProgramOut(
        id=program.id,
        title=program.title,
        goal=program.goal,
        sessions=[_session_out(s) for s in sessions],
    )


@router.get("/sessions/today")
def get_today_session(account_id: str, db: Session = Depends(get_db)) -> dict:
    session = (
        db.query(WorkoutSession)
        .options(joinedload(WorkoutSession.exercises))
        .filter(WorkoutSession.account_id == account_id, WorkoutSession.session_date == date.today())
        .order_by(WorkoutSession.id.asc())
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="No session for today")

    if not session.exercises:
        session_id = session.id
        _populate_missing_exercises(session, db)
        session = (
            db.query(WorkoutSession)
            .options(joinedload(WorkoutSession.exercises))
            .filter(WorkoutSession.id == session_id)
            .first()
        ) or session

    return _session_out(session).model_dump()


@router.get("/sessions/next")
def get_next_session(account_id: str, db: Session = Depends(get_db)) -> dict:
    """Return the nearest upcoming planned session (today or future)."""
    session = (
        db.query(WorkoutSession)
        .options(joinedload(WorkoutSession.exercises))
        .filter(
            WorkoutSession.account_id == account_id,
            WorkoutSession.session_date >= date.today(),
            WorkoutSession.status == "planned",
        )
        .order_by(WorkoutSession.session_date.asc(), WorkoutSession.id.asc())
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="No upcoming session")

    if not session.exercises:
        session_id = session.id
        _populate_missing_exercises(session, db)
        session = (
            db.query(WorkoutSession)
            .options(joinedload(WorkoutSession.exercises))
            .filter(WorkoutSession.id == session_id)
            .first()
        ) or session

    return _session_out(session).model_dump()


@router.get("/sessions/{session_id}")
def get_session_by_id(session_id: str, db: Session = Depends(get_db)) -> dict:
    session = (
        db.query(WorkoutSession)
        .options(joinedload(WorkoutSession.exercises))
        .filter(WorkoutSession.id == session_id)
        .first()
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    if not session.exercises:
        _populate_missing_exercises(session, db)
        session = (
            db.query(WorkoutSession)
            .options(joinedload(WorkoutSession.exercises))
            .filter(WorkoutSession.id == session_id)
            .first()
        )

    return _session_out(session).model_dump()


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


class ExerciseUpdateIn(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    sets: int | None = None
    reps: str | None = Field(default=None, max_length=40)
    equipment: str | None = Field(default=None, max_length=80)
    muscle_groups: str | None = Field(default=None, max_length=120)
    notes: str | None = Field(default=None, max_length=500)


@router.put("/sessions/{session_id}/exercises")
def update_session_exercises(
    session_id: str,
    exercises: list[ExerciseUpdateIn],
    db: Session = Depends(get_db),
) -> dict:
    """Replace the exercise list for a session."""
    session = db.query(WorkoutSession).filter(WorkoutSession.id == session_id).first()
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    # Delete existing exercises
    db.query(SessionExercise).filter(SessionExercise.session_id == session_id).delete()

    # Insert new list
    for order, ex in enumerate(exercises):
        db.add(
            SessionExercise(
                id=str(uuid4()),
                session_id=session_id,
                order_index=order,
                name=ex.name,
                sets=ex.sets,
                reps=ex.reps,
                equipment=ex.equipment,
                muscle_groups=ex.muscle_groups,
                notes=ex.notes,
            )
        )

    db.commit()
    db.refresh(session)
    return {"exercises": [ex.model_dump() for ex in exercises]}


@router.get("/sessions")
def list_sessions(account_id: str, db: Session = Depends(get_db)) -> list[dict]:
    sessions = (
        db.query(WorkoutSession)
        .options(joinedload(WorkoutSession.exercises))
        .filter(WorkoutSession.account_id == account_id)
        .order_by(WorkoutSession.session_date.asc())
        .all()
    )
    # Auto-populate exercises for sessions that have none (e.g. AI-generated without exercises)
    sessions_needing_exercises = [s for s in sessions if not s.exercises]
    if sessions_needing_exercises:
        for s in sessions_needing_exercises:
            _populate_missing_exercises(s, db, commit=False)
        db.commit()
        # Re-query to get fresh sessions with exercises loaded
        sessions = (
            db.query(WorkoutSession)
            .options(joinedload(WorkoutSession.exercises))
            .filter(WorkoutSession.account_id == account_id)
            .order_by(WorkoutSession.session_date.asc())
            .all()
        )

    result = []
    for s in sessions:
        d = _session_out(s).model_dump()
        d["rpe_reported"] = s.rpe_reported
        result.append(d)
    return result


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
