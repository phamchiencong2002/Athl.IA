from dataclasses import dataclass
from datetime import date, datetime, timedelta
from uuid import uuid4

from sqlalchemy.orm import Session

from app.models import Exercise, Injury, SessionExercise, UserProfile, WorkoutProgram, WorkoutSession
from app.services.ai_program_generator import (
    GeneratedExerciseItem,
    GeneratedProgramContent,
    GeneratedSessionContent,
    generate_ai_program_content,
)


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


# ── Exercise pool ─────────────────────────────────────────────────────────────

@dataclass(frozen=True)
class _ExerciseTemplate:
    name: str
    muscles: str        # comma-separated
    equipment: str      # comma-separated alternatives (any one suffices)
    sets: int
    reps: str           # "12-15", "30s", "10/jambe"
    category: str       # strength, core, cardio, mobility


_EXERCISE_POOL: list[_ExerciseTemplate] = [
    # ── Bodyweight strength ──────────────────────────────────────────────────
    _ExerciseTemplate("Squat poids du corps", "legs,glutes", "bodyweight,none", 3, "12-15", "strength"),
    _ExerciseTemplate("Pompes", "chest,shoulders,triceps", "bodyweight,none", 3, "10-15", "strength"),
    _ExerciseTemplate("Fentes avant", "legs,glutes", "bodyweight,none", 3, "10/jambe", "strength"),
    _ExerciseTemplate("Dips sur chaise", "triceps,chest", "bodyweight,none", 3, "10-12", "strength"),
    _ExerciseTemplate("Superman sol", "back,glutes", "mat,none", 3, "12-15", "strength"),
    _ExerciseTemplate("Hip thrust au sol", "glutes,legs", "mat,none", 3, "15-20", "strength"),
    _ExerciseTemplate("Pont fessier", "glutes,legs", "mat,none", 3, "15-20", "strength"),
    _ExerciseTemplate("Step-up imaginaire", "legs,glutes", "bodyweight,none", 3, "10/jambe", "strength"),
    # ── Core ────────────────────────────────────────────────────────────────
    _ExerciseTemplate("Gainage planche", "core,abs", "mat,none", 3, "30-45s", "core"),
    _ExerciseTemplate("Crunch", "abs,core", "mat,none", 3, "15-20", "core"),
    _ExerciseTemplate("Russian twist", "core,abs", "mat,none", 3, "20/côté", "core"),
    _ExerciseTemplate("Relevé de jambes allongé", "abs,core", "mat,none", 3, "12-15", "core"),
    _ExerciseTemplate("Gainage latéral", "core,obliques", "mat,none", 3, "20-30s/côté", "core"),
    _ExerciseTemplate("Dead bug", "core,abs", "mat,none", 3, "10/côté", "core"),
    # ── Cardio bodyweight ────────────────────────────────────────────────────
    _ExerciseTemplate("Mountain climbers", "core,legs", "mat,none", 3, "20/côté", "cardio"),
    _ExerciseTemplate("Jumping jacks", "full_body", "none", 3, "30s", "cardio"),
    _ExerciseTemplate("Burpees", "full_body", "none", 3, "8-10", "cardio"),
    _ExerciseTemplate("Squat jump", "legs,glutes", "none", 3, "10-12", "cardio"),
    _ExerciseTemplate("Course sur place", "legs", "none", 4, "45s", "cardio"),
    # ── Mobility ────────────────────────────────────────────────────────────
    _ExerciseTemplate("Étirement chat-vache", "back,spine", "mat,none", 2, "10", "mobility"),
    _ExerciseTemplate("Rotation hanches sol", "hips,glutes", "mat,none", 2, "10/côté", "mobility"),
    _ExerciseTemplate("Étirement ischio-jambiers", "legs", "mat,none", 2, "30s/côté", "mobility"),
    _ExerciseTemplate("Pigeon yoga", "hips,glutes", "mat,none", 2, "30s/côté", "mobility"),
    _ExerciseTemplate("Flexion latérale debout", "back,obliques", "none", 2, "10/côté", "mobility"),
    # ── Dumbbells ───────────────────────────────────────────────────────────
    _ExerciseTemplate("Curl biceps haltère", "biceps,arms", "dumbbells", 3, "12-15", "strength"),
    _ExerciseTemplate("Développé épaule haltère", "shoulders", "dumbbells", 3, "10-12", "strength"),
    _ExerciseTemplate("Rowing haltère unilatéral", "back,biceps", "dumbbells", 3, "10-12/côté", "strength"),
    _ExerciseTemplate("Goblet squat haltère", "legs,glutes", "dumbbells,kettlebell", 3, "12-15", "strength"),
    _ExerciseTemplate("Deadlift haltères", "back,legs,glutes", "dumbbells", 3, "10-12", "strength"),
    _ExerciseTemplate("Press couché haltères", "chest,shoulders,triceps", "dumbbells", 3, "10-12", "strength"),
    _ExerciseTemplate("Extension triceps haltère", "triceps,arms", "dumbbells", 3, "12-15", "strength"),
    _ExerciseTemplate("Élévations latérales haltères", "shoulders", "dumbbells", 3, "12-15", "strength"),
    # ── Kettlebell ──────────────────────────────────────────────────────────
    _ExerciseTemplate("Kettlebell swing", "glutes,legs,back", "kettlebell", 4, "15-20", "strength"),
    _ExerciseTemplate("Turkish get-up", "full_body", "kettlebell", 3, "3/côté", "strength"),
    # ── Bands ───────────────────────────────────────────────────────────────
    _ExerciseTemplate("Tirage élastique horizontal", "back,biceps", "bands", 3, "12-15", "strength"),
    _ExerciseTemplate("Press élastique debout", "chest,shoulders", "bands", 3, "12-15", "strength"),
    _ExerciseTemplate("Extension triceps élastique", "triceps,arms", "bands", 3, "12-15", "strength"),
    _ExerciseTemplate("Abduction hanche élastique", "glutes,hips", "bands", 3, "15/côté", "strength"),
    _ExerciseTemplate("Squat avec élastique", "legs,glutes", "bands", 3, "15", "strength"),
    _ExerciseTemplate("Curl biceps élastique", "biceps,arms", "bands", 3, "12-15", "strength"),
    _ExerciseTemplate("Tirage vertical élastique", "back,biceps,shoulders", "bands", 3, "12-15", "strength"),
    # ── Barbell ─────────────────────────────────────────────────────────────
    _ExerciseTemplate("Squat barre", "legs,glutes", "barbell", 4, "6-10", "strength"),
    _ExerciseTemplate("Développé couché barre", "chest,shoulders,triceps", "barbell", 4, "6-10", "strength"),
    _ExerciseTemplate("Soulevé de terre barre", "back,legs,glutes", "barbell", 4, "5-8", "strength"),
    _ExerciseTemplate("Rowing barre", "back,biceps", "barbell", 4, "8-10", "strength"),
    _ExerciseTemplate("Press militaire barre", "shoulders,triceps", "barbell", 4, "6-10", "strength"),
]

