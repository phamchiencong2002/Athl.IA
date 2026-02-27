import logging
import time

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.core.logging import setup_logging
from app.db.base import init_db
from app.routers import analytics, auth, injuries, readiness, users, workouts

setup_logging()
logger = logging.getLogger("athlia-api")

app = FastAPI(title=settings.app_name)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    init_db()
    logger.info("Database initialized")


@app.middleware("http")
async def log_requests(request: Request, call_next):
    start = time.time()
    response = await call_next(request)
    elapsed_ms = int((time.time() - start) * 1000)
    logger.info("%s %s -> %s (%sms)", request.method, request.url.path, response.status_code, elapsed_ms)
    return response


@app.exception_handler(Exception)
async def unhandled_exception_handler(_request: Request, exc: Exception):
    logger.exception("Unhandled server error: %s", exc)
    return JSONResponse(status_code=500, content={"error": "Internal server error"})


@app.get("/")
def root() -> dict:
    return {
        "name": "athlia-api",
        "ok": True,
        "docs": "/docs",
        "endpoints": [
            "/health",
            "/auth/register",
            "/auth/login",
            "/auth/refresh",
            "/users",
            "/workouts/programs/generate",
            "/readiness",
            "/injuries",
            "/progress/{account_id}",
            "/analytics/{account_id}",
        ],
    }


@app.get("/health")
def health() -> dict:
    return {"ok": True}


app.include_router(auth.router)
app.include_router(users.router)
app.include_router(workouts.router)
app.include_router(readiness.router)
app.include_router(injuries.router)
app.include_router(analytics.router)
