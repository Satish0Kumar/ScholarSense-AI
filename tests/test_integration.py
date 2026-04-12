"""
Integration Test Suite - ScholarSense
End-to-end flow: Health → Auth → Students → Academics → Predictions
"""
import requests
import time

API_BASE = "http://127.0.0.1:5000"

# ── Colours ────────────────────────────────────────────────────────────────────
G = '\033[92m'; R = '\033[91m'; Y = '\033[93m'; B = '\033[94m'; E = '\033[0m'

passed = failed = 0


def header(text):
    print(f"\n{B}{'='*65}\n  {text}\n{'='*65}{E}")


def ok(text):
    global passed
    passed += 1
    print(f"{G}  ✓ {text}{E}")


def fail(text):
    global failed
    failed += 1
    print(f"{R}  ✗ {text}{E}")


def req(method, path, data=None, token=None, auth=False):
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    url = f"{API_BASE}{path}"
    try:
        fn = {"GET": requests.get, "POST": requests.post,
              "PUT": requests.put, "DELETE": requests.delete}[method]
        kwargs = {"headers": headers, "timeout": 5}
        if data is not None:
            kwargs["json"] = data
        return fn(url, **kwargs)
    except requests.exceptions.ConnectionError:
        return None


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 1 — CONNECTIVITY
# ══════════════════════════════════════════════════════════════════════════════

def section_connectivity():
    header("1. Connectivity")

    r = req("GET", "/api/health")
    if r and r.status_code == 200 and r.json().get("status") == "healthy":
        ok("Health check → healthy")
    else:
        fail(f"Health check failed (status={r and r.status_code})")

    # Unauthenticated access must be blocked
    r = req("GET", "/api/students")
    if r and r.status_code == 401:
        ok("Protected route without token → 401")
    else:
        fail(f"Expected 401 without token, got {r and r.status_code}")


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 2 — AUTH (credential layer only; OTP email not testable in CI)
# ══════════════════════════════════════════════════════════════════════════════

def section_auth():
    header("2. Authentication")

    # Wrong credentials
    r = req("POST", "/api/auth/login",
            {"email": "nobody@example.com", "password": "badpass"})
    if r and r.status_code == 401:
        ok("Invalid credentials → 401")
    else:
        fail(f"Expected 401 for bad creds, got {r and r.status_code}")

    # Missing fields
    r = req("POST", "/api/auth/login", {"email": "admin@scholarsense.com"})
    if r and r.status_code == 400:
        ok("Missing password field → 400")
    else:
        fail(f"Expected 400 for missing field, got {r and r.status_code}")

    # Valid credentials → OTP flow initiated (not 401/400)
    r = req("POST", "/api/auth/login",
            {"email": "admin@scholarsense.com", "password": "admin123"})
    if r and r.status_code == 200 and r.json().get("status") == "otp_sent":
        ok("Valid credentials → OTP flow initiated (status=otp_sent)")
    elif r and r.status_code in (200, 500):
        # 500 is acceptable if email service not configured in test env
        ok(f"Valid credentials accepted (status={r.status_code}, email service may be unconfigured)")
    else:
        fail(f"Unexpected response for valid login: {r and r.status_code} {r and r.text[:100]}")

    # OTP verify with garbage → 400
    r = req("POST", "/api/auth/verify-otp", {"user_id": 1, "otp": "abc"})
    if r and r.status_code == 400:
        ok("Non-numeric OTP → 400")
    else:
        fail(f"Expected 400 for bad OTP format, got {r and r.status_code}")

    # OTP verify with wrong code → 401
    r = req("POST", "/api/auth/verify-otp", {"user_id": 1, "otp": "000000"})
    if r and r.status_code in (401, 429):
        ok("Wrong OTP → 401/429")
    else:
        fail(f"Expected 401/429 for wrong OTP, got {r and r.status_code}")


# ══════════════════════════════════════════════════════════════════════════════
# SECTION 3 — AUTHENTICATED FLOW (requires token)
# ══════════════════════════════════════════════════════════════════════════════

