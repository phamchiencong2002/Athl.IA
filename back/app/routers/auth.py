from datetime import datetime
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import create_token_pair, parse_token
from app.db.session import get_db
from app.models import Account
from app.schemas import AuthResponse, LoginIn, RefreshIn, RegisterIn
from app.utils import hash_password, verify_password

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse)
def register(payload: RegisterIn, db: Session = Depends(get_db)) -> AuthResponse:
    normalized_mail = payload.mail.strip().lower()
    account = db.query(Account).filter(Account.mail == normalized_mail).first()

    if account:
        if not verify_password(payload.password, account.password_hash):
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Account already exists")
        account.last_connection = datetime.utcnow()
        db.commit()
        db.refresh(account)
        pair = create_token_pair(account.id)
        return AuthResponse(**pair, account={
            "id": account.id,
            "username": account.username,
            "mail": account.mail,
            "avatar": account.avatar,
            "statut_account": account.statut_account,
            "last_connection": account.last_connection.isoformat() if account.last_connection else None,
        })

    now = datetime.utcnow()
    account = Account(
        id=str(uuid4()),
        username=payload.username.strip(),
        mail=normalized_mail,
        password_hash=hash_password(payload.password),
        avatar=None,
        statut_account="active",
        created_at=now,
        last_connection=now,
    )
    db.add(account)
    db.commit()
    db.refresh(account)

    pair = create_token_pair(account.id)
    return AuthResponse(**pair, account={
        "id": account.id,
        "username": account.username,
        "mail": account.mail,
        "avatar": account.avatar,
        "statut_account": account.statut_account,
        "last_connection": account.last_connection.isoformat() if account.last_connection else None,
    })


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginIn, db: Session = Depends(get_db)) -> AuthResponse:
    normalized_mail = payload.mail.strip().lower()
    account = db.query(Account).filter(Account.mail == normalized_mail).first()

    if not account or not verify_password(payload.password, account.password_hash):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid credentials")

    account.last_connection = datetime.utcnow()
    db.commit()
    db.refresh(account)

    pair = create_token_pair(account.id)
    return AuthResponse(**pair, account={
        "id": account.id,
        "username": account.username,
        "mail": account.mail,
        "avatar": account.avatar,
        "statut_account": account.statut_account,
        "last_connection": account.last_connection.isoformat() if account.last_connection else None,
    })


@router.post("/refresh")
def refresh(payload: RefreshIn, db: Session = Depends(get_db)) -> dict[str, str]:
    token = parse_token(payload.refreshToken)
    if not token or token["type"] != "refresh":
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    account = db.query(Account).filter(Account.id == token["sub"]).first()
    if not account:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token")

    return create_token_pair(token["sub"])
