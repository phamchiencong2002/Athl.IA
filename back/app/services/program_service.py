from datetime import date, datetime, timedelta
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

# Training days within the week (0=Mon, ..., 6=Sun) based on weekly frequency
_WEEKLY_SCHEDULE: dict[int, list[int]] = {
    1: [0],
    2: [0, 3],
    3: [0, 2, 4],
    4: [0, 1, 3, 4],
    5: [0, 1, 2, 3, 4],
    6: [0, 1, 2, 3, 4, 5],
    7: [0, 1, 2, 3, 4, 5, 6],
}

_GOAL_LABELS: dict[str, str] = {
    "muscle": "Prise de Muscle",
    "weight_loss": "Perte de Poids",
    "fitness": "Remise en Forme",
    "performance": "Performance",
    "mobility": "Mobilité",
    "rehab": "Rééducation",
    "health": "Santé",
}

_DAY_LABELS: dict[int, str] = {
    0: "Lundi",
    1: "Mardi",
    2: "Mercredi",
    3: "Jeudi",
    4: "Vendredi",
    5: "Samedi",
    6: "Dimanche",
}


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
    goal_label = _GOAL_LABELS.get(goal.lower(), goal.title())
    training_days = _WEEKLY_SCHEDULE.get(week_availability, _WEEKLY_SCHEDULE[3])

    program = WorkoutProgram(
        id=str(uuid4()),
        account_id=account_id,
        title=f"Plan {goal_label} · {week_availability}j/semaine",
        goal=goal,
        created_at=datetime.now(),
        active=True,
    )
    db.add(program)
    db.flush()

    base_intensity = 6 if goal.lower() in {"performance", "muscle"} else 5
    base_duration = 45 if goal.lower() in {"endurance", "performance"} else 35

    today = date.today()
    # Start from the Monday of the current week
    week_start = today - timedelta(days=today.weekday())

    for week_offset in range(4):  # Generate 4 weeks of sessions
        week_monday = week_start + timedelta(weeks=week_offset)
        for day_offset in training_days:
            session_date = week_monday + timedelta(days=day_offset)
            if session_date < today:
                continue  # Skip dates already passed
            day_name = _DAY_LABELS.get(day_offset, "Séance")
            db.add(
                WorkoutSession(
                    id=str(uuid4()),
                    program_id=program.id,
                    account_id=account_id,
                    name=f"{goal_label} · {day_name}",
                    session_date=session_date,
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
