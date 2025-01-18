import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from .models import Base

# Fetch database credentials from environment variables
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://user:password@localhost/chatterbox")

# Create engine and session factory
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def init_db():
    """Initialize the database and create tables if not present."""
    Base.metadata.create_all(bind=engine)
