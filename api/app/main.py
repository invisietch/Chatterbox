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

log = logging.getLogger("uvicorn")

# Configure logging
logging.basicConfig(
    level=logging.INFO,  # Set to DEBUG for more detailed logs
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.StreamHandler(sys.stdout),  # Send logs to stdout
    ],
)

# Get specific loggers
uvicorn_logger = logging.getLogger("uvicorn")
uvicorn_error_logger = logging.getLogger("uvicorn.error")
uvicorn_access_logger = logging.getLogger("uvicorn.access")

for logger in [uvicorn_logger, uvicorn_error_logger, uvicorn_access_logger]:
    logger.setLevel(logging.DEBUG)  # Adjust level if necessary
    logger.addHandler(logging.StreamHandler(sys.stdout))

def run_migrations():
    alembic_cfg = Config("alembic.ini")
    command.upgrade(alembic_cfg, "head")

@asynccontextmanager
async def lifespan(app_: FastAPI):
    log.info("Starting up...")
    log.info("run alembic upgrade head...")
    run_migrations()
    yield
    log.info("Shutting down...")

app = FastAPI(lifespan=lifespan)

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    log.error(f"HTTPException: {exc.detail} - Path: {request.url.path}", exc_info=True)
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
    )

@app.exception_handler(Exception)
async def generic_exception_handler(request: Request, exc: Exception):
    log.error(f"Unhandled Exception: {str(exc)} - Path: {request.url.path}", exc_info=True)
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