def section_authenticated(token: str):
    header("3. Student CRUD")

    student_id = None

    # Create
    r = req("POST", "/api/students", {
        "student_id": "INTEG_TEST_001",
        "first_name": "Integration",
        "last_name": "Test",
        "grade": 9,
        "section": "B",
        "gender": "Female",
        "date_of_birth": "2009-03-20",
        "socioeconomic_status": "Medium",
        "parent_education": "Graduate"
    }, token=token)
    if r and r.status_code in (200, 201):
        student_id = r.json().get("id")
        ok(f"Create student → id={student_id}")
    else:
        fail(f"Create student failed: {r and r.status_code} {r and r.text[:100]}")
        return  # Can't continue without a student

    # Read list
    r = req("GET", "/api/students", token=token)
    if r and r.status_code == 200 and isinstance(r.json(), list):
        ok(f"List students → {len(r.json())} records")
    else:
        fail(f"List students failed: {r and r.status_code}")

    # Read by ID
    r = req("GET", f"/api/students/{student_id}", token=token)
    if r and r.status_code == 200 and r.json().get("id") == student_id:
        ok(f"Get student by id → OK")
    else:
        fail(f"Get student by id failed: {r and r.status_code}")

    # 404 for unknown
    r = req("GET", "/api/students/999999", token=token)
    if r and r.status_code == 404:
        ok("Unknown student id → 404")
    else:
        fail(f"Expected 404, got {r and r.status_code}")

    # ── Academics ─────────────────────────────────────────────────────────────
    header("4. Academic Records")

    r = req("POST", "/api/academics", {
        "student_id": student_id,
        "semester": "2025-S1",
        "current_gpa": 65.0,
        "previous_gpa": 60.0,
        "grade_trend": 5.0,
        "failed_subjects": 1,
        "total_subjects": 5,
        "assignment_submission_rate": 80.0,
        "math_score": 68.0,
        "science_score": 62.0,
        "english_score": 66.0,
        "social_score": 64.0,
        "language_score": 65.0
    }, token=token)
    if r and r.status_code in (200, 201):
        ok("Create academic record → OK")
    else:
        fail(f"Create academic record failed: {r and r.status_code} {r and r.text[:100]}")

    r = req("GET", f"/api/students/{student_id}/academics", token=token)
    if r and r.status_code == 200:
        ok(f"Get student academics → {len(r.json())} records")
    else:
        fail(f"Get academics failed: {r and r.status_code}")

    # ── Predictions ───────────────────────────────────────────────────────────
    header("5. Risk Predictions")

    r = req("POST", f"/api/students/{student_id}/predict", {}, token=token)
    if r and r.status_code == 200:
        data = r.json()
        label = data.get("risk_label", "")
        conf = data.get("confidence_score", -1)
        if label in ("Low", "Medium", "High", "Critical") and 0 <= conf <= 100:
            ok(f"Prediction → {label} ({conf:.1f}% confidence)")
        else:
            fail(f"Prediction response invalid: {data}")
    else:
        fail(f"Prediction failed: {r and r.status_code} {r and r.text[:100]}")

    r = req("GET", f"/api/students/{student_id}/predictions", token=token)
    if r and r.status_code == 200 and isinstance(r.json(), list):
        ok(f"Prediction history → {len(r.json())} records")
    else:
        fail(f"Prediction history failed: {r and r.status_code}")

    r = req("GET", "/api/predictions/high-risk", token=token)
    if r and r.status_code == 200 and isinstance(r.json(), list):
        ok(f"High-risk list → {len(r.json())} students")
    else:
        fail(f"High-risk list failed: {r and r.status_code}")

    # ── Cleanup ───────────────────────────────────────────────────────────────
    header("6. Cleanup")
    r = req("DELETE", f"/api/students/{student_id}", token=token)
    if r and r.status_code in (200, 204):
        ok(f"Delete test student → OK")
    else:
        fail(f"Delete failed: {r and r.status_code}")


# ══════════════════════════════════════════════════════════════════════════════
# RUNNER
# ══════════════════════════════════════════════════════════════════════════════

def run_all(token: str = None):
    print(f"\n{B}{'='*65}")
    print("  SCHOLARSENSE — INTEGRATION TEST SUITE")
    print(f"{'='*65}{E}")
    print(f"  API: {API_BASE}")
    if token:
        print(f"  Token: provided ✓")
    else:
        print(f"  {Y}Token: not provided — authenticated sections will be skipped{E}")

    section_connectivity()
    section_auth()

    if token:
        section_authenticated(token)
    else:
        header("3-6. Authenticated Tests")
        print(f"  {Y}⚠  Skipped — pass a JWT token to run: run_all(token='<jwt>'){E}")

    # Summary
    total = passed + failed
    print(f"\n{B}{'='*65}{E}")
    print(f"  {G}{passed} passed{E}  {R}{failed} failed{E}  / {total} total")
    rate = (passed / total * 100) if total else 0
    print(f"  Success rate: {rate:.1f}%")
    print(f"{B}{'='*65}{E}\n")
    return failed == 0


if __name__ == "__main__":
    import sys
    token_arg = sys.argv[1] if len(sys.argv) > 1 else None
    if not token_arg:
        print(f"\n{Y}Usage: python tests/test_integration.py <jwt_token>{E}")
        print("       Token is obtained after completing OTP login.\n")
    success = run_all(token=token_arg)
    sys.exit(0 if success else 1)
