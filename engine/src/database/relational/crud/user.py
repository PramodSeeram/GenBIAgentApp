from sqlalchemy.orm import Session
from typing import Dict, Optional
from datetime import datetime
from ..models.user import User

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def get_user_by_google_id(db: Session, google_id: str) -> Optional[User]:
    return db.query(User).filter(User.google_id == google_id).first()

def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()

def get_or_create_user(db: Session, user_data: Dict) -> User:
    """
    Get existing user or create a new one based on email or google_id
    """
    user = None
    if 'google_id' in user_data and user_data['google_id']:
        user = get_user_by_google_id(db, user_data['google_id'])
    if not user:
        user = get_user_by_email(db, user_data['email'])
    if user:
        # Update last_login and google_id if needed
        user.last_login = datetime.utcnow()
        if 'google_id' in user_data and user_data['google_id']:
            user.google_id = user_data['google_id']
        db.commit()
        db.refresh(user)
    else:
        # Create new user
        user = User(
            email=user_data['email'],
            role=user_data.get('role', 'user'),
            last_login=datetime.utcnow(),
            google_id=user_data.get('google_id')
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    return user

def update_user_last_login(db: Session, email: str, google_id: Optional[str] = None) -> Optional[User]:
    user = get_user_by_email(db, email)
    if user:
        user.last_login = datetime.utcnow()
        if google_id:
            user.google_id = google_id
        db.commit()
        db.refresh(user)
    return user

def insert_new_user(db: Session, email: str, role: str = 'user', google_id: Optional[str] = None) -> User:
    user = User(
        email=email,
        role=role,
        last_login=datetime.utcnow(),
        google_id=google_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user

def update_user(db: Session, user_id: int, update_data: Dict) -> Optional[User]:
    user = get_user_by_id(db, user_id)
    if user:
        for key, value in update_data.items():
            if hasattr(user, key):
                setattr(user, key, value)
        db.commit()
        db.refresh(user)
    return user

def delete_user(db: Session, user_id: int) -> bool:
    user = get_user_by_id(db, user_id)
    if user:
        db.delete(user)
        db.commit()
        return True
    return False 