from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional

class UserBase(BaseModel):
    email: EmailStr
    name: str
    google_id: Optional[str] = None

class UserCreate(UserBase):
    pass

class UserInDB(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True 