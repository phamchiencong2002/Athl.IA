from datetime import date, datetime
from uuid import uuid4

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.deps import get_current_account
from app.db.session import get_db
from app.models import Account, WeightLog
from app.schemas import WeightLogIn, WeightLogOut

router = APIRouter(prefix="/weight-logs", tags=["weight"])


@router.post("", response_model=WeightLogOut, status_code=201)
def add_weight(
    payload: WeightLogIn,
    current: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> WeightLogOut:
    log = WeightLog(
        id=str(uuid4()),
        account_id=current.id,
        log_date=date.today(),
        weight_kg=payload.weight_kg,
        created_at=datetime.utcnow(),
    )
    db.add(log)
    db.commit()
    db.refresh(log)
    return WeightLogOut(id=log.id, log_date=log.log_date, weight_kg=log.weight_kg)


@router.get("", response_model=list[WeightLogOut])
def list_weights(
    current: Account = Depends(get_current_account),
    db: Session = Depends(get_db),
) -> list[WeightLogOut]:
    logs = (
        db.query(WeightLog)
        .filter(WeightLog.account_id == current.id)
        .order_by(WeightLog.log_date.asc())
        .all()
    )
    return [WeightLogOut(id=log.id, log_date=log.log_date, weight_kg=log.weight_kg) for log in logs]
