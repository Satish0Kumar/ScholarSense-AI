"""
Parent Communication Service
ScholarSense - AI-Powered Academic Intelligence System
Enhancement 9: Email parents via Gmail SMTP
"""

import os
import smtplib
import uuid
from datetime import datetime, timedelta
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from sqlalchemy import and_, desc, func
from dotenv import load_dotenv

from backend.database.models import Communication, Student, RiskPrediction
from backend.database.db_config import SessionLocal

load_dotenv()

# ============================================
# EMAIL CONFIG FROM .env
# ============================================
EMAIL_HOST      = os.getenv('EMAIL_HOST',      'smtp.gmail.com')
EMAIL_PORT      = int(os.getenv('EMAIL_PORT',  587))
EMAIL_USER      = os.getenv('EMAIL_USER',      '')
EMAIL_PASSWORD  = os.getenv('EMAIL_PASSWORD',  '')
SENDER_NAME     = os.getenv('SENDER_NAME',     'ScholarSense')
SENDER_EMAIL    = os.getenv('SENDER_EMAIL',    EMAIL_USER)

# ============================================
# COMMUNICATION TYPES
# ============================================
COMM_TYPES = [
    'Risk Alert', 'Academic Warning',
    'Behavioral Notice', 'General Update',
    'Attendance Alert', 'Marks Report', 'Custom'
]

# ============================================
# EMAIL TEMPLATES
# ============================================
TEMPLATES = {

    'Risk Alert': {
        'subject': '⚠️ Risk Alert: {student_name} Needs Your Attention',
        'body': """
Dear {parent_name},

I hope this message finds you well.

We are writing to inform you that our academic monitoring system has 
identified your child, **{student_name}** (Grade {grade}{section}), 
as being at **{risk_label} Risk** of academic underperformance.

**Current Status:**
- Risk Level: {risk_label}
- GPA: {gpa}%
- Failed Subjects: {failed_subjects}

We strongly recommend scheduling a meeting with the class teacher 
at your earliest convenience to discuss a support plan.

Please feel free to contact the school for further details.

Warm regards,
{sender_name}
ScholarSense Academic Intelligence System
        """.strip()
    },

    'Academic Warning': {
        'subject': '📚 Academic Warning: {student_name} — Immediate Attention Required',
        'body': """
Dear {parent_name},

This is an academic warning regarding your child 
**{student_name}** (Grade {grade}{section}).

**Academic Performance Summary:**
- Current GPA: {gpa}%
- Subjects Failed: {failed_subjects}
- Semester: {semester}

Your child is at risk of not meeting the minimum academic 
requirements for promotion to the next grade.

We urge you to:
1. Review your child's study schedule at home
2. Ensure homework and assignments are completed on time
3. Schedule a parent-teacher meeting this week

Together, we can help {student_name} improve their performance.

Warm regards,
{sender_name}
ScholarSense Academic Intelligence System
        """.strip()
    },

    'Behavioral Notice': {
        'subject': '📋 Behavioral Notice: {student_name}',
        'body': """
Dear {parent_name},

We wish to bring to your attention a behavioral concern 
regarding your child **{student_name}** (Grade {grade}{section}).

A behavioral incident has been recorded in our system. 
We believe that with your support and cooperation at home, 
we can address this effectively together.

We kindly request you to:
1. Discuss appropriate school behavior with your child
2. Contact the class teacher for full incident details
3. Sign and return the acknowledgment slip if sent home

We appreciate your partnership in your child's development.

Warm regards,
{sender_name}
ScholarSense Academic Intelligence System
        """.strip()
    },

    'Attendance Alert': {
        'subject': '🗓️ Attendance Alert: {student_name} — Low Attendance',
        'body': """
Dear {parent_name},

We are concerned about the attendance record of your child 
**{student_name}** (Grade {grade}{section}).

Low attendance significantly impacts academic performance 
and is flagged as a risk factor in our monitoring system.

Please ensure your child attends school regularly. 
If there are any medical or personal reasons for absence, 
kindly inform the school office promptly.

We are here to support you and your child.

Warm regards,
{sender_name}
ScholarSense Academic Intelligence System
        """.strip()
    },

    'Marks Report': {
        'subject': '📊 Marks Report: {student_name} — {semester}',
        'body': """
Dear {parent_name},

Please find below the latest marks summary for your child 
**{student_name}** (Grade {grade}{section}).

**Performance Summary:**
- Semester: {semester}
- Overall GPA: {gpa}%
- Total Marks: {total_marks}/500
- Subjects Failed: {failed_subjects}

We encourage you to review these results with your child 
and motivate them to work on areas of improvement.

For detailed subject-wise marks, please contact the school office.

Warm regards,
{sender_name}
ScholarSense Academic Intelligence System
        """.strip()
    },

    'General Update': {
        'subject': '🏫 Update Regarding {student_name}',
        'body': """
Dear {parent_name},

We are writing to share a general update regarding 
your child **{student_name}** (Grade {grade}{section}).

{custom_message}

Thank you for your continued support and involvement 
in your child's education.

Warm regards,
{sender_name}
ScholarSense Academic Intelligence System
        """.strip()
    },

    'Custom': {
        'subject': '{custom_subject}',
        'body':    '{custom_message}'
    }
}


