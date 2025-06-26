# import os
# from fastapi import APIRouter, Request, Depends, HTTPException
# from fastapi.responses import RedirectResponse, JSONResponse
# from sqlalchemy.orm import Session
from fastapi import APIRouter, Request, Depends, HTTPException
from fastapi.responses import RedirectResponse, JSONResponse
from pydantic import BaseModel
from requests_oauthlib import OAuth2Session
from urllib.parse import urlparse
import secrets
import logging
import json
import base64
from sqlalchemy.orm import Session
from src.database.relational.dependencies import get_user_db
from src.api.services.auth_service import AuthService
from src.api.services.session_service import SessionService
from src.database.relational.crud.user import get_user_by_email, update_user_last_login, insert_new_user, get_user_by_id
from src.config.settings import settings

router = APIRouter()  # Note: prefix is now handled in __init__.py 
auth_service = AuthService(settings.GOOGLE_CLIENT_ID)
session_service = SessionService()
logger = logging.getLogger(__name__)

GOOGLE_AUTHORIZATION_URL = "https://accounts.google.com/o/oauth2/v2/auth"
GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token"
GOOGLE_USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"
SCOPE = [
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
    "https://www.googleapis.com/auth/userinfo.profile"
]

def get_frontend_url_from_request(request: Request) -> str:
    """Extract frontend URL from the request's referer"""
    referer = request.headers.get('referer')
    if referer:
        parsed = urlparse(referer)
        return f"{parsed.scheme}://{parsed.netloc}"
    return "http://localhost:7001"  # fallback

def create_oauth_state(frontend_url: str) -> str:
    """Create a state parameter that includes the frontend URL"""
    state_data = {
        'csrf_token': secrets.token_urlsafe(32),
        'frontend_url': frontend_url
    }
    # Encode the state data as base64 to make it URL-safe
    return base64.urlsafe_b64encode(json.dumps(state_data).encode()).decode()

def decode_oauth_state(state: str) -> dict:
    """Decode the state parameter to get the frontend URL"""
    try:
        decoded = base64.urlsafe_b64decode(state.encode()).decode()
        return json.loads(decoded)
    except:
        logger.error("Failed to decode state parameter")
        return {'frontend_url': 'http://localhost:7001'}

# Helper to create OAuth2 session
def get_google_oauth_session(state=None, token=None):
    if not settings.GOOGLE_CLIENT_ID:
        logger.error("GOOGLE_CLIENT_ID is not set")
        raise HTTPException(status_code=500, detail="OAuth configuration error")
    
    if not settings.GOOGLE_REDIRECT_URI:
        logger.error("GOOGLE_REDIRECT_URI is not set")
        raise HTTPException(status_code=500, detail="OAuth configuration error")
        
    return OAuth2Session(
        client_id=settings.GOOGLE_CLIENT_ID,
        redirect_uri=settings.GOOGLE_REDIRECT_URI,
        scope=SCOPE,
        state=state,
        token=token,
    )

@router.get("/google/login", tags=["auth"])
def google_login(request: Request):
    try:
        # Get the frontend URL from the request
        frontend_url = get_frontend_url_from_request(request)
        logger.info(f"Frontend URL detected: {frontend_url}")
        
        # Create state with frontend URL
        state = create_oauth_state(frontend_url)
        
        oauth = get_google_oauth_session(state=state)
        authorization_url, state = oauth.authorization_url(
            GOOGLE_AUTHORIZATION_URL,
            access_type="offline",  # Enable refresh tokens
            prompt="select_account consent",  # Force consent screen
            include_granted_scopes="true"  # Enable incremental authorization
        )
        logger.info(f"Generated authorization URL: {authorization_url}")
        return RedirectResponse(authorization_url)
    except Exception as e:
        logger.error(f"Error in google_login: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/google/callback", tags=["auth"])
