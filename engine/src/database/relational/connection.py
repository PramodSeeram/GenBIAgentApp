# from sqlalchemy import create_engine
# from sqlalchemy.ext.declarative import declarative_base
# from sqlalchemy.orm import sessionmaker
# from src.config.settings import settings

# # For chat threads (SQLite)
# engine = create_engine(
#     settings.DATABASE_URL,
#     connect_args={"check_same_thread": False}  # SQLite-specific
# )
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# # For users (MySQL)
# user_engine = create_engine(settings.USER_DATABASE_URL)
# UserSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=user_engine)

# Base = declarative_base() 