"""
Session Management for Streamlit - ScholarSense
Uses streamlit-local-storage for reliable session persistence
"""
import streamlit as st
import json
from datetime import datetime, timedelta
from frontend.utils.api_client import APIClient


def get_local_storage():
    """Get LocalStorage instance (cached in session)"""
    if '_ls' not in st.session_state:
        from streamlit_local_storage import LocalStorage
        st.session_state._ls = LocalStorage()
    return st.session_state._ls


class SessionManager:

    @staticmethod
    def initialize_session():
        """Set defaults + restore from localStorage if not already in session"""
        for key, val in [
            ('authenticated', False),
            ('user',          None),
            ('token',         None),
            ('token_expiry',  None),
            ('_session_restored', False)
        ]:
            if key not in st.session_state:
                st.session_state[key] = val

        # Already authenticated this run — skip restore
        if st.session_state.get('authenticated'):
            return

        # Already tried restore this run — skip to avoid loops
        if st.session_state.get('_session_restored'):
            return

        st.session_state['_session_restored'] = True

        # ── Try restoring from localStorage ───────────────────
        try:
            ls    = get_local_storage()
            token  = ls.getItem("ss_token")
            expiry = ls.getItem("ss_expiry")
            user   = ls.getItem("ss_user")

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
            pass

    @staticmethod
    def _save(token: str, user: dict, expiry_dt: datetime):
        """Persist to localStorage"""
        try:
            ls = get_local_storage()
            ls.setItem("ss_token",  token)
            ls.setItem("ss_expiry", expiry_dt.isoformat())
            ls.setItem("ss_user",   json.dumps(user))
        except Exception:
            pass

    @staticmethod
    def _clear():
        """Clear localStorage"""
        try:
            ls = get_local_storage()
            ls.deleteItem("ss_token")
            ls.deleteItem("ss_expiry")
            ls.deleteItem("ss_user")
        except Exception:
            pass

    @staticmethod
    def set_session(token: str, user: dict):
        """Called after OTP verify — save to session + localStorage"""
        expiry_dt = datetime.now() + timedelta(hours=8)
        st.session_state.authenticated = True
        st.session_state.token         = token
        st.session_state.user          = user
        st.session_state.token_expiry  = expiry_dt
        SessionManager._save(token, user, expiry_dt)

    @staticmethod
    def login(email: str, password: str):
        """Direct login (non-OTP flow)"""
        result = APIClient.login(email, password)
        if 'error' not in result:
            SessionManager.set_session(result['access_token'], result['user'])
            return True
        return result['error']

    @staticmethod
    def logout():
        """Clear session + localStorage"""
        st.session_state.authenticated    = False
        st.session_state.user             = None
        st.session_state.token            = None
        st.session_state.token_expiry     = None
        st.session_state._session_restored = False
        SessionManager._clear()

    @staticmethod
    def is_authenticated() -> bool:
        if not st.session_state.get('authenticated'):
            return False
        expiry = st.session_state.get('token_expiry')
        if expiry and datetime.now() >= expiry:
            SessionManager.logout()
            return False
        return True

    @staticmethod
    def require_auth():
        """Call at top of every page — restores session or redirects"""
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
