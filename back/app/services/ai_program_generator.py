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


class GeneratedSessionContent(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=3, max_length=120)
    planned_duration_min: int = Field(ge=15, le=120)
    planned_intensity: int = Field(ge=1, le=10)
    focus: str = Field(default="", max_length=160)
    notes: str = Field(default="", max_length=500)


class GeneratedProgramContent(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=3, max_length=120)
    summary: str = Field(default="", max_length=500)
    sessions: list[GeneratedSessionContent]


def ai_generation_enabled() -> bool:
    return (
        settings.ai_enabled
        and settings.ai_provider.lower() == "openai"
        and bool(settings.ai_api_key.strip())
        and OpenAI is not None
    )


def _build_schema() -> dict[str, Any]:
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
                    ],
                    "properties": {
                        "name": {"type": "string"},
                        "planned_duration_min": {"type": "integer"},
                        "planned_intensity": {"type": "integer"},
                        "focus": {"type": "string"},
                        "notes": {"type": "string"},
                    },
                },
            },
        },
    }


def _build_messages(context: dict[str, Any]) -> list[dict[str, str]]:
    system_message = (
        "You are an elite sports performance planner. "
        "Return valid JSON only. Build a realistic training program in French. "
        "Respect injuries, protected zones, movement limitations, available equipment, level, "
        "goal, and weekly frequency. Avoid dangerous exercise choices. Keep session names short."
    )
    user_message = (
        "Create a 4-week workout program as JSON. "
        "The JSON must match the provided schema exactly and contain exactly the requested number "
        "of sessions in chronological training order.\n\n"
        f"PROGRAM_CONTEXT_JSON:\n{json.dumps(context, ensure_ascii=False)}"
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
        response = client.responses.create(
            model=settings.ai_model,
            input=_build_messages(context),
            text={
                "format": {
                    "type": "json_schema",
                    "name": "athlia_program",
                    "strict": True,
                    "schema": _build_schema(),
                }
            },
        )
        raw_payload = getattr(response, "output_text", "") or ""
        if not raw_payload:
            logger.warning("AI response returned no output_text")
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
