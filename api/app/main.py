import logging
import sys
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from app.database import init_db
from app.api import router  # Import the router
from alembic.config import Config
from starlette.exceptions import HTTPException
from alembic import command
from fastapi.logger import logger as fastapi_logger
import traceback

# Get specific loggers
uvicorn_logger = logging.getLogger("uvicorn")
uvicorn_error_logger = logging.getLogger("uvicorn.error")
uvicorn_access_logger = logging.getLogger("uvicorn.access")

handler = logging.StreamHandler(sys.stdout)
handlerErr = logging.StreamHandler(sys.stderr)

for logger in [uvicorn_logger, uvicorn_error_logger, uvicorn_access_logger, fastapi_logger]:
    logger.setLevel(logging.DEBUG)  # Adjust level if necessary
    logger.addHandler(handler)
    logger.addHandler(handlerErr)

def run_migrations():
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")

@asynccontextmanager
async def lifespan(app_: FastAPI):
    fastapi_logger.info("Starting up...")
    fastapi_logger.info("run alembic upgrade head...")
    run_migrations()
    yield
    fastapi_logger.info("Shutting down...")

app = FastAPI(lifespan=lifespan)

async def catch_exceptions_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        fastapi_logger.error(traceback.format_exc())
        raise e

app.middleware('http')(catch_exceptions_middleware)

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    fastapi_logger.error(f"HTTPException: {exc.detail} - Path: {request.url.path}", exc_info=True)
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    fastapi_logger.error(f"Unhandled Exception: {str(exc)} - Path: {request.url.path}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred."},
    )

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://ce-frontend:3000"],  # Allow specific frontend origin
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

@app.on_event("startup")
def startup():
    init_db()

# Include the API router
app.include_router(router)

@app.get("/")
def read_root():
    return {"message": "API is running on port 3001"}
