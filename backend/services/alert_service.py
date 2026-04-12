"""
Alert Service - Academic Performance & Attendance Alerts
ScholarSense - AI-Powered Academic Intelligence System

Handles:
1. Academic Performance Alerts (PDF reports)
2. Attendance Threshold Alerts (Email with text/table)
"""

import sys
from pathlib import Path
from datetime import datetime, date, timedelta

project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

from backend.database.db_config import SessionLocal
from backend.database.models import Student, AcademicRecord, Attendance, RiskPrediction
from backend.services.pdf_service import PDFService
from backend.services.email_service import EmailService
from sqlalchemy import func


class AlertService:
    """Handle academic and attendance alerts"""

    # ══════════════════════════════════════════════════════════════════════════
    # ACADEMIC PERFORMANCE ALERTS (PDF)
    # ══════════════════════════════════════════════════════════════════════════

    @staticmethod
    def send_academic_performance_alert(student_id: int) -> dict:
        """
        Generate and send academic performance alert PDF to parent
        
        Args:
            student_id: Database ID of student
            
        Returns:
            dict with status and message
        """
        db = SessionLocal()
        try:
            # Get student info
            student = db.query(Student).filter(Student.id == student_id).first()
            if not student:
                return {'error': 'Student not found'}

            if not student.parent_email:
                return {'error': 'Parent email not configured for this student'}

            # Generate PDF report
            pdf_bytes = PDFService.generate_academic_performance_alert(student_id)

            # Prepare email
            student_name = f"{student.first_name} {student.last_name}"
            parent_name = student.parent_name or "Parent/Guardian"
            
            subject = f"📊 Academic Performance Alert - {student_name}"
            
            text_body = f"""
Dear {parent_name},

This is an important notification regarding your child {student_name}'s academic performance.

We have prepared a detailed Academic Performance Alert Report that includes:
- Current academic standing and grades
- Risk assessment with identified factors
- Detailed recommendations and action plan
- Suggestions for improvement

Please find the attached PDF report for complete details.

We strongly recommend scheduling a meeting with the class teacher at your earliest convenience to discuss your child's progress and create an intervention plan.

Best regards,
ScholarSense Academic Team
{student.parent_email}
            """.strip()

            html_body = f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0; padding:0; background:#f4f6f9; font-family:Arial, sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9; padding:30px 0;">
    <tr><td align="center">
        <table width="520" cellpadding="0" cellspacing="0"
               style="background:#fff; border-radius:16px; box-shadow:0 4px 20px rgba(0,0,0,0.08); overflow:hidden;">

            <!-- Header -->
            <tr>
                <td style="background:linear-gradient(135deg,#1f77b4,#2563eb); padding:30px 40px; text-align:center;">
                    <div style="font-size:36px;">📊</div>
                    <h1 style="color:#fff; margin:10px 0 0 0; font-size:22px; font-weight:800;">
                        ScholarSense
                    </h1>
                    <p style="color:#bfdbfe; margin:4px 0 0 0; font-size:13px;">
                        Academic Performance Alert
                    </p>
                </td>
            </tr>

            <!-- Alert Banner -->
            <tr>
                <td style="background:#fef3c7; border-left:5px solid #f59e0b; padding:16px 40px;">
                    <p style="color:#f59e0b; font-size:16px; font-weight:700; margin:0;">
                        📉 Academic Performance Alert
                    </p>
                </td>
            </tr>

            <!-- Body -->
            <tr>
                <td style="padding:30px 40px;">
                    <p style="color:#374151; font-size:15px; margin:0 0 6px 0;">
                        Dear <strong>{parent_name}</strong>,
                    </p>
                    <p style="color:#6b7280; font-size:14px; line-height:1.6; margin:0 0 24px 0;">
                        We are writing to inform you about an important update regarding your child's academic performance.
                    </p>

                    <!-- Student Info -->
                    <div style="background:#f9fafb; border-radius:10px; padding:16px 20px; margin-bottom:20px;">
                        <p style="color:#374151; font-size:15px; font-weight:700; margin:0 0 8px 0;">
                            👤 Student Information
                        </p>
                        <p style="color:#6b7280; font-size:14px; margin:0;">
                            <strong>Name:</strong> {student_name}<br>
                            <strong>Grade:</strong> {student.grade} — Section {student.section}
                        </p>
                    </div>

                    <!-- PDF Attachment Notice -->
                    <div style="background:#f0f9ff; border:1px solid #93c5fd; border-radius:10px; padding:16px 20px; margin-bottom:20px;">
                        <p style="color:#1e40af; font-size:14px; font-weight:700; margin:0 0 6px 0;">
                            📎 Detailed Report Attached
                        </p>
                        <p style="color:#374151; font-size:14px; margin:0; line-height:1.6;">
                            A comprehensive Academic Performance Alert Report has been attached to this email. 
                            The report includes:
                        </p>
                        <ul style="color:#374151; font-size:14px; margin:8px 0 0 20px; padding:0;">
                            <li>Current academic standing and grades</li>
                            <li>Risk assessment with identified factors</li>
                            <li>Detailed recommendations and action plan</li>
                            <li>Suggestions for improvement</li>
                        </ul>
                    </div>

                    <!-- Action Required -->
                    <div style="background:#fef2f2; border:1px solid #fca5a5; border-radius:10px; padding:16px 20px;">
                        <p style="color:#991b1b; font-size:14px; margin:0;">
                            📞 <strong>Action Required:</strong>
                            Please contact the school within 3 working days to schedule a meeting 
                            with the class teacher and academic coordinator. Early intervention is 
                            crucial for your child's academic success.
                        </p>
                    </div>
                </td>
            </tr>

            <!-- Footer -->
            <tr>
                <td style="background:#f9fafb; padding:20px 40px; border-top:1px solid #e5e7eb; text-align:center;">
                    <p style="color:#9ca3af; font-size:12px; margin:0;">
                        🏫 Greenwood High School • ScholarSense v2.0
                    </p>
                    <p style="color:#d1d5db; font-size:11px; margin:6px 0 0 0;">
                        This is an automated notification. Please do not reply.
                    </p>
                </td>
            </tr>
        </table>
    </td></tr>
