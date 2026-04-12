"""
Test Alert System
Quick test to verify alert service and routes are working
"""

import sys
from pathlib import Path

project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from backend.services.alert_service import AlertService
from backend.services.student_service import StudentService

print("=" * 70)
print("🧪 TESTING ALERT SYSTEM")
print("=" * 70)

# Test 1: Check students below attendance threshold
print("\n1. Testing Attendance Threshold Check (75%)...")
try:
    students = AlertService.get_students_below_attendance_threshold(75.0)
    print(f"   ✅ Found {len(students)} students below 75% attendance")
    if students:
        for s in students[:3]:
            print(f"      - {s['name']}: {s['attendance_rate']}% (Grade {s['grade']}-{s['section']})")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 2: Get high-risk students for academic alerts
print("\n2. Testing High-Risk Student Retrieval...")
try:
    from backend.services.prediction_service import PredictionService
    high_risk = PredictionService.get_high_risk_students()
    print(f"   ✅ Found {len(high_risk)} high-risk students")
    if high_risk:
        for item in high_risk[:3]:
            student = item['student']
            prediction = item['prediction']
            print(f"      - {student['first_name']} {student['last_name']}: {prediction['risk_label']} risk")
except Exception as e:
    print(f"   ❌ Error: {e}")

# Test 3: Test PDF generation (without sending)
print("\n3. Testing Academic Performance PDF Generation...")
try:
    students = StudentService.get_all_students()
    if students:
        test_student_id = students[0]['id']
        from backend.services.pdf_service import PDFService
        pdf_bytes = PDFService.generate_academic_performance_alert(test_student_id)
        print(f"   ✅ PDF generated successfully ({len(pdf_bytes)} bytes)")
        print(f"      Student ID: {test_student_id}")
    else:
        print("   ⚠️  No students found to test PDF generation")
except Exception as e:
    print(f"   ❌ Error: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "=" * 70)
print("✅ Alert System Test Complete!")
print("=" * 70)
