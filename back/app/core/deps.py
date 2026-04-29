from fastapi import Depends, Header, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import parse_token
from app.db.session import get_db
from app.models import Account


def get_current_account(
    authorization: str | None = Header(default=None),
    db: Session = Depends(get_db),
) -> Account:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing bearer token")
    token_str = authorization.removeprefix("Bearer ")
    token = parse_token(token_str)
    if not token or token["type"] != "access":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired token")
    account = db.query(Account).filter(Account.id == token["sub"]).first()
    if not account:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Account not found")
    return account
