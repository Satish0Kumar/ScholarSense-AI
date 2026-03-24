"""
Email Service - Shared SMTP Email Sender
ScholarSense - AI-Powered Academic Intelligence System

Handles all outgoing emails:
- OTP verification emails (Enhancement 2)
- Parent notification emails (Enhancement 3)

Uses Gmail SMTP with App Password.
"""

import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from datetime import datetime


from dotenv import load_dotenv
from pathlib import Path

# Explicitly point to backend/.env
env_path = Path(__file__).parent.parent / ".env"
load_dotenv(dotenv_path=env_path)


# ── Email Configuration from .env ─────────────────────────────────────────────
EMAIL_HOST      = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
EMAIL_PORT      = int(os.getenv('EMAIL_PORT', 587))
EMAIL_USER      = os.getenv('EMAIL_USER', '')
EMAIL_PASSWORD  = os.getenv('EMAIL_PASSWORD', '')
EMAIL_FROM_NAME = os.getenv('EMAIL_FROM_NAME', 'ScholarSense')


class EmailService:
    """Shared SMTP email sender for all ScholarSense emails"""

    # ──────────────────────────────────────────────────────────────────────────
    @staticmethod
    def _get_smtp_connection():
        """
        Create and return authenticated SMTP connection.
        Returns: smtplib.SMTP object
        """
        if not EMAIL_USER or not EMAIL_PASSWORD:
            raise ValueError(
                "Email credentials not configured. "
                "Set EMAIL_USER and EMAIL_PASSWORD in backend/.env"
            )

        server = smtplib.SMTP(EMAIL_HOST, EMAIL_PORT)
        server.ehlo()
        server.starttls()
        server.login(EMAIL_USER, EMAIL_PASSWORD)
        return server

    # ──────────────────────────────────────────────────────────────────────────
    @staticmethod
    def send_email(
        to_email   : str,
        subject    : str,
        text_body  : str,
        html_body  : str = None
    ) -> dict:
        """
        Send an email via Gmail SMTP.

        Args:
            to_email  : Recipient email address
            subject   : Email subject line
            text_body : Plain text version of email
            html_body : HTML version of email (optional)

        Returns:
            dict with status: 'sent' | 'failed'
        """
        try:
            # ── Build message ───────────────────────────────────────────────
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From']    = f"{EMAIL_FROM_NAME} <{EMAIL_USER}>"
            msg['To']      = to_email

            # Attach plain text
            msg.attach(MIMEText(text_body, 'plain'))

            # Attach HTML if provided
            if html_body:
                msg.attach(MIMEText(html_body, 'html'))

            # ── Send ────────────────────────────────────────────────────────
            server = EmailService._get_smtp_connection()
            server.sendmail(EMAIL_USER, to_email, msg.as_string())
            server.quit()

            print(f"Email sent to {to_email} | Subject: {subject}")
            return {
                'status' : 'sent',
                'message': f'Email sent to {to_email}'
            }

        except smtplib.SMTPAuthenticationError:
            print("SMTP Authentication failed. Check EMAIL_USER and EMAIL_PASSWORD in .env")
            return {
                'status' : 'failed',
                'message': 'Email authentication failed. Check credentials in .env'
            }

        except smtplib.SMTPRecipientsRefused:
            print(f"Recipient refused: {to_email}")
            return {
                'status' : 'failed',
                'message': f'Invalid recipient email: {to_email}'
            }

        except smtplib.SMTPException as e:
            print(f"SMTP error: {e}")
            return {
                'status' : 'failed',
                'message': f'SMTP error: {str(e)}'
            }

        except Exception as e:
            print(f"Email send error: {e}")
            return {
                'status' : 'failed',
                'message': str(e)
            }

    # ──────────────────────────────────────────────────────────────────────────
    @staticmethod
    def send_otp_email(
        to_email  : str,
        user_name : str,
        otp_code  : str
    ) -> dict:
        """
        Send OTP verification email to user.

        Args:
            to_email  : User's registered email
            user_name : User's full name
            otp_code  : 6-digit OTP code

        Returns:
            dict with status: 'sent' | 'failed'
        """
        subject = "🔐 Your ScholarSense Login OTP"

        # ── Plain text version ───────────────────────────────────────────────
        text_body = f"""
Hello {user_name},

Your ScholarSense login OTP is: {otp_code}

This OTP is valid for 5 minutes only.
Do NOT share this OTP with anyone.

If you did not request this, please contact your system administrator immediately.

Best regards,
ScholarSense Security Team
        """.strip()

        # ── HTML version ─────────────────────────────────────────────────────
        html_body = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background-color:#f4f6f9; 
             font-family: Arial, sans-serif;">

    <!-- Wrapper -->
    <table width="100%" cellpadding="0" cellspacing="0" 
           style="background-color:#f4f6f9; padding: 30px 0;">
        <tr>
            <td align="center">

                <!-- Email Card -->
                <table width="500" cellpadding="0" cellspacing="0"
                       style="background:#ffffff; border-radius:16px;
                              box-shadow: 0 4px 20px rgba(0,0,0,0.08);
                              overflow:hidden;">

                    <!-- Header Banner -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #1f77b4, #2563eb);
                                   padding: 35px 40px; text-align:center;">
                            <div style="font-size:40px; margin-bottom:10px;">🎓</div>
                            <h1 style="color:#ffffff; margin:0; font-size:26px;
                                       font-weight:800; letter-spacing:-0.5px;">
                                ScholarSense
                            </h1>
                            <p style="color:#bfdbfe; margin:6px 0 0 0; font-size:14px;">
                                AI-Powered Academic Intelligence System
                            </p>
                        </td>
                    </tr>

                    <!-- Body -->
                    <tr>
                        <td style="padding: 40px;">

                            <p style="color:#374151; font-size:16px; margin:0 0 8px 0;">
                                Hello <strong>{user_name}</strong>,
                            </p>

                            <p style="color:#6b7280; font-size:15px; 
                                      line-height:1.6; margin:0 0 30px 0;">
                                You requested to login to ScholarSense. 
                                Use the OTP below to complete your login.
                            </p>

                            <!-- OTP Box -->
                            <div style="background: #f0f9ff; 
                                        border: 2px dashed #2563eb;
                                        border-radius: 12px;
                                        padding: 30px;
                                        text-align: center;
                                        margin: 0 0 30px 0;">
                                <p style="color:#6b7280; font-size:13px; 
                                          margin:0 0 10px 0; text-transform:uppercase;
                                          letter-spacing:1px;">
                                    Your One-Time Password
                                </p>
                                <div style="font-size: 48px; font-weight: 900;
                                            letter-spacing: 12px; color: #1d4ed8;
                                            font-family: 'Courier New', monospace;">
                                    {otp_code}
                                </div>
                                <p style="color:#ef4444; font-size:13px; 
                                          margin:14px 0 0 0; font-weight:600;">
                                    ⏱️ Valid for 5 minutes only
                                </p>
                            </div>

                            <!-- Warning -->
                            <div style="background:#fff7ed; border-left:4px solid #f97316;
                                        border-radius:8px; padding:16px; margin:0 0 25px 0;">
                                <p style="color:#92400e; font-size:14px; margin:0;">
                                    🔒 <strong>Security Notice:</strong> 
                                    Do NOT share this OTP with anyone. 
                                    ScholarSense will never ask for your OTP.
                                </p>
                            </div>

                            <p style="color:#9ca3af; font-size:13px; margin:0;">
                                If you did not request this login, please contact 
                                your system administrator immediately.
                            </p>

                        </td>
                    </tr>

                    <!-- Footer -->
                    <tr>
                        <td style="background:#f9fafb; padding:20px 40px;
                                   border-top:1px solid #e5e7eb; text-align:center;">
                            <p style="color:#9ca3af; font-size:12px; margin:0;">
                                🏫 Greenwood High School • ScholarSense v2.0
                            </p>
                            <p style="color:#d1d5db; font-size:11px; margin:6px 0 0 0;">
                                This is an automated email. Please do not reply.
                            </p>
                        </td>
                    </tr>

                </table>
                <!-- End Email Card -->

            </td>
        </tr>
    </table>

