# from typing import Generator
# from sqlalchemy.orm import Session
# from .connection import SessionLocal, UserSessionLocal

# def get_db() -> Generator[Session, None, None]:
#     """
#     Dependency for getting SQLite database session.
#     """
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()

# def get_user_db() -> Generator[Session, None, None]:
#     """
#     Dependency for getting MySQL user database session.
#     """
#     db = UserSessionLocal()
#     try:
#         yield db
#     finally:
#         db.close() 