# Muscles to avoid when an injury zone is active
_INJURY_AVOIDANCE: dict[str, list[str]] = {
    "shoulder": ["shoulders", "chest", "triceps", "arms"],
    "knee": ["legs", "glutes"],
    "back": ["back", "spine"],
    "ankle": ["legs"],
    "neck": ["shoulders", "back", "spine"],
    "elbow": ["biceps", "triceps", "arms"],
    "hip": ["hips", "glutes"],
    "wrist": ["arms", "biceps", "triceps"],
}

# Which exercise categories to prioritise based on session focus
_FOCUS_CATEGORIES: dict[str, list[str]] = {
    "force": ["strength"],
    "cardio": ["cardio"],
    "mobilité": ["mobility"],
    "gainage": ["core"],
    "récupération": ["mobility", "core"],
    "endurance": ["cardio", "strength"],
}


def _stable_hash(s: str) -> int:
    """Deterministic hash (not Python's built-in which is salted)."""
    h = 0
    for c in s:
        h = (h * 31 + ord(c)) & 0xFFFFFFFF
    return h


def _select_exercises(
    focus: str,
    equipment_tags: list[str],
    injured_zones: list[str],
    goal: str,
    session_index: int,
) -> list[GeneratedExerciseItem]:
    available = set(equipment_tags) | {"bodyweight", "none", "mat"}

    # Build set of muscle groups to avoid
    avoid: set[str] = set()
    for zone in injured_zones:
        avoid.update(_INJURY_AVOIDANCE.get(zone.lower(), [zone.lower()]))

    # Filter eligible exercises
    eligible: list[_ExerciseTemplate] = []
    for ex in _EXERCISE_POOL:
        eq_options = {e.strip() for e in ex.equipment.split(",")}
        if not eq_options & available:
            continue
        ex_muscles = {m.strip() for m in ex.muscles.split(",")}
        if ex_muscles & avoid:
            continue
        eligible.append(ex)

    primary_cats = _FOCUS_CATEGORIES.get(focus.lower(), ["strength"])
    primary = [e for e in eligible if e.category in primary_cats]
    secondary = [e for e in eligible if e.category not in primary_cats and e.category != "mobility"]
    mobility_pool = [e for e in eligible if e.category == "mobility"]

    seed = session_index * 31 + _stable_hash(goal)

    def _pick(pool: list[_ExerciseTemplate], n: int, offset: int = 0) -> list[_ExerciseTemplate]:
        if not pool:
            return []
        return [pool[(seed + i + offset) % len(pool)] for i in range(min(n, len(pool)))]

    selected = _pick(primary, 3) + _pick(secondary, 1, 100) + _pick(mobility_pool, 1, 200)

    # Deduplicate while preserving order
    seen: set[str] = set()
    deduped: list[_ExerciseTemplate] = []
    for ex in selected:
        if ex.name not in seen:
            seen.add(ex.name)
            deduped.append(ex)

    # Ensure at least 3 exercises
    if len(deduped) < 3:
        extras = [e for e in eligible if e.name not in seen]
        for ex in _pick(extras, 3 - len(deduped), 300):
            if ex.name not in seen:
                seen.add(ex.name)
                deduped.append(ex)

    return [
        GeneratedExerciseItem(
            name=ex.name,
            sets=ex.sets,
            reps=ex.reps,
            equipment=ex.equipment.split(",")[0].strip(),
            muscle_groups=ex.muscles,
            notes="",
        )
        for ex in deduped[:6]
    ]