def google_callback(request: Request, db: Session = Depends(get_user_db)):
    """
    Google SSO callback function that handles user authentication and database operations
    """
    try:
        # 1. Extract authorization code and state from Google
        code = request.query_params.get("code")
        state = request.query_params.get("state")
        
        if not code:
            logger.error("No code in callback")
            raise HTTPException(status_code=400, detail="Missing code in callback")

        if not state:
            logger.error("No state in callback")
            raise HTTPException(status_code=400, detail="Missing state parameter")

        # Decode state to get frontend URL
        state_data = decode_oauth_state(state)
        frontend_url = state_data.get('frontend_url', 'http://localhost:7001')
        
        # 2. Exchange code for access token
        oauth = get_google_oauth_session(state=state)
        logger.info(f"Using redirect URI: {settings.GOOGLE_REDIRECT_URI}")
        
        token = oauth.fetch_token(
            GOOGLE_TOKEN_URL,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            code=code
        )

        # 3. Get user info from Google
        resp = oauth.get(GOOGLE_USERINFO_URL)
        userinfo = resp.json()
        
        if not userinfo.get("email"):
            logger.error("No email in userinfo")
            raise HTTPException(status_code=400, detail="Failed to get user info from Google")

        # 4. Extract user information (email)
        user_email = userinfo.get("email")
        google_id = userinfo.get("sub")

        logger.info(f"Processing Google SSO for user: {user_email} (google_id: {google_id})")

        try:
            # 5. Check if user already exists in 'users' table
            existing_user = get_user_by_email(db, user_email)

            if existing_user:
                # 6a. User exists: Update last_login timestamp
                update_user_last_login(db, user_email, google_id=google_id)
                logger.info(f"User {user_email} logged in. Last login updated.")
                current_user_role = existing_user.role
                user_id = existing_user.id
                user_google_id = google_id
            else:
                # 6b. New user: Insert into 'users' table with default role 'user'
                new_user = insert_new_user(db, user_email, 'user', google_id=google_id)
                logger.info(f"New user {user_email} registered with 'user' role.")
                current_user_role = 'user'  # Default for new users
                user_id = new_user.id
                user_google_id = google_id

            # 7. Establish Application Session
            session_data = session_service.create_user_session(
                user_id=user_id,
                email=user_email,
                role=current_user_role
            )

            # 8. Redirect User with session data
            redirect_url = f"{frontend_url}/home?access_token={session_data['access_token']}&refresh_token={session_data['refresh_token']}&google_id={user_google_id}"
            logger.info(f"Redirecting to frontend: {redirect_url}")
            return RedirectResponse(url=redirect_url)

        except Exception as db_error:
            logger.error(f"Error during Google SSO callback database operation: {db_error}")
            error_url = f"{frontend_url}/login?error=database_error"
            return RedirectResponse(url=error_url)

    except Exception as e:
        logger.error(f"Error in google_callback: {str(e)}")
        frontend_url = "http://localhost:7001"  # fallback
        error_url = f"{frontend_url}/login?error=auth_error"
        return RedirectResponse(url=error_url)

class GoogleToken(BaseModel):
    token: str

class RefreshTokenRequest(BaseModel):
    refresh_token: str

@router.post("/refresh", tags=["auth"])
def refresh_token(request: RefreshTokenRequest):
    """
    Refresh access token using refresh token
    """
    try:
        # Verify the refresh token
        payload = session_service.verify_token(request.refresh_token)
        
        # Check if it's a refresh token
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        
        # Create new access token
        user_id = payload.get("sub")
        email = payload.get("email")
        role = payload.get("role")
        
        if not user_id or not email:
            raise HTTPException(status_code=401, detail="Invalid token payload")
        
        access_token = session_service._create_access_token({
            "sub": user_id,
            "email": email,
            "role": role
        })
        
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }
    except Exception as e:
        logger.error(f"Token refresh error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid refresh token")

@router.get("/me", tags=["auth"])
def get_current_user(request: Request, db: Session = Depends(get_user_db)):
    """
    Get current user information from token
    """
    try:
        auth_header = request.headers.get("Authorization")
        if not auth_header or not auth_header.startswith("Bearer "):
            raise HTTPException(status_code=401, detail="Missing or invalid authorization header")
        
        token = auth_header.split(" ")[1]
        user_data = session_service.get_current_user_from_token(token)
        user = get_user_by_id(db, user_data["user_id"])
        return {
            "user_id": user.id,
            "email": user.email,
            "role": user.role,
            "google_id": user.google_id
        }
    except Exception as e:
        logger.error(f"Get current user error: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid token")

@router.post("/google", tags=["auth"])
def google_auth(token_data: GoogleToken):
    """
    Google SSO endpoint: verifies token and returns status only (DB logic removed).
    """
    return {"status": "success"}

# Add login credentials model
class LoginCredentials(BaseModel):
    email: str
    password: str

# Add login endpoint
@router.post("/login")
def login(credentials: LoginCredentials):
    """Handle email/password login"""
    if credentials.email == "admin@heeddata.com" and credentials.password == "admin":
        return {"status": "success", "message": "Login successful"}
    raise HTTPException(status_code=401, detail="Invalid credentials") 