</table>

</body>
</html>
            """.strip()

            # Send email with PDF attachment
            from email.mime.multipart import MIMEMultipart
            from email.mime.text import MIMEText
            from email.mime.base import MIMEBase
            from email import encoders
            import smtplib
            import os

            EMAIL_HOST = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
            EMAIL_PORT = int(os.getenv('EMAIL_PORT', 587))
            EMAIL_USER = os.getenv('EMAIL_USER', '')
            EMAIL_PASSWORD = os.getenv('EMAIL_PASSWORD', '')
            EMAIL_FROM_NAME = os.getenv('EMAIL_FROM_NAME', 'ScholarSense')

            if not EMAIL_USER or not EMAIL_PASSWORD:
                return {'error': 'Email credentials not configured'}

            msg = MIMEMultipart('mixed')
            msg['Subject'] = subject
            msg['From'] = f"{EMAIL_FROM_NAME} <{EMAIL_USER}>"
            msg['To'] = student.parent_email

            # Attach text and HTML
            msg_alt = MIMEMultipart('alternative')
            msg_alt.attach(MIMEText(text_body, 'plain'))
            msg_alt.attach(MIMEText(html_body, 'html'))
            msg.attach(msg_alt)

            # Attach PDF
            pdf_attachment = MIMEBase('application', 'pdf')
            pdf_attachment.set_payload(pdf_bytes)
            encoders.encode_base64(pdf_attachment)
            pdf_attachment.add_header(
                'Content-Disposition',
                f'attachment; filename="Academic_Performance_Alert_{student.student_id}.pdf"'
            )
            msg.attach(pdf_attachment)

            # Send
            server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT)
            server.ehlo()
            server.starttls()
            server.login(EMAIL_USER, EMAIL_PASSWORD)
            server.sendmail(EMAIL_USER, student.parent_email, msg.as_string())
            server.quit()

            return {
                'status': 'success',
                'message': f'Academic performance alert sent to {student.parent_email}',
                'student_name': student_name,
                'parent_email': student.parent_email
            }

        except Exception as e:
            print(f"❌ Error sending academic alert: {e}")
            import traceback
            traceback.print_exc()
            return {'error': str(e)}
        finally:
            db.close()

    # ══════════════════════════════════════════════════════════════════════════
    # ATTENDANCE THRESHOLD ALERTS (Email with Text/Table)
    # ══════════════════════════════════════════════════════════════════════════

    @staticmethod
    def get_students_below_attendance_threshold(threshold: float, grade: int = None, section: str = None) -> list:
        """
        Get list of students with attendance below threshold
        
        Args:
            threshold: Attendance percentage threshold (e.g., 75.0)
            grade: Optional grade filter
            section: Optional section filter
            
        Returns:
            List of dicts with student info and attendance stats
        """
        db = SessionLocal()
        try:
            # Get all active students
            query = db.query(Student).filter(Student.is_active == True)
            
            if grade:
                query = query.filter(Student.grade == grade)
            if section:
                query = query.filter(Student.section == section)
            
            students = query.all()
            
            below_threshold = []
            thirty_days_ago = date.today() - timedelta(days=30)
            
            for student in students:
                # Calculate attendance for last 30 days
                total_days = db.query(func.count(Attendance.id)).filter(
                    Attendance.student_id == student.id,
                    Attendance.attendance_date >= thirty_days_ago
                ).scalar() or 0
                
                present_days = db.query(func.count(Attendance.id)).filter(
                    Attendance.student_id == student.id,
                    Attendance.attendance_date >= thirty_days_ago,
                    Attendance.status == 'present'
                ).scalar() or 0
                
                attendance_rate = (present_days / total_days * 100) if total_days > 0 else 100.0
                
                if attendance_rate < threshold:
                    below_threshold.append({
                        'id': student.id,
                        'student_id': student.student_id,
                        'name': f"{student.first_name} {student.last_name}",
                        'grade': student.grade,
                        'section': student.section,
                        'parent_name': student.parent_name,
                        'parent_email': student.parent_email,
                        'parent_phone': student.parent_phone,
                        'attendance_rate': round(attendance_rate, 1),
                        'total_days': total_days,
                        'present_days': present_days,
                        'absent_days': total_days - present_days
                    })
            
            # Sort by attendance rate (lowest first)
            below_threshold.sort(key=lambda x: x['attendance_rate'])
            
            return below_threshold
            
        finally:
            db.close()

    @staticmethod
    def send_attendance_alert_email(student_data: dict, threshold: float) -> dict:
        """
        Send attendance alert email to parent (simple text/table format)
        
        Args:
            student_data: Dict with student info and attendance stats
            threshold: Attendance threshold that was violated
            
        Returns:
            dict with status and message
        """
        try:
            if not student_data.get('parent_email'):
                return {'error': 'Parent email not available'}

            parent_name = student_data.get('parent_name') or "Parent/Guardian"
            student_name = student_data['name']
            attendance_rate = student_data['attendance_rate']
            
            subject = f"⚠️ Low Attendance Alert - {student_name}"
            
            # Plain text version
            text_body = f"""
