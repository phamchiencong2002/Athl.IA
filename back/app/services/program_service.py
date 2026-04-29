from datetime import date, datetime, timedelta
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models import Exercise, Injury, UserProfile, WorkoutProgram, WorkoutSession
from app.services.ai_program_generator import GeneratedProgramContent, GeneratedSessionContent, generate_ai_program_content


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

_LEVEL_LABELS: dict[str, str] = {
    "beginner": "débutant",
    "intermediate": "intermédiaire",
    "advanced": "avancé",
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


def _build_training_dates(week_availability: int) -> list[date]:
    training_days = _WEEKLY_SCHEDULE.get(week_availability, _WEEKLY_SCHEDULE[3])
    today = date.today()
    week_start = today - timedelta(days=today.weekday())
    session_dates: list[date] = []

    for week_offset in range(4):
        week_monday = week_start + timedelta(weeks=week_offset)
        for day_offset in training_days:
            session_date = week_monday + timedelta(days=day_offset)
            if session_date >= today:
                session_dates.append(session_date)

    return session_dates


def _fallback_session_blueprint(goal: str, total_sessions: int) -> GeneratedProgramContent:
    goal_key = goal.lower()
    goal_label = _GOAL_LABELS.get(goal_key, goal.title())
    base_intensity = 6 if goal_key in {"performance", "muscle"} else 5
    base_duration = 45 if goal_key in {"endurance", "performance"} else 35
    focus_cycle = [
        "force",
        "cardio",
        "mobilité",
        "gainage",
    ]
    sessions = []

    for index in range(total_sessions):
        focus = focus_cycle[index % len(focus_cycle)]
        sessions.append(
            GeneratedSessionContent(
                name=f"{goal_label} · Séance {index + 1}",
                planned_duration_min=base_duration,
                planned_intensity=min(10, base_intensity + (1 if index % 4 == 3 else 0)),
                focus=focus,
                notes=f"Séance orientée {focus} en cohérence avec l'objectif {goal_label.lower()}.",
            )
        )

    return GeneratedProgramContent(
        title=f"Plan {goal_label} · 4 semaines",
        summary="Programme généré automatiquement par la logique de secours.",
        sessions=sessions,
    )


def _build_program_context(
    account_id: str,
    goal: str,
    week_availability: int,
    session_dates: list[date],
    profile: UserProfile | None,
    injuries: list[Injury],
) -> dict:
    return {
        "account_id": account_id,
        "goal": goal,
        "goal_label": _GOAL_LABELS.get(goal.lower(), goal.title()),
        "week_availability": week_availability,
        "total_sessions": len(session_dates),
        "training_dates": [dt.isoformat() for dt in session_dates],
        "profile": {
            "gender": profile.gender if profile else None,
            "birthdate": profile.birthdate.isoformat() if profile and profile.birthdate else None,
            "height_cm": profile.height_cm if profile else None,
            "weight_kg": profile.weight_kg if profile else None,
            "training_experience": _LEVEL_LABELS.get(profile.training_experience or "", profile.training_experience or "")
            if profile
            else None,
            "sport": profile.sport if profile else None,
            "main_goal": profile.main_goal if profile else None,
            "equipment": profile.equipment if profile else None,
            "health": profile.health if profile else None,
            "load": profile.load if profile else None,
        },
        "injuries": [
            {
                "muscle_group": injury.muscle_group,
                "pain_level": injury.pain_level,
            }
            for injury in injuries
            if injury.is_active
        ],
    }


def generate_program(
    db: Session,
    account_id: str,
    goal: str,
    week_availability: int,
    profile: UserProfile | None = None,
    injuries: list[Injury] | None = None,
) -> WorkoutProgram:
    goal_label = _GOAL_LABELS.get(goal.lower(), goal.title())
    session_dates = _build_training_dates(week_availability)
    injuries = injuries or []
    program_context = _build_program_context(
        account_id=account_id,
        goal=goal,
        week_availability=week_availability,
        session_dates=session_dates,
        profile=profile,
        injuries=injuries,
    )
    generated_content = generate_ai_program_content(program_context) or _fallback_session_blueprint(
        goal=goal,
        total_sessions=len(session_dates),
    )

    program = WorkoutProgram(
        id=str(uuid4()),
        account_id=account_id,
        title=generated_content.title or f"Plan {goal_label} · {week_availability}j/semaine",
        goal=goal,
        created_at=datetime.now(),
        active=True,
    )
    db.add(program)
    db.flush()

    for session_content, session_date in zip(generated_content.sessions, session_dates, strict=False):
        day_name = _DAY_LABELS.get(session_date.weekday(), "Séance")
        session_name = session_content.name.strip() or f"{goal_label} · {day_name}"
        if day_name.lower() not in session_name.lower():
            session_name = f"{session_name} · {day_name}"

        db.add(
            WorkoutSession(
                id=str(uuid4()),
                program_id=program.id,
                account_id=account_id,
                name=session_name,
                session_date=session_date,
                planned_duration_min=session_content.planned_duration_min,
                planned_intensity=session_content.planned_intensity,
                adjusted_intensity=session_content.planned_intensity,
                status="planned",
                rpe_reported=None,
                notes=(session_content.notes or session_content.focus or None),
            )
        )

    db.commit()
    db.refresh(program)
    return program
