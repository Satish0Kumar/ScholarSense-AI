"""
API Test Suite - ScholarSense
Tests current API endpoints: auth, students, academics, predictions.
"""
import requests
import json

API_BASE = "http://127.0.0.1:5000"

# ── Shared state ───────────────────────────────────────────────────────────────
_token = None
_student_id = None
_academic_id = None


def print_section(title):
    print(f"\n{'='*65}\n  {title}\n{'='*65}")


def req(method, path, data=None, auth=True):
    headers = {"Content-Type": "application/json"}
    if auth and _token:
        headers["Authorization"] = f"Bearer {_token}"
    url = f"{API_BASE}{path}"
    try:
        if method == "GET":
            return requests.get(url, headers=headers, timeout=5)
        if method == "POST":
            return requests.post(url, json=data, headers=headers, timeout=5)
        if method == "PUT":
            return requests.put(url, json=data, headers=headers, timeout=5)
        if method == "DELETE":
            return requests.delete(url, headers=headers, timeout=5)
    except requests.exceptions.ConnectionError:
        return None


# ══════════════════════════════════════════════════════════════════════════════
# 1. HEALTH
# ══════════════════════════════════════════════════════════════════════════════

def test_health():
    print_section("1. Health Check")
    r = req("GET", "/api/health", auth=False)
    assert r and r.status_code == 200, f"Expected 200, got {r and r.status_code}"
    assert r.json().get("status") == "healthy"
    print("✓ /api/health → healthy")


# ══════════════════════════════════════════════════════════════════════════════
# 2. AUTH — credential validation only (OTP flow tested in test_integration.py)
# ══════════════════════════════════════════════════════════════════════════════

def test_login_bad_credentials():
    print_section("2. Auth — Bad Credentials Rejected")
    r = req("POST", "/api/auth/login",
            {"email": "nobody@example.com", "password": "wrong"},
            auth=False)
    assert r and r.status_code == 401, f"Expected 401, got {r and r.status_code}"
    print("✓ Invalid credentials → 401")


def test_login_missing_fields():
    print_section("3. Auth — Missing Fields Rejected")
    r = req("POST", "/api/auth/login", {"email": "admin@scholarsense.com"}, auth=False)
    assert r and r.status_code == 400, f"Expected 400, got {r and r.status_code}"
    print("✓ Missing password → 400")


def test_protected_without_token():
    print_section("4. Auth — Protected Route Without Token")
    r = requests.get(f"{API_BASE}/api/students", timeout=5)
    assert r.status_code == 401, f"Expected 401, got {r.status_code}"
    print("✓ /api/students without token → 401")


# ══════════════════════════════════════════════════════════════════════════════
# NOTE: Tests below require a valid JWT token.
# Set _token manually or run after a successful OTP login.
# ══════════════════════════════════════════════════════════════════════════════

def set_token(token: str):
    global _token
    _token = token


# ══════════════════════════════════════════════════════════════════════════════
# 3. STUDENTS
# ══════════════════════════════════════════════════════════════════════════════

def test_create_student():
    global _student_id
    print_section("5. Students — Create")
    if not _token:
        print("⚠  Skipped (no token)")
        return
    payload = {
        "student_id": "TEST_API_001",
        "first_name": "ApiTest",
        "last_name": "Student",
        "grade": 8,
        "section": "A",
        "gender": "Male",
        "date_of_birth": "2010-06-15",
        "socioeconomic_status": "Medium",
        "parent_education": "Graduate"
    }
    r = req("POST", "/api/students", payload)
    assert r and r.status_code in (200, 201), f"Expected 200/201, got {r and r.status_code}"
    _student_id = r.json().get("id")
    assert _student_id, "No student id in response"
    print(f"✓ Student created → id={_student_id}")


def test_get_students():
    print_section("6. Students — List")
    if not _token:
        print("⚠  Skipped (no token)")
        return
    r = req("GET", "/api/students")
    assert r and r.status_code == 200
    assert isinstance(r.json(), list)
    print(f"✓ /api/students → {len(r.json())} students")


def test_get_student_by_id():
    print_section("7. Students — Get By ID")
    if not _token or not _student_id:
        print("⚠  Skipped (no token or student)")
        return
    r = req("GET", f"/api/students/{_student_id}")
    assert r and r.status_code == 200
    assert r.json().get("id") == _student_id
    print(f"✓ /api/students/{_student_id} → OK")


def test_get_student_not_found():
    print_section("8. Students — 404 For Unknown ID")
    if not _token:
        print("⚠  Skipped (no token)")
        return
    r = req("GET", "/api/students/999999")
    assert r and r.status_code == 404, f"Expected 404, got {r and r.status_code}"
    print("✓ /api/students/999999 → 404")


