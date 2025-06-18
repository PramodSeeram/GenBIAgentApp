from sqlalchemy import Column, String, Integer, TIMESTAMP
from sqlalchemy.sql import func
from src.database.relational.connection import Base

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, autoincrement=True)
    google_id = Column(String(500), unique=True)
    email = Column(String(500), unique=True)
    name = Column(String(500))
    created_at = Column(TIMESTAMP, server_default=func.now()) 