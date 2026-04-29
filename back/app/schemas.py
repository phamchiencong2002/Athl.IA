from datetime import date
from typing import Optional
from pydantic import BaseModel, Field


class AccountOut(BaseModel):
    id: str
    username: str
    mail: str
    avatar: str | None
    statut_account: str | None
    last_connection: str | None


class AuthResponse(BaseModel):
    token: str
    refreshToken: str
    account: AccountOut


class RegisterIn(BaseModel):
    username: str
    mail: str
    password: str


class LoginIn(BaseModel):
    mail: str
    password: str


class RefreshIn(BaseModel):
    refreshToken: str


class UserProfileIn(BaseModel):
    id_account: str
    gender: str | None = None
    birthdate: str | None = None
    height_cm: int | None = None
    weight_kg: float | None = None
    training_experience: str | None = None
    sport: str | None = None
    main_goal: str | None = None
    week_availability: int | None = None
    equipment: str | None = None
    health: str | None = None
    sleep: str | None = None
    stress: str | None = None
    load: str | None = None
    recovery: str | None = None


class GenerateProgramIn(BaseModel):
    account_id: str
    goal: str
    week_availability: int = Field(ge=1, le=7)


class SessionOut(BaseModel):
    id: str
    name: str
    session_date: date
    planned_duration_min: int
    planned_intensity: int
    adjusted_intensity: int
    status: str


class ProgramOut(BaseModel):
    id: str
    title: str
    goal: str
    sessions: list[SessionOut]


class ReadinessIn(BaseModel):
    account_id: str
    sleep_hours: float = Field(ge=0, le=12)
    fatigue: int = Field(ge=0, le=10)
    stress: int = Field(ge=0, le=10)
    soreness: int = Field(ge=0, le=10)
    pain_level: int = Field(ge=0, le=10)


class ReadinessOut(BaseModel):
    readiness_score: int
    ai_advice: str


class SessionFeedbackIn(BaseModel):
    rpe_reported: int = Field(ge=1, le=10)
    notes: str | None = None


class InjuryIn(BaseModel):
    account_id: str
    muscle_group: str
    pain_level: int = Field(ge=0, le=10)


class InjuryOut(BaseModel):
    id: str
    muscle_group: str
    pain_level: int
    is_active: bool


class ProgressOut(BaseModel):
    completed_sessions: int
    completion_rate: float
    average_rpe: float
    readiness_average: float


class AnalyticsOut(BaseModel):
    weekly_sessions_done: int
    weekly_sessions_planned: int
    injury_risk_flag: bool
    next_session_intensity: int | None


class WeightLogIn(BaseModel):
    weight_kg: float = Field(gt=0, le=500)


class WeightLogOut(BaseModel):
    id: str
    log_date: date
    weight_kg: float


class ReadinessDetailOut(BaseModel):
    readiness_score: int
    ai_advice: str
    sleep_hours: float
    fatigue: int
    stress: int
    soreness: int
    pain_level: int
    log_date: str


class DashboardUserOut(BaseModel):
    id: str
    username: str
    avatar: Optional[str]


class DashboardOut(BaseModel):
    user: DashboardUserOut
    readiness: Optional[ReadinessDetailOut]
    today_session: Optional[SessionOut]
    analytics: AnalyticsOut
    progress: ProgressOut
