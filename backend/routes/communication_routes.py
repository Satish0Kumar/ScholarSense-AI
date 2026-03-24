# backend/routes/communication_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import os
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email.mime.text import MIMEText
from email import encoders

from backend.services.communication_service import CommunicationService
from backend.services.pdf_service import PDFService
from backend.database.db_config import SessionLocal
from backend.database.models import Student

communication_bp = Blueprint('communications', __name__)


# POST /api/communications/send
@communication_bp.route('/api/communications/send', methods=['POST'])
@jwt_required()
def send_communication():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        sent_by = get_jwt_identity()
        result  = CommunicationService.send_communication(data, sent_by=sent_by)
        if result.get('status') == 'error':
            return jsonify(result), 400
        return jsonify(result), 200
    except Exception as e:
        print(f"❌ Send communication error: {e}")
        return jsonify({'error': str(e)}), 500


# POST /api/communications/batch
@communication_bp.route('/api/communications/batch', methods=['POST'])
@jwt_required()
def send_batch_communications():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        sent_by     = get_jwt_identity()
        student_ids = data.get('student_ids', [])
        comm_type   = data.get('communication_type', 'Risk Alert')
        extra_data  = data.get('extra_data', {})
        result = CommunicationService.batch_send(
            student_ids = student_ids,
            comm_type   = comm_type,
            extra_data  = extra_data,
            sent_by     = sent_by
        )
        if result.get('status') == 'error':
            return jsonify(result), 400
        return jsonify(result), 200
    except Exception as e:
        print(f"❌ Batch communication error: {e}")
        return jsonify({'error': str(e)}), 500


# GET /api/communications/history
@communication_bp.route('/api/communications/history', methods=['GET'])
@jwt_required()
def get_communication_history():
    try:
        filters = {
            'limit':  request.args.get('limit', 50, type=int),
            'offset': request.args.get('offset', 0,  type=int),
        }
        if request.args.get('student_id'):
            filters['student_id'] = request.args.get('student_id', type=int)
        if request.args.get('status'):
            filters['status'] = request.args.get('status')
        result = CommunicationService.get_history(filters=filters)
        return jsonify(result), 200
    except Exception as e:
        print(f"❌ Get comm history error: {e}")
        return jsonify({'error': str(e)}), 500


# GET /api/communications/stats
@communication_bp.route('/api/communications/stats', methods=['GET'])
@jwt_required()
def get_communication_stats():
    try:
        result = CommunicationService.get_comm_stats()   # ← was get_communication_stats
        return jsonify(result), 200
    except Exception as e:
        print(f"❌ Get comm stats error: {e}")
        return jsonify({'error': str(e)}), 500


# GET /api/communications/templates
@communication_bp.route('/api/communications/templates', methods=['GET'])
@jwt_required()
def get_email_templates():
    try:
        result = CommunicationService.get_templates()    # ← was get_email_templates
        return jsonify(result), 200
    except Exception as e:
        print(f"❌ Get templates error: {e}")
        return jsonify({'error': str(e)}), 500


# GET /api/students/<student_id>/communications
@communication_bp.route('/api/students/<int:student_id>/communications', methods=['GET'])
@jwt_required()
def get_student_communications(student_id):
    try:
        filters = {
            'student_id': student_id,
            'limit':      request.args.get('limit', 20, type=int)
        }
        result = CommunicationService.get_history(filters=filters)
        return jsonify(result), 200
    except Exception as e:
        print(f"❌ Get student comms error: {e}")
        return jsonify({'error': str(e)}), 500


# POST /api/communications/send-report
@communication_bp.route('/api/communications/send-report', methods=['POST'])
@jwt_required()
def send_report_email():
    data       = request.get_json() or {}
    student_id = data.get('student_id')
    db = SessionLocal()
    try:
        if not student_id:
            return jsonify({'status': 'error', 'message': 'student_id is required'}), 400

        student = db.query(Student).filter(Student.id == student_id).first()
        if not student or not student.parent_email:
            return jsonify({'status': 'error', 'message': 'No parent email'}), 400

        # Generate PDF
        pdf_bytes = PDFService.generate_student_report(student_id)

        # Build email
        email_user = os.getenv('EMAIL_USER')
        email_password = os.getenv('EMAIL_PASSWORD')
        email_host = os.getenv('EMAIL_HOST', 'smtp.gmail.com')
        email_port = int(os.getenv('EMAIL_PORT', 587))
        from_name = os.getenv('EMAIL_FROM_NAME', 'ScholarSense')

        if not email_user or not email_password:
            return jsonify({'status': 'error', 'message': 'Email credentials are not configured'}), 500

        msg = MIMEMultipart()
        msg['From']    = f"{from_name} <{email_user}>"
        msg['To']      = student.parent_email
        msg['Subject'] = f"Academic Report - {student.first_name} {student.last_name}"

        body = (
            f"Dear {student.parent_name or 'Parent'},\n\n"
            f"Please find attached the academic report for {student.first_name}.\n\n"
            "Regards,\nScholarSense"
        )
        msg.attach(MIMEText(body, 'plain'))

        # Attach PDF
        part = MIMEBase('application', 'octet-stream')
        part.set_payload(pdf_bytes)
        encoders.encode_base64(part)
        part.add_header(
            'Content-Disposition',
            f'attachment; filename="report_{student.student_id}.pdf"'
        )
        msg.attach(part)

        # Send
        with smtplib.SMTP(email_host, email_port) as server:
            server.ehlo()
            server.starttls()
            server.login(email_user, email_password)
            server.send_message(msg)

        return jsonify({'status': 'success', 'message': 'Report emailed'}), 200
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500
    finally:
        db.close()
