import json
import logging
from typing import Any

from pydantic import BaseModel, ConfigDict, Field, ValidationError

from app.core.config import settings

try:
    from openai import OpenAI
except ImportError:  # pragma: no cover - handled via runtime fallback
    OpenAI = None


logger = logging.getLogger("athlia-ai")


class GeneratedExerciseItem(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=2, max_length=100)
    sets: int = Field(ge=1, le=8)
    reps: str = Field(max_length=20)  # "12-15", "30s", "10/côté"
    equipment: str = Field(default="", max_length=80)
    muscle_groups: str = Field(default="", max_length=120)
    notes: str = Field(default="", max_length=200)


class GeneratedSessionContent(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=3, max_length=120)
    planned_duration_min: int = Field(ge=15, le=120)
    planned_intensity: int = Field(ge=1, le=10)
    focus: str = Field(default="", max_length=160)
    notes: str = Field(default="", max_length=500)
    exercises: list[GeneratedExerciseItem] = Field(default_factory=list)


class GeneratedProgramContent(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=3, max_length=120)
    summary: str = Field(default="", max_length=500)
    sessions: list[GeneratedSessionContent]


def ai_generation_enabled() -> bool:
    return (
        settings.ai_enabled
        and settings.ai_provider.lower() in {"openai", "ollama"}
        and bool(settings.ai_api_key.strip())
        and OpenAI is not None
    )


def _build_schema() -> dict[str, Any]:
    exercise_schema = {
        "type": "object",
        "additionalProperties": False,
        "required": ["name", "sets", "reps", "equipment", "muscle_groups", "notes"],
        "properties": {
            "name": {"type": "string"},
            "sets": {"type": "integer"},
            "reps": {"type": "string"},
            "equipment": {"type": "string"},
            "muscle_groups": {"type": "string"},
            "notes": {"type": "string"},
        },
    }
    return {
        "type": "object",
        "additionalProperties": False,
        "required": ["title", "summary", "sessions"],
        "properties": {
            "title": {"type": "string"},
            "summary": {"type": "string"},
            "sessions": {
                "type": "array",
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": [
                        "name",
                        "planned_duration_min",
                        "planned_intensity",
                        "focus",
                        "notes",
                        "exercises",
                    ],
                    "properties": {
                        "name": {"type": "string"},
                        "planned_duration_min": {"type": "integer"},
                        "planned_intensity": {"type": "integer"},
                        "focus": {"type": "string"},
                        "notes": {"type": "string"},
                        "exercises": {
                            "type": "array",
                            "items": exercise_schema,
                        },
                    },
                },
            },
        },
    }


def _build_messages(context: dict[str, Any]) -> list[dict[str, str]]:
    schema_str = json.dumps(_build_schema(), ensure_ascii=False)
    system_message = (
        "Tu es un coach sportif expert. "
        "Réponds UNIQUEMENT avec du JSON valide correspondant exactement au schéma ci-dessous. "
        "Crée un programme d'entraînement réaliste en français. "
        "Respecte absolument les blessures et zones à protéger (n'inclus JAMAIS d'exercices sollicitant une zone blessée), "
        "le matériel disponible (n'utilise que le matériel listé), le niveau, l'objectif et la fréquence hebdomadaire. "
        "Pour chaque séance, fournis 4 à 6 exercices spécifiques avec séries, répétitions/durée, "
        "matériel utilisé, groupes musculaires et éventuellement des notes. "
        "Les noms de séances doivent être courts et descriptifs.\n\n"
        f"SCHEMA JSON REQUIS:\n{schema_str}"
    )
    user_message = (
        "Crée un programme en JSON. "
        "Le JSON doit correspondre exactement au schéma et contenir exactement le nombre "
        "de séances indiqué dans total_sessions, dans l'ordre chronologique.\n\n"
        f"CONTEXT_JSON:\n{json.dumps(context, ensure_ascii=False)}"
    )
    return [
        {"role": "system", "content": system_message},
        {"role": "user", "content": user_message},
    ]


def generate_ai_program_content(context: dict[str, Any]) -> GeneratedProgramContent | None:
    if not ai_generation_enabled():
        logger.info("AI generation disabled or missing API credentials; falling back to local generator")
        return None

    client = OpenAI(
        api_key=settings.ai_api_key,
        base_url=settings.ai_base_url,
    )

    try:
        response = client.chat.completions.create(
            model=settings.ai_model,
            messages=_build_messages(context),
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        raw_payload = (response.choices[0].message.content or "") if response.choices else ""
        if not raw_payload:
            logger.warning("AI response returned no content")
            return None

        parsed = json.loads(raw_payload)
        program = GeneratedProgramContent.model_validate(parsed)
        expected_sessions = int(context["total_sessions"])
        if len(program.sessions) != expected_sessions:
            logger.warning(
                "AI returned %s sessions instead of %s; falling back to local generator",
                len(program.sessions),
                expected_sessions,
            )
            return None
        return program
    except (json.JSONDecodeError, ValidationError) as exc:
        logger.warning("Invalid AI payload, using fallback generator: %s", exc)
        return None
    except Exception as exc:  # pragma: no cover - depends on external API
        logger.warning("AI call failed, using fallback generator: %s", exc)
        return None
