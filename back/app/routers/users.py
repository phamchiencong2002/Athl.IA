from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import parse_token
from app.db.session import get_db
from app.models import Account, UserProfile
from app.schemas import UserProfileIn

router = APIRouter(tags=["users"])


def _require_account_id(authorization: str | None) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token = parse_token(authorization.replace("Bearer ", "", 1))
    if not token or token["type"] != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    return token["sub"]


@router.post("/users")
def upsert_user_profile(
    payload: UserProfileIn,
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> dict:
    account_id = _require_account_id(authorization)
    if payload.id_account != account_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Forbidden")

    account = db.query(Account).filter(Account.id == account_id).first()
    if not account:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Unauthorized")

    birthdate = None
    if payload.birthdate:
        try:
            birthdate = datetime.fromisoformat(payload.birthdate.replace("Z", "+00:00")).date()
        except ValueError as exc:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="birthdate is invalid") from exc

    profile = db.query(UserProfile).filter(UserProfile.account_id == account_id).first()
    created = False
    if not profile:
        profile = UserProfile(id=str(uuid4()), account_id=account_id)
        db.add(profile)
        created = True

    profile.gender = payload.gender
    profile.birthdate = birthdate
    profile.height_cm = payload.height_cm
    profile.weight_kg = payload.weight_kg
    profile.training_experience = payload.training_experience
    profile.sport = payload.sport
    profile.main_goal = payload.main_goal
    profile.week_availability = payload.week_availability
    profile.equipment = payload.equipment
    profile.health = payload.health
    profile.sleep = payload.sleep
    profile.stress = payload.stress
    profile.load = payload.load
    profile.recovery = payload.recovery

    db.commit()
    db.refresh(profile)

    return {
        "id": profile.id,
        "id_account": profile.account_id,
        "gender": profile.gender,
        "birthdate": profile.birthdate.isoformat() if profile.birthdate else None,
        "height_cm": profile.height_cm,
        "weight_kg": profile.weight_kg,
        "training_experience": profile.training_experience,
        "sport": profile.sport,
        "main_goal": profile.main_goal,
        "week_availability": profile.week_availability,
        "equipment": profile.equipment,
        "health": profile.health,
        "sleep": profile.sleep,
        "stress": profile.stress,
        "load": profile.load,
        "recovery": profile.recovery,
        "created": created,
    }
