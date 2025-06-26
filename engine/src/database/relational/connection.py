from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from src.config.settings import settings
import logging

logger = logging.getLogger(__name__)

# For chat threads (SQLite)
engine = create_engine(
    settings.DATABASE_URL,
    connect_args={"check_same_thread": False}  # SQLite-specific
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# For users (MySQL)
logger.info(f"Connecting to user database: {settings.USER_DATABASE_URL}")
user_engine = create_engine(settings.USER_DATABASE_URL)
UserSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=user_engine)

Base = declarative_base() 