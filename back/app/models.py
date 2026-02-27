from datetime import date, datetime

from sqlalchemy import Boolean, Date, DateTime, Float, ForeignKey, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column, relationship


class Base(DeclarativeBase):
    pass


class Account(Base):
    __tablename__ = "accounts"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    username: Mapped[str] = mapped_column(String(50), nullable=False)
    mail: Mapped[str] = mapped_column(String(255), unique=True, nullable=False, index=True)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    avatar: Mapped[str | None] = mapped_column(String(255), nullable=True)
    statut_account: Mapped[str | None] = mapped_column(String(40), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    last_connection: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    profile: Mapped["UserProfile"] = relationship(back_populates="account", uselist=False)
    programs: Mapped[list["WorkoutProgram"]] = relationship(back_populates="account")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    account_id: Mapped[str] = mapped_column(String(36), ForeignKey("accounts.id"), unique=True)
    gender: Mapped[str | None] = mapped_column(String(20), nullable=True)
    birthdate: Mapped[date | None] = mapped_column(Date, nullable=True)
    height_cm: Mapped[int | None] = mapped_column(Integer, nullable=True)
    weight_kg: Mapped[float | None] = mapped_column(Float, nullable=True)
    training_experience: Mapped[str | None] = mapped_column(String(40), nullable=True)
    sport: Mapped[str | None] = mapped_column(String(80), nullable=True)
    main_goal: Mapped[str | None] = mapped_column(String(120), nullable=True)
    week_availability: Mapped[int | None] = mapped_column(Integer, nullable=True)
    equipment: Mapped[str | None] = mapped_column(Text, nullable=True)
    health: Mapped[str | None] = mapped_column(Text, nullable=True)
    sleep: Mapped[str | None] = mapped_column(String(40), nullable=True)
    stress: Mapped[str | None] = mapped_column(String(40), nullable=True)
    load: Mapped[str | None] = mapped_column(String(40), nullable=True)
    recovery: Mapped[str | None] = mapped_column(String(40), nullable=True)

    account: Mapped[Account] = relationship(back_populates="profile")
    readiness_logs: Mapped[list["ReadinessLog"]] = relationship(back_populates="profile")
    injuries: Mapped[list["Injury"]] = relationship(back_populates="profile")


class Exercise(Base):
    __tablename__ = "exercises"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    name: Mapped[str] = mapped_column(String(80), nullable=False)
    category: Mapped[str] = mapped_column(String(50), nullable=False)
    muscle_groups: Mapped[str | None] = mapped_column(String(120), nullable=True)
    equipment: Mapped[str | None] = mapped_column(String(120), nullable=True)
    duration_min: Mapped[int | None] = mapped_column(Integer, nullable=True)


class WorkoutProgram(Base):
    __tablename__ = "workout_programs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    account_id: Mapped[str] = mapped_column(String(36), ForeignKey("accounts.id"), index=True)
    title: Mapped[str] = mapped_column(String(120), nullable=False)
    goal: Mapped[str] = mapped_column(String(120), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    account: Mapped[Account] = relationship(back_populates="programs")
    sessions: Mapped[list["WorkoutSession"]] = relationship(back_populates="program")


class WorkoutSession(Base):
    __tablename__ = "workout_sessions"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    program_id: Mapped[str] = mapped_column(String(36), ForeignKey("workout_programs.id"), index=True)
    account_id: Mapped[str] = mapped_column(String(36), ForeignKey("accounts.id"), index=True)
    name: Mapped[str] = mapped_column(String(120), nullable=False)
    session_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    planned_duration_min: Mapped[int] = mapped_column(Integer, nullable=False)
    planned_intensity: Mapped[int] = mapped_column(Integer, nullable=False)
    adjusted_intensity: Mapped[int] = mapped_column(Integer, nullable=False)
    status: Mapped[str] = mapped_column(String(30), nullable=False, default="planned")
    rpe_reported: Mapped[int | None] = mapped_column(Integer, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)

    program: Mapped[WorkoutProgram] = relationship(back_populates="sessions")


class ReadinessLog(Base):
    __tablename__ = "readiness_logs"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    account_id: Mapped[str] = mapped_column(String(36), ForeignKey("accounts.id"), index=True)
    profile_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("user_profiles.id"), nullable=True)
    log_date: Mapped[date] = mapped_column(Date, nullable=False, index=True)
    sleep_hours: Mapped[float] = mapped_column(Float, nullable=False)
    fatigue: Mapped[int] = mapped_column(Integer, nullable=False)
    stress: Mapped[int] = mapped_column(Integer, nullable=False)
    soreness: Mapped[int] = mapped_column(Integer, nullable=False)
    pain_level: Mapped[int] = mapped_column(Integer, nullable=False)
    readiness_score: Mapped[int] = mapped_column(Integer, nullable=False)
    ai_advice: Mapped[str] = mapped_column(Text, nullable=False)

    profile: Mapped[UserProfile | None] = relationship(back_populates="readiness_logs")


class Injury(Base):
    __tablename__ = "injuries"

    id: Mapped[str] = mapped_column(String(36), primary_key=True)
    account_id: Mapped[str] = mapped_column(String(36), ForeignKey("accounts.id"), index=True)
    profile_id: Mapped[str | None] = mapped_column(String(36), ForeignKey("user_profiles.id"), nullable=True)
    muscle_group: Mapped[str] = mapped_column(String(80), nullable=False)
    pain_level: Mapped[int] = mapped_column(Integer, nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, nullable=False)

    profile: Mapped[UserProfile | None] = relationship(back_populates="injuries")
