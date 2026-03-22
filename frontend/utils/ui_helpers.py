"""
UI Helper Utilities
ScholarSense - Reusable loading states and skeleton screens
"""
import streamlit as st


def show_skeleton_cards(count=3, cols=3):
    """Show animated placeholder cards while data loads"""
    st.markdown("""
    <style>
        @keyframes shimmer {
            0%   { background-position: -1000px 0; }
            100% { background-position: 1000px 0; }
        }
        .skeleton {
            background: linear-gradient(
                90deg,
                #f0f4f8 25%,
                #e2e8f0 50%,
                #f0f4f8 75%
            );
            background-size: 1000px 100%;
            animation: shimmer 1.5s infinite;
            border-radius: 8px;
            margin-bottom: 0.5rem;
        }
        .skeleton-card {
            background: white;
            padding: 1.2rem;
            border-radius: 12px;
            border: 1px solid #e2e8f0;
            margin-bottom: 1rem;
        }
    </style>
    """, unsafe_allow_html=True)

    columns = st.columns(cols)
    for i in range(count):
        with columns[i % cols]:
            st.markdown("""
            <div class="skeleton-card">
                <div class="skeleton" style="height:16px; width:60%;"></div>
                <div class="skeleton" style="height:36px; width:40%; margin-top:0.8rem;"></div>
                <div class="skeleton" style="height:12px; width:80%; margin-top:0.8rem;"></div>
            </div>
            """, unsafe_allow_html=True)


def show_skeleton_table(rows=5):
    """Show animated placeholder rows while table data loads"""
    st.markdown("""
    <style>
        .skeleton-row {
            display: flex; gap: 1rem;
            padding: 0.6rem 0;
            border-bottom: 1px solid #f0f4f8;
        }
    </style>
    """, unsafe_allow_html=True)

    for _ in range(rows):
        st.markdown("""
        <div class="skeleton-row">
            <div class="skeleton" style="height:14px; width:20%; border-radius:6px;"></div>
            <div class="skeleton" style="height:14px; width:15%; border-radius:6px;"></div>
            <div class="skeleton" style="height:14px; width:15%; border-radius:6px;"></div>
            <div class="skeleton" style="height:14px; width:30%; border-radius:6px;"></div>
            <div class="skeleton" style="height:14px; width:10%; border-radius:6px;"></div>
        </div>
        """, unsafe_allow_html=True)


def show_loading_banner(message="Loading data, please wait..."):
    """Show a styled top banner while fetching"""
    st.markdown(f"""
    <div style="background: linear-gradient(90deg, #2563eb, #1d4ed8);
                color: white; padding: 0.75rem 1.5rem;
                border-radius: 10px; margin-bottom: 1rem;
                display: flex; align-items: center; gap: 0.75rem;
                box-shadow: 0 4px 12px rgba(37,99,235,0.3);">
        <span style="font-size:1.2rem;">⏳</span>
        <span style="font-weight:600;">{message}</span>
    </div>
    """, unsafe_allow_html=True)


def show_error_state(message="Something went wrong.", retry_label="🔄 Retry"):
    """Show a friendly error card with optional retry button"""
    st.markdown(f"""
    <div style="background:#fff5f5; border:2px solid #fc8181;
                border-radius:12px; padding:1.5rem 2rem;
                margin:1rem 0; text-align:center;">
        <p style="font-size:2rem; margin:0;">❌</p>
        <p style="color:#c53030; font-weight:700;
                  font-size:1.1rem; margin:0.5rem 0;">{message}</p>
        <p style="color:#742a2a; font-size:0.9rem; margin:0;">
            Please check your connection or try again.
        </p>
    </div>
    """, unsafe_allow_html=True)
    return st.button(retry_label, use_container_width=False)


def show_empty_state(title="No data found",
                     subtitle="Try adjusting your filters or add new records.",
                     icon="📭"):
    """Show a friendly empty state card"""
    st.markdown(f"""
    <div style="background:white; border:2px dashed #cbd5e0;
                border-radius:16px; padding:3rem 2rem;
                margin:1rem 0; text-align:center;">
        <p style="font-size:3rem; margin:0;">{icon}</p>
        <p style="color:#1a202c; font-weight:700;
                  font-size:1.2rem; margin:0.75rem 0 0.25rem 0;">{title}</p>
        <p style="color:#718096; font-size:0.95rem; margin:0;">{subtitle}</p>
    </div>
    """, unsafe_allow_html=True)


def safe_api_call(fn, *args, fallback=None, error_msg="Failed to load data.", **kwargs):
    """
    Safely call any API function.
    Returns result on success, fallback value on failure.
    Shows error message automatically.
    """
    try:
        result = fn(*args, **kwargs)
        if isinstance(result, dict) and result.get('error'):
            st.warning(f"⚠️ {result['error']}")
            return fallback
        return result
    except Exception as e:
        st.error(f"❌ {error_msg} ({str(e)})")
        return fallback if fallback is not None else []
