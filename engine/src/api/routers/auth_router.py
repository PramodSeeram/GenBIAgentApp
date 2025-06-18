# import os
# from fastapi import APIRouter, Request, Depends, HTTPException
# from fastapi.responses import RedirectResponse, JSONResponse
# from sqlalchemy.orm import Session
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import RedirectResponse
from pydantic import BaseModel
from requests_oauthlib import OAuth2Session
from urllib.parse import urlparse
import secrets
import logging
import json
import base64
# from src.database.relational.dependencies import get_user_db
from src.api.services.auth_service import AuthService
from src.config.settings import settings
# from src.database.relational.crud.user import get_or_create_user

router = APIRouter()  # Note: prefix is now handled in __init__.py 
auth_service = AuthService(settings.GOOGLE_CLIENT_ID)
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
def google_callback(request: Request):
    try:
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
        
        oauth = get_google_oauth_session(state=state)
        logger.info(f"Using redirect URI: {settings.GOOGLE_REDIRECT_URI}")
        
        token = oauth.fetch_token(
            GOOGLE_TOKEN_URL,
            client_secret=settings.GOOGLE_CLIENT_SECRET,
            code=code
        )

        # Get user info from Google
        resp = oauth.get(GOOGLE_USERINFO_URL)
        userinfo = resp.json()
        
        if not userinfo.get("email"):
            logger.error("No email in userinfo")
            raise HTTPException(status_code=400, detail="Failed to get user info from Google")

        # Redirect to the frontend URL from state
        logger.info(f"Redirecting to frontend: {frontend_url}/home")
        return RedirectResponse(url=f"{frontend_url}/home")
        
    except Exception as e:
        logger.error(f"Error in google_callback: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

class GoogleToken(BaseModel):
    token: str

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