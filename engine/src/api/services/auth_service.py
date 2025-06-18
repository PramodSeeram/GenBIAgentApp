from google.oauth2 import id_token
from google.auth.transport import requests
from src.database.relational.crud.user import get_or_create_user
from fastapi import HTTPException
from sqlalchemy.orm import Session
from src.config.settings import settings

class AuthService:
    def __init__(self, client_id: str = settings.GOOGLE_CLIENT_ID):
        self.client_id = client_id

    def verify_google_token(self, token: str, db: Session) -> dict:
        try:
            idinfo = id_token.verify_oauth2_token(token, requests.Request(), self.client_id)
            if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
                raise ValueError('Wrong issuer.')
            user_data = {
                'sub': idinfo['sub'],
                'email': idinfo['email'],
                'name': idinfo.get('name', ''),
                'picture': idinfo.get('picture', '')
            }
            user = get_or_create_user(db, user_data)
            return {
                'user_id': user.id,
                'email': user.email,
                'name': user.name,
                'google_id': user.google_id
            }
        except Exception as e:
            raise HTTPException(status_code=401, detail=f"Invalid Google token: {e}") 