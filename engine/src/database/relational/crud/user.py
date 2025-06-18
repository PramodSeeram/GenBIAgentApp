from sqlalchemy.orm import Session
from typing import Dict, Optional
from ..models.user import User

def get_user_by_email(db: Session, email: str) -> Optional[User]:
    return db.query(User).filter(User.email == email).first()

def get_user_by_google_id(db: Session, google_id: str) -> Optional[User]:
    return db.query(User).filter(User.google_id == google_id).first()

def get_user_by_id(db: Session, user_id: int) -> Optional[User]:
    return db.query(User).filter(User.id == user_id).first()

def get_or_create_user(db: Session, user_data: Dict) -> User:
    """
    Get existing user or create a new one based on Google OAuth data
    """
    user = get_user_by_google_id(db, user_data['sub'])
    if not user:
        user = get_user_by_email(db, user_data['email'])
    
    if user:
        # Update existing user
        for key, value in user_data.items():
            if key == 'sub':
                user.google_id = value
            elif hasattr(user, key):
                setattr(user, key, value)
        db.commit()
        db.refresh(user)
    else:
        # Create new user
        user = User(
            email=user_data['email'],
            name=user_data.get('name', ''),
            google_id=user_data['sub'],
            picture=user_data.get('picture', None)
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