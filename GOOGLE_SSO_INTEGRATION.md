# Google SSO Integration Documentation

This document describes the implementation of Google Single Sign-On (SSO) integration for the Chat4BA application.

## Overview

The Google SSO integration has been implemented following the OAuth 2.0 authorization code flow with the following key features:

1. **User Authentication**: Secure authentication via Google OAuth 2.0
2. **Database Integration**: Automatic user creation and management
3. **Session Management**: JWT-based session handling with refresh tokens
4. **Role-Based Authorization**: Default 'user' role assignment for new users
5. **Error Handling**: Comprehensive error handling and user feedback

## Architecture

### Backend Components

#### 1. Database Models (`engine/src/database/relational/models/user.py`)
```python
class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String)
    google_id = Column(String, unique=True, index=True)
    picture = Column(String, nullable=True)
    role = Column(String, default='user')  # Default role for new users
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

#### 2. Authentication Router (`engine/src/api/routers/auth_router.py`)
- **`/google/login`**: Initiates Google OAuth flow
- **`/google/callback`**: Handles OAuth callback and user management
- **`/auth/refresh`**: Refreshes access tokens
- **`/auth/me`**: Gets current user information

#### 3. Session Service (`engine/src/api/services/session_service.py`)
- JWT token creation and validation
- Access and refresh token management
- User session establishment

#### 4. CRUD Operations (`engine/src/database/relational/crud/user.py`)
- User creation and retrieval
- Last login updates
- Role management

### Frontend Components

#### 1. Login Page (`chat4baui/src/pages/Login.tsx`)
- Handles Google SSO callback tokens
- Stores tokens in localStorage
- Error handling and user feedback

#### 2. API Service (`chat4baui/src/services/api.ts`)
- Automatic token inclusion in API requests
- Token refresh handling
- Authentication state management

## Implementation Details

### Google SSO Callback Flow

The callback function implements the following steps as requested:

```python
@router.get("/google/callback", tags=["auth"])
def google_callback(request: Request, db: Session = Depends(get_user_db)):
    """
    Google SSO callback function that handles user authentication and database operations
    """
    try:
        # 1. Extract authorization code and state from Google
        code = request.query_params.get("code")
        state = request.query_params.get("state")
        
        # 2. Exchange code for access token
        token = oauth.fetch_token(GOOGLE_TOKEN_URL, ...)
        
        # 3. Get user info from Google
        userinfo = resp.json()
        
        # 4. Extract user information (especially email)
        user_email = userinfo.get("email")
        
        # 5. Check if user already exists in 'users' table
        existing_user = get_user_by_email(db, user_email)

        if existing_user:
            # 6a. User exists: Update last_login timestamp
            update_user_last_login(db, user_email)
            current_user_role = existing_user.role
            user_id = existing_user.id
        else:
            # 6b. New user: Insert into 'users' table with default role 'user'
            new_user = insert_new_user(db, user_email, 'user')
            current_user_role = 'user'
            user_id = new_user.id

        # 7. Establish Application Session
        session_data = session_service.create_user_session(
            user_id=user_id,
            user_email=user_email,
            current_user_role=current_user_role
        )

        # 8. Redirect User with session data
        redirect_url = f"{frontend_url}/home?access_token={session_data['access_token']}&refresh_token={session_data['refresh_token']}"
        return RedirectResponse(url=redirect_url)

    except Exception as e:
        # Handle errors appropriately
        error_url = f"{frontend_url}/login?error=auth_error"
        return RedirectResponse(url=error_url)
```

### Database Operations

#### User Creation
- New users are automatically created with default role 'user'
- Google ID, email, name, and picture are stored
- Timestamps are automatically managed

#### User Updates
- Existing users have their last login timestamp updated
- User information is refreshed from Google

### Session Management

#### JWT Tokens
- **Access Token**: Short-lived (30 minutes) for API authentication
- **Refresh Token**: Long-lived (7 days) for token renewal
- **Token Types**: Distinguished by 'type' field ('access' vs 'refresh')

#### Token Refresh
- Automatic token refresh on 401 responses
- Seamless user experience with transparent renewal
- Fallback to login page on refresh failure

## Configuration

### Environment Variables

Add the following to your `.env` file:

```env
# Google OAuth Settings
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"
GOOGLE_REDIRECT_URI="http://localhost:8000/api/auth/google/callback"

# JWT Settings
JWT_SECRET_KEY="your-secret-key-change-in-production"

# Database Settings
USER_DATABASE_URL="mysql+mysqlconnector://user:password@host:port/database"
DATABASE_URL="sqlite:///./main.db"
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs
6. Copy Client ID and Client Secret to your `.env` file

## Usage

### Starting the Application

1. **Backend**:
   ```bash
   cd engine
   python -m uvicorn src.main:app --reload --host 0.0.0.0 --port 8000
   ```

2. **Frontend**:
   ```bash
   cd chat4baui
   npm run dev
   ```

### Testing the Integration

1. **Database Test**:
   ```bash
   cd engine
   python test_db.py
   ```

2. **Manual Testing**:
   - Navigate to the login page
   - Click "Sign in with Google"
   - Complete Google OAuth flow
   - Verify user creation in database
   - Check token storage in browser

## Security Considerations

### Token Security
- JWT tokens are signed with a secret key
- Access tokens have short expiration (30 minutes)
- Refresh tokens are stored securely in localStorage
- Automatic token refresh prevents session expiration

### Database Security
- User passwords are not stored (OAuth only)
- Email addresses are unique and indexed
- Google IDs are stored for account linking
- Role-based access control implemented

### Error Handling
- Comprehensive error logging
- User-friendly error messages
- Graceful fallbacks for failed operations
- Secure error responses (no sensitive data exposure)

## Troubleshooting

### Common Issues

1. **Database Connection Errors**
   - Verify database URL in `.env`
   - Check database server status
   - Ensure proper permissions

2. **Google OAuth Errors**
   - Verify Client ID and Secret
   - Check redirect URI configuration
   - Ensure Google+ API is enabled

3. **Token Issues**
   - Check JWT secret key configuration
   - Verify token expiration settings
   - Monitor token refresh logs

### Debug Mode

Enable debug logging by setting:
```env
LOG_LEVEL=DEBUG
```

## Future Enhancements

1. **Role Management**: Admin interface for user role management
2. **Session Persistence**: Database-stored sessions for better security
3. **Multi-Provider Support**: Microsoft, GitHub, etc.
4. **Profile Management**: User profile editing capabilities
5. **Audit Logging**: Comprehensive user activity logging

## Support

For issues or questions regarding the Google SSO integration:

1. Check the logs for detailed error messages
2. Verify all environment variables are set correctly
3. Test database connectivity independently
4. Review Google OAuth configuration

---

**Note**: This implementation follows OAuth 2.0 best practices and provides a secure, scalable foundation for user authentication in the Chat4BA application. 