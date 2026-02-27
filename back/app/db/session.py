from collections.abc import Generator
from urllib.parse import parse_qsl, urlencode, urlparse, urlunparse

from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker

from app.core.config import settings


def _normalized_database_url(raw_url: str) -> str:
    parsed = urlparse(raw_url)
    query_params = dict(parse_qsl(parsed.query, keep_blank_values=True))
    query_params.pop("pgbouncer", None)
    query_params.pop("uselibpqcompat", None)
    normalized_query = urlencode(query_params)
    return urlunparse(parsed._replace(query=normalized_query))


engine = create_engine(_normalized_database_url(settings.database_url), pool_pre_ping=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