# ══════════════════════════════════════════════════════════════════════════════
# 4. ACADEMIC RECORDS
# ══════════════════════════════════════════════════════════════════════════════

def test_create_academic_record():
    global _academic_id
    print_section("9. Academics — Create Record")
    if not _token or not _student_id:
        print("⚠  Skipped (no token or student)")
        return
    payload = {
        "student_id": _student_id,
        "semester": "2025-S1",
        "current_gpa": 72.5,
        "previous_gpa": 68.0,
        "grade_trend": 4.5,
        "failed_subjects": 0,
        "total_subjects": 5,
        "assignment_submission_rate": 88.0,
        "math_score": 75.0,
        "science_score": 70.0,
        "english_score": 74.0,
        "social_score": 71.0,
        "language_score": 72.0
    }
    r = req("POST", "/api/academics", payload)
    assert r and r.status_code in (200, 201), f"Expected 200/201, got {r and r.status_code}"
    _academic_id = r.json().get("id")
    print(f"✓ Academic record created → id={_academic_id}")


def test_get_student_academics():
    print_section("10. Academics — Get For Student")
    if not _token or not _student_id:
        print("⚠  Skipped (no token or student)")
        return
    r = req("GET", f"/api/students/{_student_id}/academics")
    assert r and r.status_code == 200
    print(f"✓ /api/students/{_student_id}/academics → OK")


# ══════════════════════════════════════════════════════════════════════════════
# 5. PREDICTIONS
# ══════════════════════════════════════════════════════════════════════════════

def test_make_prediction():
    print_section("11. Predictions — Make Prediction")
    if not _token or not _student_id:
        print("⚠  Skipped (no token or student)")
        return
    r = req("POST", f"/api/students/{_student_id}/predict", {})
    assert r and r.status_code == 200, f"Expected 200, got {r and r.status_code}"
    data = r.json()
    assert "risk_label" in data, f"No risk_label in response: {data}"
    assert data["risk_label"] in ("Low", "Medium", "High", "Critical")
    assert 0 <= data.get("confidence_score", -1) <= 100
    print(f"✓ Prediction → {data['risk_label']} ({data['confidence_score']:.1f}%)")


def test_get_prediction_history():
    print_section("12. Predictions — History")
    if not _token or not _student_id:
        print("⚠  Skipped (no token or student)")
        return
    r = req("GET", f"/api/students/{_student_id}/predictions")
    assert r and r.status_code == 200
    assert isinstance(r.json(), list)
    print(f"✓ Prediction history → {len(r.json())} records")


def test_high_risk_endpoint():
    print_section("13. Predictions — High-Risk List")
    if not _token:
        print("⚠  Skipped (no token)")
        return
    r = req("GET", "/api/predictions/high-risk")
    assert r and r.status_code == 200
    assert isinstance(r.json(), list)
    print(f"✓ /api/predictions/high-risk → {len(r.json())} students")


# ══════════════════════════════════════════════════════════════════════════════
# 6. CLEANUP
# ══════════════════════════════════════════════════════════════════════════════

def test_delete_student():
    print_section("14. Students — Delete (cleanup)")
    if not _token or not _student_id:
        print("⚠  Skipped (no token or student)")
        return
    r = req("DELETE", f"/api/students/{_student_id}")
    assert r and r.status_code in (200, 204), f"Expected 200/204, got {r and r.status_code}"
    print(f"✓ Student {_student_id} deleted")


# ══════════════════════════════════════════════════════════════════════════════
# RUNNER
# ══════════════════════════════════════════════════════════════════════════════

def run_all():
    print("\n" + "="*65)
    print("  SCHOLARSENSE — API TEST SUITE")
    print("="*65)
    print("Ensure backend is running: python backend/api.py")
    print("\nNote: Tests 5-14 require a valid JWT token.")
    print("      Call set_token('<your_token>') before running,")
    print("      or complete OTP login and paste the token.\n")

    passed, failed = 0, 0
    tests = [
        test_health,
        test_login_bad_credentials,
        test_login_missing_fields,
        test_protected_without_token,
        test_create_student,
        test_get_students,
        test_get_student_by_id,
        test_get_student_not_found,
        test_create_academic_record,
        test_get_student_academics,
        test_make_prediction,
        test_get_prediction_history,
        test_high_risk_endpoint,
        test_delete_student,
    ]

    for t in tests:
        try:
            t()
            passed += 1
        except AssertionError as e:
            print(f"✗ FAILED: {t.__name__} — {e}")
            failed += 1
        except Exception as e:
            print(f"✗ ERROR:  {t.__name__} — {e}")
            failed += 1

    print(f"\n{'='*65}")
    print(f"  Results: {passed} passed, {failed} failed / {len(tests)} total")
    print("="*65)


if __name__ == "__main__":
    run_all()