Dear {parent_name},

This is an important notification regarding your child {student_name}'s attendance.

ATTENDANCE ALERT
Student has fallen below the required attendance threshold.

STUDENT DETAILS:
Name: {student_name}
Grade: {student_data['grade']} - Section {student_data['section']}
Student ID: {student_data['student_id']}

ATTENDANCE REPORT (Last 30 Days):
Total School Days: {student_data['total_days']}
Days Present: {student_data['present_days']}
Days Absent: {student_data['absent_days']}
Attendance Rate: {attendance_rate}%
Required Threshold: {threshold}%

STATUS: BELOW THRESHOLD by {threshold - attendance_rate:.1f}%

REQUIRED ACTION:
Regular attendance is crucial for academic success. Please ensure your child attends school regularly. 
If there are any health or personal issues affecting attendance, please contact the school immediately.

For any queries, please contact the school office.

Best regards,
ScholarSense Attendance Team
Greenwood High School
            """.strip()

            # HTML version with table
            html_body = f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0; padding:0; background:#f4f6f9; font-family:Arial, sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9; padding:30px 0;">
    <tr><td align="center">
        <table width="520" cellpadding="0" cellspacing="0"
               style="background:#fff; border-radius:16px; box-shadow:0 4px 20px rgba(0,0,0,0.08); overflow:hidden;">

            <!-- Header -->
            <tr>
                <td style="background:linear-gradient(135deg,#1f77b4,#2563eb); padding:30px 40px; text-align:center;">
                    <div style="font-size:36px;">📅</div>
                    <h1 style="color:#fff; margin:10px 0 0 0; font-size:22px; font-weight:800;">
                        ScholarSense
                    </h1>
                    <p style="color:#bfdbfe; margin:4px 0 0 0; font-size:13px;">
                        Attendance Monitoring System
                    </p>
                </td>
            </tr>

            <!-- Alert Banner -->
            <tr>
                <td style="background:#fff7ed; border-left:5px solid #f97316; padding:16px 40px;">
                    <p style="color:#f97316; font-size:16px; font-weight:700; margin:0;">
                        ⚠️ Low Attendance Alert
                    </p>
                </td>
            </tr>

            <!-- Body -->
            <tr>
                <td style="padding:30px 40px;">
                    <p style="color:#374151; font-size:15px; margin:0 0 6px 0;">
                        Dear <strong>{parent_name}</strong>,
                    </p>
                    <p style="color:#6b7280; font-size:14px; line-height:1.6; margin:0 0 24px 0;">
                        This is an important notification regarding your child's attendance.
                    </p>

                    <!-- Student Info -->
                    <div style="background:#f9fafb; border-radius:10px; padding:16px 20px; margin-bottom:20px;">
                        <p style="color:#374151; font-size:15px; font-weight:700; margin:0 0 8px 0;">
                            👤 Student Information
                        </p>
                        <p style="color:#6b7280; font-size:14px; margin:0;">
                            <strong>Name:</strong> {student_name}<br>
                            <strong>Grade:</strong> {student_data['grade']} — Section {student_data['section']}<br>
                            <strong>Student ID:</strong> {student_data['student_id']}
                        </p>
                    </div>

                    <!-- Attendance Table -->
                    <div style="margin-bottom:20px;">
                        <p style="color:#374151; font-size:15px; font-weight:700; margin:0 0 12px 0;">
                            📊 Attendance Report (Last 30 Days)
                        </p>
                        <table width="100%" cellpadding="0" cellspacing="0"
                               style="border:1px solid #e5e7eb; border-radius:10px; overflow:hidden;">
                            <tr style="background:#f9fafb;">
                                <td style="padding:12px; font-weight:700; font-size:13px; color:#374151; border-bottom:1px solid #e5e7eb;">
                                    Metric
                                </td>
                                <td style="padding:12px; font-weight:700; font-size:13px; color:#374151; border-bottom:1px solid #e5e7eb; text-align:right;">
                                    Value
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:10px 12px; color:#6b7280; font-size:13px; border-bottom:1px solid #f3f4f6;">
                                    Total School Days
                                </td>
                                <td style="padding:10px 12px; color:#1f2937; font-size:13px; font-weight:600; border-bottom:1px solid #f3f4f6; text-align:right;">
                                    {student_data['total_days']}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:10px 12px; color:#6b7280; font-size:13px; border-bottom:1px solid #f3f4f6;">
                                    Days Present
                                </td>
                                <td style="padding:10px 12px; color:#059669; font-size:13px; font-weight:600; border-bottom:1px solid #f3f4f6; text-align:right;">
                                    {student_data['present_days']}
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:10px 12px; color:#6b7280; font-size:13px; border-bottom:1px solid #f3f4f6;">
                                    Days Absent
                                </td>
                                <td style="padding:10px 12px; color:#dc2626; font-size:13px; font-weight:600; border-bottom:1px solid #f3f4f6; text-align:right;">
                                    {student_data['absent_days']}
                                </td>
                            </tr>
                            <tr style="background:#fef2f2;">
                                <td style="padding:12px; color:#991b1b; font-size:14px; font-weight:700;">
                                    Attendance Rate
                                </td>
                                <td style="padding:12px; color:#dc2626; font-size:16px; font-weight:800; text-align:right;">
                                    {attendance_rate}%
                                </td>
                            </tr>
                            <tr style="background:#f0fdf4;">
                                <td style="padding:12px; color:#166534; font-size:13px; font-weight:600;">
                                    Required Threshold
                                </td>
                                <td style="padding:12px; color:#059669; font-size:14px; font-weight:700; text-align:right;">
                                    {threshold}%
                                </td>
                            </tr>
                        </table>
                    </div>

                    <!-- Status Alert -->
                    <div style="background:#fef2f2; border:1px solid #fca5a5; border-radius:10px; padding:16px 20px; margin-bottom:20px;">
                        <p style="color:#991b1b; font-size:14px; font-weight:700; margin:0 0 6px 0;">
                            🚨 STATUS: BELOW THRESHOLD
                        </p>
                        <p style="color:#991b1b; font-size:14px; margin:0;">
                            Student's attendance is <strong>{threshold - attendance_rate:.1f}%</strong> below the required threshold.
                        </p>
                    </div>

                    <!-- Action Required -->
                    <div style="background:#f0fdf4; border:1px solid #86efac; border-radius:10px; padding:16px 20px;">
                        <p style="color:#166534; font-size:14px; margin:0;">
                            📞 <strong>Action Required:</strong>
                            Regular attendance is crucial for academic success. Please ensure your child attends 
                            school regularly. If there are any health or personal issues affecting attendance, 
                            please contact the school immediately.
                        </p>
                    </div>
                </td>
            </tr>

            <!-- Footer -->
            <tr>
                <td style="background:#f9fafb; padding:20px 40px; border-top:1px solid #e5e7eb; text-align:center;">
                    <p style="color:#9ca3af; font-size:12px; margin:0;">
                        🏫 Greenwood High School • ScholarSense v2.0
                    </p>
                    <p style="color:#d1d5db; font-size:11px; margin:6px 0 0 0;">
                        This is an automated notification. Please do not reply.
                    </p>
                </td>
            </tr>
        </table>
    </td></tr>
</table>

</body>
</html>
            """.strip()

            # Send email
            result = EmailService.send_email(
                to_email=student_data['parent_email'],
                subject=subject,
                text_body=text_body,
                html_body=html_body
            )

            return result

        except Exception as e:
            print(f"❌ Error sending attendance alert: {e}")
            return {'error': str(e)}

    @staticmethod
    def send_bulk_attendance_alerts(threshold: float, grade: int = None, section: str = None) -> dict:
        """
        Send attendance alerts to all students below threshold
        
        Args:
            threshold: Attendance percentage threshold
            grade: Optional grade filter
            section: Optional section filter
            
        Returns:
            dict with summary of sent alerts
        """
        try:
            # Get students below threshold
            students = AlertService.get_students_below_attendance_threshold(threshold, grade, section)
            
            if not students:
                return {
                    'status': 'success',
                    'message': 'No students below threshold',
                    'total': 0,
                    'sent': 0,
                    'failed': 0
                }
            
            sent = 0
            failed = 0
            failed_list = []
            
            for student in students:
                result = AlertService.send_attendance_alert_email(student, threshold)
                if result.get('status') == 'sent':
                    sent += 1
                else:
                    failed += 1
                    failed_list.append({
                        'student': student['name'],
                        'error': result.get('message', 'Unknown error')
                    })
            
            return {
                'status': 'success',
                'message': f'Sent {sent} alerts, {failed} failed',
                'total': len(students),
                'sent': sent,
                'failed': failed,
                'failed_list': failed_list,
                'threshold': threshold
            }
            
        except Exception as e:
            print(f"❌ Error sending bulk attendance alerts: {e}")
            return {'error': str(e)}


# Test function
if __name__ == "__main__":
    print("=" * 60)
    print("🧪 TESTING ALERT SERVICE")
    print("=" * 60)
    
    # Test 1: Get students below threshold
    print("\n1. Testing attendance threshold check (75%)...")
    students = AlertService.get_students_below_attendance_threshold(75.0)
    print(f"   Found {len(students)} students below 75% attendance")
    if students:
        for s in students[:3]:
            print(f"   - {s['name']}: {s['attendance_rate']}%")
    
    print("\n" + "=" * 60)