# ============================================
# COMMUNICATION SERVICE
# ============================================
class CommunicationService:
    """Parent Communication via Gmail SMTP"""

    @staticmethod
    def get_db():
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()

    # ──────────────────────────────────────────
    # CORE: SEND EMAIL VIA SMTP
    # ──────────────────────────────────────────

    @staticmethod
    def _send_email(
        to_email: str,
        to_name:  str,
        subject:  str,
        body:     str
    ) -> dict:
        """
        Send email via Gmail SMTP
        Returns: {"success": True, "message_id": "..."} or
                 {"success": False, "error": "..."}
        """
        try:
            msg = MIMEMultipart('alternative')
            msg['Subject'] = subject
            msg['From']    = f"{SENDER_NAME} <{SENDER_EMAIL}>"
            msg['To']      = f"{to_name} <{to_email}>"

            # Plain text version
            plain_body = body.replace('**', '').replace('*', '')
            msg.attach(MIMEText(plain_body, 'plain'))

            # HTML version — convert basic markdown to HTML
            html_body = body \
                .replace('**', '<b>') \
                .replace('**', '</b>') \
                .replace('\n', '<br/>') \
                .replace('- ', '&nbsp;&nbsp;• ')

            html_full = f"""
            <html><body style="font-family:Arial,sans-serif;
                               font-size:14px; color:#1a202c;
                               line-height:1.7; padding:20px;">
                <div style="max-width:600px; margin:0 auto;
                            border:1px solid #e2e8f0;
                            border-radius:12px; padding:30px;">
                    <div style="border-bottom:3px solid #2563eb;
                                padding-bottom:10px; margin-bottom:20px;">
                        <h2 style="color:#2563eb; margin:0;">
                            🎓 ScholarSense
                        </h2>
                        <p style="color:#4a5568; margin:4px 0 0 0;
                                  font-size:12px;">
                            AI-Powered Academic Intelligence System
                        </p>
                    </div>
                    <div>{html_body}</div>
                    <div style="margin-top:30px; padding-top:15px;
                                border-top:1px solid #e2e8f0;
                                font-size:11px; color:#718096;">
                        This is an automated message from ScholarSense.
                        Please do not reply directly to this email.
                    </div>
                </div>
            </body></html>
            """
            msg.attach(MIMEText(html_full, 'html'))

            # Send via Gmail SMTP
            with smtplib.SMTP(EMAIL_HOST, EMAIL_PORT) as server:
                server.ehlo()
                server.starttls()
                server.login(EMAIL_USER, EMAIL_PASSWORD)
                server.sendmail(SENDER_EMAIL, to_email, msg.as_string())

            message_id = str(uuid.uuid4())
            print(f"✅ Email sent to {to_email} | ID: {message_id}")

            return {
                "success":    True,
                "message_id": message_id
            }

        except smtplib.SMTPAuthenticationError:
            error = "Gmail authentication failed. Check EMAIL_USER and EMAIL_PASSWORD in .env"
            print(f"❌ SMTP Auth Error: {error}")
            return {"success": False, "error": error}

        except smtplib.SMTPException as e:
            error = f"SMTP error: {str(e)}"
            print(f"❌ SMTP Error: {error}")
            return {"success": False, "error": error}

        except Exception as e:
            error = f"Email send failed: {str(e)}"
            print(f"❌ Email error: {error}")
            return {"success": False, "error": error}

    # ──────────────────────────────────────────
    # BUILD MESSAGE FROM TEMPLATE
    # ──────────────────────────────────────────

    @staticmethod
    def build_message(
        template_type: str,
        student:       object,
        extra_data:    dict = {}
    ) -> dict:
        """
        Build subject + body from template
        Returns: {"subject": "...", "body": "..."}
        """
        template = TEMPLATES.get(template_type, TEMPLATES['Custom'])

        # Base variables
        vars = {
            'student_name':   student.full_name,
            'parent_name':    student.parent_name or 'Parent/Guardian',
            'grade':          str(student.grade),
            'section':        student.section or '',
            'sender_name':    SENDER_NAME,
            'gpa':            extra_data.get('gpa', 'N/A'),
            'failed_subjects':extra_data.get('failed_subjects', 0),
            'risk_label':     extra_data.get('risk_label', 'N/A'),
            'semester':       extra_data.get('semester', 'Current Semester'),
            'total_marks':    extra_data.get('total_marks', 'N/A'),
            'custom_message': extra_data.get('custom_message', ''),
            'custom_subject': extra_data.get('custom_subject', 'Update')
        }

        subject = template['subject'].format(**vars)
        body    = template['body'].format(**vars)

        return {"subject": subject, "body": body}

    # ──────────────────────────────────────────
    # SEND COMMUNICATION (Main Entry Point)
    # ──────────────────────────────────────────

    @staticmethod
    def send_communication(data: dict, sent_by: int) -> dict:
        """
        Send email to parent + log to communications table
        Args:
            data: {
                student_id, communication_type,
                custom_subject (optional), custom_message (optional),
                extra_data (optional dict)
            }
            sent_by: user ID sending
        Returns:
            {"status": "success", "data": communication_dict}
        """
        db = next(CommunicationService.get_db())
        try:
            # Validate required
            if 'student_id' not in data:
                return {"status": "error", "message": "student_id required"}

            comm_type = data.get('communication_type', 'Custom')
            if comm_type not in COMM_TYPES:
                return {
                    "status":  "error",
                    "message": f"Invalid type. Must be one of: {COMM_TYPES}"
                }

            # Fetch student
            student = db.query(Student).filter(
                Student.id        == data['student_id'],
                Student.is_active == True
            ).first()

            if not student:
                return {
                    "status":  "error",
                    "message": "Student not found or inactive"
                }

            if not student.parent_email:
                return {
                    "status":  "error",
                    "message": f"No parent email on file for {student.full_name}"
                }

            # Build message
            extra_data = data.get('extra_data', {})
            if data.get('custom_message'):
                extra_data['custom_message'] = data['custom_message']
            if data.get('custom_subject'):
                extra_data['custom_subject']  = data['custom_subject']

            message = CommunicationService.build_message(
                comm_type, student, extra_data
            )

            subject = data.get('custom_subject') \
                      if comm_type == 'Custom' \
                      else message['subject']
            body    = data.get('custom_message') \
                      if comm_type == 'Custom' \
                      else message['body']

            # Send email
            email_result = CommunicationService._send_email(
                to_email = student.parent_email,
                to_name  = student.parent_name or 'Parent/Guardian',
                subject  = subject,
                body     = body
            )

            # Log to DB
            status      = 'sent'   if email_result['success'] else 'failed'
            message_id  = email_result.get('message_id')
            error_msg   = email_result.get('error')

            comm = Communication(
                student_id         = student.id,
                parent_email       = student.parent_email,
                parent_name        = student.parent_name,
                subject            = subject,
                message_body       = body,
                template_used      = comm_type,
                communication_type = comm_type,
                risk_label         = extra_data.get('risk_label'),
                sent_by            = sent_by,
                sent_at            = datetime.utcnow(),
                status             = status,
                sendgrid_id        = message_id,
                error_message      = error_msg
            )
            db.add(comm)
            db.commit()
            db.refresh(comm)

            print(f"{'✅' if status == 'sent' else '❌'} "
                  f"Communication {status}: "
                  f"Student {student.id} → {student.parent_email}")

            if not email_result['success']:
                return {
                    "status":  "error",
                    "message": error_msg,
                    "data":    comm.to_dict()  # logged even if failed
                }

            return {
                "status": "success",
                "data":   comm.to_dict()
            }

        except Exception as e:
            db.rollback()
            print(f"❌ Send communication error: {e}")
            return {"status": "error", "message": str(e)}

    # ──────────────────────────────────────────
    # BATCH SEND (Send to multiple students)
    # ──────────────────────────────────────────

    @staticmethod
    def batch_send(
        student_ids:    list,
        comm_type:      str,
        extra_data:     dict = {},
        sent_by:        int  = None
    ) -> dict:
        """
        Send same communication type to multiple students
        Returns: summary of sent/failed counts
        """
        results  = []
        sent     = 0
        failed   = 0

        for sid in student_ids:
            res = CommunicationService.send_communication(
                data={
                    'student_id':       sid,
                    'communication_type': comm_type,
                    'extra_data':       extra_data
                },
                sent_by=sent_by
            )
            if res.get('status') == 'success':
                sent += 1
            else:
                failed += 1
            results.append({
                'student_id': sid,
                'status':     res.get('status'),
                'message':    res.get('message', '')
            })

        print(f"📧 Batch send complete: {sent} sent | {failed} failed")

        return {
            "status": "success",
            "data": {
                "sent":    sent,
                "failed":  failed,
                "total":   len(student_ids),
                "results": results
            }
        }

    # ──────────────────────────────────────────
    # GET COMMUNICATION HISTORY
    # ──────────────────────────────────────────

    @staticmethod
    def get_history(filters: dict = {}) -> dict:
        """
        Get communication history with filters
        Filters: student_id, comm_type, status, limit, offset
        """
        db = next(CommunicationService.get_db())
        try:
            query = db.query(Communication).join(Student)

            if 'student_id' in filters:
                query = query.filter(
                    Communication.student_id == filters['student_id']
                )
            if 'comm_type' in filters:
                query = query.filter(
                    Communication.communication_type == filters['comm_type']
                )
            if 'status' in filters:
                query = query.filter(
                    Communication.status == filters['status']
                )

            total = query.count()
            query = query.order_by(desc(Communication.sent_at))

            limit  = filters.get('limit', 50)
            offset = filters.get('offset', 0)
            records = query.offset(offset).limit(limit).all()

            history = []
            for r in records:
                row              = r.to_dict()
                row['student_name'] = r.student.full_name
                row['student_code'] = r.student.student_id
                row['grade']        = r.student.grade
                row['section']      = r.student.section
                history.append(row)

            return {
                "status": "success",
                "data": {
                    "history": history,
                    "total":   total
                }
            }

        except Exception as e:
            print(f"❌ Get history error: {e}")
            return {"status": "error", "message": str(e)}

    # ──────────────────────────────────────────
    # GET COMMUNICATION STATS
    # ──────────────────────────────────────────

    @staticmethod
    def get_comm_stats() -> dict:
        """
        Get communication statistics for dashboard
        Returns: total sent, by type, by status, last 7 days
        """
        db = next(CommunicationService.get_db())
        try:
            total = db.query(func.count(Communication.id)).scalar()

            # By type
            by_type = db.query(
                Communication.communication_type,
                func.count().label('count')
            ).group_by(
                Communication.communication_type
            ).order_by(desc(func.count())).all()

            # By status
            by_status = db.query(
                Communication.status,
                func.count().label('count')
            ).group_by(Communication.status).all()

            # Last 7 days
            week_ago  = datetime.utcnow() - timedelta(days=7)
            last_week = db.query(func.count()).filter(
                Communication.sent_at >= week_ago
            ).scalar()

            return {
                "status": "success",
                "data": {
                    "total":     total,
                    "last_week": last_week,
                    "by_type": [
                        {"type": r.communication_type, "count": r.count}
                        for r in by_type
                    ],
                    "by_status": [
                        {"status": r.status, "count": r.count}
                        for r in by_status
                    ]
                }
            }

        except Exception as e:
            print(f"❌ Comm stats error: {e}")
            return {"status": "error", "message": str(e)}

    # ──────────────────────────────────────────
    # GET TEMPLATES (for frontend preview)
    # ──────────────────────────────────────────

    @staticmethod
    def get_templates() -> dict:
        """Return all available templates"""
        return {
            "status": "success",
            "data": {
                "templates": [
                    {
                        "name":    k,
                        "subject": v['subject'],
                        "preview": v['body'][:200] + "..."
                    }
                    for k, v in TEMPLATES.items()
                ]
            }
        }

