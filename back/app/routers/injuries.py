from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models import Injury, UserProfile
from app.schemas import InjuryIn, InjuryOut

router = APIRouter(prefix="/injuries", tags=["injuries"])


@router.post("", response_model=InjuryOut)
def create_injury(payload: InjuryIn, db: Session = Depends(get_db)) -> InjuryOut:
    profile = db.query(UserProfile).filter(UserProfile.account_id == payload.account_id).first()
    injury = Injury(
        id=str(uuid4()),
        account_id=payload.account_id,
        profile_id=profile.id if profile else None,
        muscle_group=payload.muscle_group,
        pain_level=payload.pain_level,
        is_active=True,
        created_at=datetime.utcnow(),
    )
    db.add(injury)
    db.commit()
    db.refresh(injury)
    return InjuryOut(
        id=injury.id,
        muscle_group=injury.muscle_group,
        pain_level=injury.pain_level,
        is_active=injury.is_active,
    )


@router.get("")
def list_injuries(account_id: str, db: Session = Depends(get_db)) -> list[InjuryOut]:
    injuries = (
        db.query(Injury)
        .filter(Injury.account_id == account_id)
        .order_by(Injury.created_at.desc())
        .all()
    )
    return [
        InjuryOut(
            id=i.id,
            muscle_group=i.muscle_group,
            pain_level=i.pain_level,
            is_active=i.is_active,
        )
        for i in injuries
    ]


@router.patch("/{injury_id}/resolve")
def resolve_injury(injury_id: str, db: Session = Depends(get_db)) -> dict:
    injury = db.query(Injury).filter(Injury.id == injury_id).first()
    if not injury:
        raise HTTPException(status_code=404, detail="Injury not found")
    injury.is_active = False
    db.commit()
    return {"id": injury.id, "is_active": injury.is_active}
