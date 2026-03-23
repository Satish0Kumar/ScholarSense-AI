"""
Session Management for Streamlit
ScholarSense - AI-Powered Academic Intelligence System
Persists login across page refreshes using encrypted browser cookies
"""
import streamlit as st
import json
from datetime import datetime, timedelta
from frontend.utils.api_client import APIClient

# ── Cookie manager (singleton via session_state) ──────────────
def _get_cookie_manager():
    """Get or create cookie manager instance"""
    if '_cookie_manager' not in st.session_state:
        from streamlit_cookies_manager import EncryptedCookieManager
        cm = EncryptedCookieManager(
            prefix   = "scholarsense_",
            password = "ss_secret_key_2026_scholarsense"   # change to any strong string
        )
        st.session_state._cookie_manager = cm
    return st.session_state._cookie_manager


class SessionManager:
    """Manage user authentication state in Streamlit"""

    @staticmethod
    def initialize_session():
        """Initialize session — restore from cookies if available"""
        # Set defaults
        for key, val in [
            ('authenticated', False),
            ('user',          None),
            ('token',         None),
            ('token_expiry',  None)
        ]:
            if key not in st.session_state:
                st.session_state[key] = val

        # Already authenticated in this session — skip cookie check
        if st.session_state.get('authenticated'):
            return

        # ── Try restoring from cookie ──────────────────────────
        try:
            cm = _get_cookie_manager()
            if not cm.ready():
                st.stop()   # Wait for cookies to load

            token  = cm.get("token")
            expiry = cm.get("expiry")
            user   = cm.get("user")

            if token and expiry:
                expiry_dt = datetime.fromisoformat(expiry)
                if datetime.now() < expiry_dt:
                    st.session_state.authenticated = True
                    st.session_state.token         = token
                    st.session_state.token_expiry  = expiry_dt
                    st.session_state.user          = (
                        json.loads(user) if user else {}
                    )
        except Exception:
            pass   # If cookies fail, just show login

    @staticmethod
    def _save_cookie(token: str, user: dict, expiry_dt: datetime):
        """Save auth data to encrypted cookie"""
        try:
            cm = _get_cookie_manager()
            if cm.ready():
                cm["token"]  = token
                cm["expiry"] = expiry_dt.isoformat()
                cm["user"]   = json.dumps(user)
                cm.save()
        except Exception:
            pass

    @staticmethod
    def _clear_cookie():
        """Clear auth cookie"""
        try:
            cm = _get_cookie_manager()
            if cm.ready():
                cm["token"]  = ""
                cm["expiry"] = ""
                cm["user"]   = ""
                cm.save()
        except Exception:
            pass

    @staticmethod
    def login(email: str, password: str):
        """Login user → store in session + cookie"""
        result = APIClient.login(email, password)
        if 'error' not in result:
            token     = result['access_token']
            user      = result['user']
            expiry_dt = datetime.now() + timedelta(hours=8)

            st.session_state.authenticated = True
            st.session_state.user          = user
            st.session_state.token         = token
            st.session_state.token_expiry  = expiry_dt

            SessionManager._save_cookie(token, user, expiry_dt)
            return True
        return result['error']

    @staticmethod
    def set_session(token: str, user: dict):
        """Called after OTP verify — store token in session + cookie"""
        expiry_dt = datetime.now() + timedelta(hours=8)

        st.session_state.authenticated = True
        st.session_state.token         = token
        st.session_state.user          = user
        st.session_state.token_expiry  = expiry_dt

        SessionManager._save_cookie(token, user, expiry_dt)

    @staticmethod
    def logout():
        """Logout → clear session + cookie"""
        st.session_state.authenticated = False
        st.session_state.user          = None
        st.session_state.token         = None
        st.session_state.token_expiry  = None
        SessionManager._clear_cookie()

    @staticmethod
    def is_authenticated() -> bool:
        """Check if authenticated and token not expired"""
        if not st.session_state.get('authenticated'):
            return False
        expiry = st.session_state.get('token_expiry')
        if expiry and datetime.now() >= expiry:
            SessionManager.logout()
            return False
        return True

    @staticmethod
    def require_auth():
        """Redirect to login if not authenticated"""
        SessionManager.initialize_session()
        if not SessionManager.is_authenticated():
            st.warning("⚠️ Please login to access this page")
            st.switch_page("app.py")
            st.stop()

    @staticmethod
    def get_user():
        return st.session_state.get('user')

    @staticmethod
    def get_token():
        return st.session_state.get('token')

    @staticmethod
    def is_admin():
        user = SessionManager.get_user()
        return user and user.get('role') == 'admin'