</body>
</html>
        """.strip()

        return EmailService.send_email(
            to_email  = to_email,
            subject   = subject,
            text_body = text_body,
            html_body = html_body
        )


    @staticmethod
    def send_parent_notification(
        to_email      : str,
        parent_name   : str,
        student_name  : str,
        student_grade : int,
        student_section: str,
        notification_type: str,
        trigger_reason: str,
        details       : dict = None
    ) -> dict:
        """
        Send parent notification email for academic alerts.

        Args:
            to_email         : Parent's email address
            parent_name      : Parent's full name
            student_name     : Student's full name
            student_grade    : Student's grade (6-10)
            student_section  : Student's section (A/B/C)
            notification_type: 'low_gpa' | 'high_risk' | 'low_attendance' | 'failed_subjects'
            trigger_reason   : Human-readable reason
            details          : Extra details dict (gpa, attendance_rate, etc.)

        Returns:
            dict with status: 'sent' | 'failed'
        """

        # ── Subject and icon per type ────────────────────────────────────────
        type_config = {
            'low_gpa': {
                'subject' : '📉 Academic Performance Alert',
                'icon'    : '📉',
                'color'   : '#f59e0b',
                'bg'      : '#fffbeb',
                'border'  : '#fcd34d',
                'title'   : 'Low Academic Performance Alert'
            },
            'high_risk': {
                'subject' : '🚨 Student At-Risk Notification',
                'icon'    : '🚨',
                'color'   : '#ef4444',
                'bg'      : '#fef2f2',
                'border'  : '#fca5a5',
                'title'   : 'Student At-Risk Notification'
            },
            'low_attendance': {
                'subject' : '📅 Low Attendance Warning',
                'icon'    : '📅',
                'color'   : '#f97316',
                'bg'      : '#fff7ed',
                'border'  : '#fdba74',
                'title'   : 'Low Attendance Warning'
            },
            'failed_subjects': {
                'subject' : '📝 Subject Failure Alert',
                'icon'    : '📝',
                'color'   : '#8b5cf6',
                'bg'      : '#f5f3ff',
                'border'  : '#c4b5fd',
                'title'   : 'Subject Failure Alert'
            }
        }

        cfg     = type_config.get(notification_type, type_config['high_risk'])
        subject = f"{cfg['subject']} — {student_name}"

        # ── Build details rows ───────────────────────────────────────────────
        details_rows = ''
        if details:
            for key, value in details.items():
                details_rows += f"""
                <tr>
                    <td style="padding:8px 12px; color:#6b7280;
                               font-size:14px; border-bottom:1px solid #f3f4f6;">
                        {key}
                    </td>
                    <td style="padding:8px 12px; color:#1f2937;
                               font-size:14px; font-weight:600;
                               border-bottom:1px solid #f3f4f6;">
                        {value}
                    </td>
                </tr>
                """

        # ── Plain text ───────────────────────────────────────────────────────
        text_body = f"""
