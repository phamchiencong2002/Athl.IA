from datetime import date, timedelta
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models import Exercise, WorkoutProgram, WorkoutSession


DEFAULT_EXERCISES = [
    ("Squat poids du corps", "strength", "legs", "bodyweight", 35),
    ("Pompes", "strength", "chest", "bodyweight", 30),
    ("Gainage", "core", "core", "mat", 20),
    ("Course footing", "cardio", "full_body", "none", 40),
    ("Mobilite hanches", "mobility", "hips", "mat", 15),
]


def ensure_seed_exercises(db: Session) -> None:
    if db.query(Exercise).count() > 0:
        return
    for name, category, muscle_groups, equipment, duration in DEFAULT_EXERCISES:
        db.add(
            Exercise(
                id=str(uuid4()),
                name=name,
                category=category,
                muscle_groups=muscle_groups,
                equipment=equipment,
                duration_min=duration,
            )
        )
    db.commit()


def generate_program(
    db: Session,
    account_id: str,
    goal: str,
    week_availability: int,
) -> WorkoutProgram:
    program = WorkoutProgram(
        id=str(uuid4()),
        account_id=account_id,
        title=f"Plan {goal.title()} {week_availability}j/semaine",
        goal=goal,
        created_at=date.today(),
        active=True,
    )
    db.add(program)
    db.flush()

    base_intensity = 6 if goal.lower() in {"performance", "muscle"} else 5
    base_duration = 45 if goal.lower() in {"endurance", "performance"} else 35

    for i in range(week_availability):
        workout_date = date.today() + timedelta(days=i)
        db.add(
            WorkoutSession(
                id=str(uuid4()),
                program_id=program.id,
                account_id=account_id,
                name=f"Seance {i + 1} - {goal.title()}",
                session_date=workout_date,
                planned_duration_min=base_duration,
                planned_intensity=base_intensity,
                adjusted_intensity=base_intensity,
                status="planned",
                rpe_reported=None,
                notes=None,
            )
        )

    db.commit()
    db.refresh(program)
    return program
