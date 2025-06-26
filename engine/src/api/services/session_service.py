import jwt
import secrets
from datetime import datetime, timedelta
from typing import Dict, Optional
from fastapi import HTTPException
from src.config.settings import settings

class SessionService:
    def __init__(self):
        # In production, use a proper secret key from environment variables
        self.secret_key = getattr(settings, 'JWT_SECRET_KEY', 'your-secret-key-change-in-production')
        self.algorithm = "HS256"
        self.access_token_expire_minutes = 30

    def create_user_session(self, user_id: int, email: str, role: str) -> Dict[str, str]:
        """
        Create a secure session for the user after successful authentication
        """
        try:
            # Create access token
            access_token_expires = timedelta(minutes=self.access_token_expire_minutes)
            access_token = self._create_access_token(
                data={"sub": str(user_id), "email": email, "role": role},
                expires_delta=access_token_expires
            )
            
            # Create refresh token
            refresh_token = self._create_refresh_token(
                data={"sub": str(user_id), "email": email, "role": role}
            )
            
            return {
                "access_token": access_token,
                "refresh_token": refresh_token,
                "token_type": "bearer",
                "expires_in": self.access_token_expire_minutes * 60
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Failed to create session: {str(e)}")

    def _create_access_token(self, data: Dict, expires_delta: Optional[timedelta] = None) -> str:
        """
        Create an access token with the specified data and expiration
        """
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=15)
        
        to_encode.update({"exp": expire, "type": "access"})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt

    def _create_refresh_token(self, data: Dict) -> str:
        """
        Create a refresh token with longer expiration
        """
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=7)  # 7 days
        to_encode.update({"exp": expire, "type": "refresh"})
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt

    def verify_token(self, token: str) -> Dict:
        """
        Verify and decode a JWT token
        """
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token has expired")
        except jwt.JWTError:
            raise HTTPException(status_code=401, detail="Invalid token")

    def get_current_user_from_token(self, token: str) -> Dict:
        """
        Get current user information from token
        """
        payload = self.verify_token(token)
        user_id = payload.get("sub")
        email = payload.get("email")
        role = payload.get("role")
        
        if user_id is None or email is None:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        
        return {
            "user_id": int(user_id),
            "email": email,
            "role": role
        }