Dear {parent_name},

This is an important notification regarding your child {student_name} 
(Grade {student_grade} - Section {student_section}).

{cfg['title'].upper()}

Reason: {trigger_reason}

Please contact the school for further details or to schedule a meeting 
with the class teacher.

Best regards,
ScholarSense Academic Team
Greenwood High School
        """.strip()

        # ── HTML ─────────────────────────────────────────────────────────────
        html_body = f"""
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0; padding:0; background:#f4f6f9;
             font-family:Arial, sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0"
       style="background:#f4f6f9; padding:30px 0;">
    <tr><td align="center">

        <table width="520" cellpadding="0" cellspacing="0"
               style="background:#fff; border-radius:16px;
                      box-shadow:0 4px 20px rgba(0,0,0,0.08);
                      overflow:hidden;">

            <!-- Header -->
            <tr>
                <td style="background:linear-gradient(135deg,#1f77b4,#2563eb);
                           padding:30px 40px; text-align:center;">
                    <div style="font-size:36px;">{cfg['icon']}</div>
                    <h1 style="color:#fff; margin:10px 0 0 0;
                               font-size:22px; font-weight:800;">
                        ScholarSense
                    </h1>
                    <p style="color:#bfdbfe; margin:4px 0 0 0; font-size:13px;">
                        Academic Intelligence System — Parent Notification
                    </p>
                </td>
            </tr>

            <!-- Alert Banner -->
            <tr>
                <td style="background:{cfg['bg']}; border-left:5px solid {cfg['color']};
                           padding:16px 40px;">
                    <p style="color:{cfg['color']}; font-size:16px;
                              font-weight:700; margin:0;">
                        {cfg['icon']} {cfg['title']}
                    </p>
                </td>
            </tr>

            <!-- Body -->
            <tr>
                <td style="padding:30px 40px;">

                    <p style="color:#374151; font-size:15px; margin:0 0 6px 0;">
                        Dear <strong>{parent_name}</strong>,
                    </p>
                    <p style="color:#6b7280; font-size:14px;
                              line-height:1.6; margin:0 0 24px 0;">
                        We are writing to inform you about an important update
                        regarding your child's academic progress.
                    </p>

                    <!-- Student Info Card -->
                    <div style="background:#f9fafb; border-radius:10px;
                                padding:16px 20px; margin-bottom:20px;">
                        <p style="color:#374151; font-size:15px;
                                  font-weight:700; margin:0 0 8px 0;">
                            👤 Student Information
                        </p>
                        <p style="color:#6b7280; font-size:14px; margin:0;">
                            <strong>Name    :</strong> {student_name}<br>
                            <strong>Grade   :</strong> {student_grade} —
                            Section {student_section}
                        </p>
                    </div>

                    <!-- Alert Reason -->
                    <div style="background:{cfg['bg']}; border:1px solid {cfg['border']};
                                border-radius:10px; padding:16px 20px;
                                margin-bottom:20px;">
                        <p style="color:#374151; font-size:14px;
                                  font-weight:700; margin:0 0 6px 0;">
                            ⚠️ Alert Reason
                        </p>
                        <p style="color:#374151; font-size:14px;
                                  margin:0; line-height:1.6;">
                            {trigger_reason}
                        </p>
                    </div>

                    <!-- Details Table -->
                    {f'''
                    <table width="100%" cellpadding="0" cellspacing="0"
                           style="border:1px solid #e5e7eb; border-radius:10px;
                                  overflow:hidden; margin-bottom:20px;">
                        <tr style="background:#f9fafb;">
                            <td colspan="2" style="padding:10px 12px;
                                font-weight:700; font-size:14px; color:#374151;">
                                📊 Academic Details
                            </td>
                        </tr>
                        {details_rows}
                    </table>
                    ''' if details_rows else ''}

                    <!-- Action Notice -->
                    <div style="background:#f0fdf4; border:1px solid #86efac;
                                border-radius:10px; padding:16px 20px;">
                        <p style="color:#166534; font-size:14px; margin:0;">
                            📞 <strong>Action Required:</strong>
                            Please contact the school at your earliest convenience
                            to discuss your child's progress and schedule a
                            meeting with the class teacher.
                        </p>
                    </div>

                </td>
            </tr>

            <!-- Footer -->
            <tr>
                <td style="background:#f9fafb; padding:20px 40px;
                           border-top:1px solid #e5e7eb; text-align:center;">
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

        return EmailService.send_email(
            to_email  = to_email,
            subject   = subject,
            text_body = text_body,
            html_body = html_body
        )



    # ──────────────────────────────────────────────────────────────────────────
    @staticmethod
    def test_connection() -> dict:
        """
        Test SMTP connection without sending email.
        Use this to verify credentials are correct.

        Returns:
            dict with status: 'connected' | 'failed'
        """
        try:
            server = EmailService._get_smtp_connection()
            server.quit()
            print(f"SMTP connection successful ({EMAIL_HOST}:{EMAIL_PORT})")
            return {
                'status' : 'connected',
                'message': f'SMTP connected to {EMAIL_HOST}:{EMAIL_PORT}',
                'user'   : EMAIL_USER
            }
        except ValueError as e:
            return {'status': 'failed', 'message': str(e)}
        except Exception as e:
            print(f"SMTP connection failed: {e}")
            return {
                'status' : 'failed',
                'message': str(e)
            }




# ── Quick test ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("=" * 55)
    print("🧪 TESTING EMAIL SERVICE")
    print("=" * 55)

    # Test connection first
    print("\n1. Testing SMTP connection...")
    result = EmailService.test_connection()
    print(f"   Status: {result['status']}")
    print(f"   Message: {result['message']}")

    if result['status'] == 'connected':
        # Send test OTP email
        test_email = input(
            "\n2. Enter email to send test OTP (or press Enter to skip): "
        ).strip()

        if test_email:
            print(f"\n   Sending test OTP to {test_email}...")
            send_result = EmailService.send_otp_email(
                to_email  = test_email,
                user_name = "Test User",
                otp_code  = "847392"
            )
            print(f"   Status : {send_result['status']}")
            print(f"   Message: {send_result['message']}")
        else:
            print("\n   ⏭️  Skipping test email send.")

    print("\n" + "=" * 55)