# ── DB helpers ────────────────────────────────────────────────────────────────

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
            d = week_monday + timedelta(days=day_offset)
            if d >= today:
                session_dates.append(d)

    return session_dates


def _fallback_session_blueprint(
    goal: str,
    total_sessions: int,
    equipment_tags: list[str],
    injured_zones: list[str],
) -> GeneratedProgramContent:
    goal_key = goal.lower()
    goal_label = _GOAL_LABELS.get(goal_key, goal.title())
    base_intensity = 6 if goal_key in {"performance", "muscle"} else 5
    base_duration = 45 if goal_key in {"endurance", "performance"} else 35
    focus_cycle = ["force", "cardio", "mobilité", "gainage"]
    sessions = []

    for index in range(total_sessions):
        focus = focus_cycle[index % len(focus_cycle)]
        exercises = _select_exercises(
            focus=focus,
            equipment_tags=equipment_tags,
            injured_zones=injured_zones,
            goal=goal,
            session_index=index,
        )
        sessions.append(
            GeneratedSessionContent(
                name=f"{goal_label} · Séance {index + 1}",
                planned_duration_min=base_duration,
                planned_intensity=min(10, base_intensity + (1 if index % 4 == 3 else 0)),
                focus=focus,
                notes=f"Séance orientée {focus} — objectif {goal_label.lower()}.",
                exercises=exercises,
            )
        )

    return GeneratedProgramContent(
        title=f"Plan {goal_label} · 4 semaines",
        summary="Programme généré automatiquement.",
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


def _parse_equipment_tags(profile: UserProfile | None) -> list[str]:
    """Extract equipment tags from the profile.equipment text field."""
    if not profile or not profile.equipment:
        return []
    tags: list[str] = []
    for part in profile.equipment.split("|"):
        part = part.strip()
        if part.startswith("mat:"):
            tags.extend(t.strip() for t in part[4:].split("/"))
        elif part.startswith("lieux:"):
            pass  # location info, not equipment
    return tags


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
    injured_zones = [inj.muscle_group for inj in injuries if inj.is_active]
    equipment_tags = _parse_equipment_tags(profile)

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
        equipment_tags=equipment_tags,
        injured_zones=injured_zones,
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

    for idx, (session_content, session_date) in enumerate(
        zip(generated_content.sessions, session_dates, strict=False)
    ):
        day_name = _DAY_LABELS.get(session_date.weekday(), "Séance")
        session_name = session_content.name.strip() or f"{goal_label} · {day_name}"
        if day_name.lower() not in session_name.lower():
            session_name = f"{session_name} · {day_name}"

        session = WorkoutSession(
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
        db.add(session)
        db.flush()

        # Persist generated exercises for this session.
        # If the AI returned an empty exercise list, fall back to the local selector.
        _FOCUS_CYCLE_LOCAL = ["force", "cardio", "mobilité", "gainage"]
        exercises_to_save = session_content.exercises or _select_exercises(
            focus=_FOCUS_CYCLE_LOCAL[idx % len(_FOCUS_CYCLE_LOCAL)],
            equipment_tags=equipment_tags,
            injured_zones=injured_zones,
            goal=goal,
            session_index=idx,
        )
        for order, ex in enumerate(exercises_to_save):
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

    db.commit()
    db.refresh(program)
    return program


def get_fallback_exercises(
    goal: str,
    session_index: int,
    focus: str = "",
    equipment_tags: list[str] | None = None,
    injured_zones: list[str] | None = None,
) -> list:
    """Public helper: generate a list of fallback exercises for a session.

    Used by the workouts router to auto-populate sessions that were stored
    without exercises (e.g. because the AI returned an empty list).
    """
    _focus_cycle = ["force", "cardio", "mobilité", "gainage"]
    effective_focus = focus or _focus_cycle[session_index % len(_focus_cycle)]
    return _select_exercises(
        focus=effective_focus,
        equipment_tags=equipment_tags or [],
        injured_zones=injured_zones or [],
        goal=goal,
        session_index=session_index,
    )
