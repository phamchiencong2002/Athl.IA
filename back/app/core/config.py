import os
from dataclasses import dataclass
from dotenv import load_dotenv

load_dotenv()


@dataclass(frozen=True)
class Settings:
    app_name: str = "Athlia API"
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"
    database_url: str = os.getenv("DATABASE_URL", "")
    token_secret: str = os.getenv("TOKEN_SECRET", "athlia-dev-secret")
    access_ttl_seconds: int = int(os.getenv("ACCESS_TTL_SECONDS", 3600))
    refresh_ttl_seconds: int = int(os.getenv("REFRESH_TTL_SECONDS", 2592000))


settings = Settings()
