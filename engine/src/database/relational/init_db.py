"""
Database initialization script to create tables
"""
from src.database.relational.connection import Base, user_engine
from src.database.relational.models.user import User

def init_database():
    """Initialize the user database by creating all tables"""
    try:
        # Create tables for the user database (MySQL)
        Base.metadata.create_all(bind=user_engine)
        print("User database tables created successfully")
    except Exception as e:
        print(f"Error creating database tables: {e}")
        raise

if __name__ == "__main__":
    init_database() 