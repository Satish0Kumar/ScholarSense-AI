"""
Alert Routes - Academic Performance & Attendance Alerts
ScholarSense - AI-Powered Academic Intelligence System
"""

from flask import Blueprint, request, jsonify, send_file
from flask_jwt_extended import jwt_required, get_jwt_identity
from io import BytesIO
from backend.services.alert_service import AlertService
from backend.services.pdf_service import PDFService

alert_bp = Blueprint('alerts', __name__, url_prefix='/api/alerts')


# ══════════════════════════════════════════════════════════════════════════
# ACADEMIC PERFORMANCE ALERTS
# ══════════════════════════════════════════════════════════════════════════

@alert_bp.route('/academic-alert/preview/<int:student_id>', methods=['GET'])
@jwt_required()
def preview_academic_alert(student_id):
    """
    Preview academic performance alert PDF (download without sending email)
    """
    try:
        pdf_bytes = PDFService.generate_academic_performance_alert(student_id)
        
        return send_file(
            BytesIO(pdf_bytes),
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'Academic_Alert_Student_{student_id}.pdf'
        )
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@alert_bp.route('/academic-alert/send/<int:student_id>', methods=['POST'])
@jwt_required()
def send_academic_alert(student_id):
    """
    Generate and send academic performance alert PDF to parent via email
    """
    try:
        result = AlertService.send_academic_performance_alert(student_id)
        
        if 'error' in result:
            return jsonify(result), 400
        
        return jsonify(result), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ══════════════════════════════════════════════════════════════════════════
# ATTENDANCE THRESHOLD ALERTS
# ══════════════════════════════════════════════════════════════════════════

@alert_bp.route('/attendance-alert/check', methods=['POST'])
@jwt_required()
def check_attendance_threshold():
    """
    Get list of students below attendance threshold
    
    Body:
        threshold: float (e.g., 75.0)
        grade: int (optional)
        section: str (optional)
    """
    try:
        data = request.get_json()
        threshold = float(data.get('threshold', 75.0))
        grade = data.get('grade')
        section = data.get('section')
        
        students = AlertService.get_students_below_attendance_threshold(
            threshold=threshold,
            grade=grade,
            section=section
        )
        
        return jsonify({
            'students': students,
            'total': len(students),
            'threshold': threshold
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@alert_bp.route('/attendance-alert/send-single', methods=['POST'])
@jwt_required()
def send_single_attendance_alert():
    """
    Send attendance alert to a single student's parent
    
    Body:
        student_id: int
        threshold: float
    """
    try:
        data = request.get_json()
        student_id = data.get('student_id')
        threshold = float(data.get('threshold', 75.0))
        
        # Get student data
        students = AlertService.get_students_below_attendance_threshold(threshold)
        student_data = next((s for s in students if s['id'] == student_id), None)
        
        if not student_data:
            return jsonify({'error': 'Student not found or above threshold'}), 404
        
        result = AlertService.send_attendance_alert_email(student_data, threshold)
        
        if 'error' in result:
            return jsonify(result), 400
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@alert_bp.route('/attendance-alert/send-bulk', methods=['POST'])
@jwt_required()
def send_bulk_attendance_alerts():
    """
    Send attendance alerts to all students below threshold
    
    Body:
        threshold: float (e.g., 75.0)
        grade: int (optional)
        section: str (optional)
    """
    try:
        data = request.get_json()
        threshold = float(data.get('threshold', 75.0))
        grade = data.get('grade')
        section = data.get('section')
        
        result = AlertService.send_bulk_attendance_alerts(
            threshold=threshold,
            grade=grade,
            section=section
        )
        
        if 'error' in result:
            return jsonify(result), 400
        
        return jsonify(result), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ══════════════════════════════════════════════════════════════════════════
# ALERT STATISTICS
# ══════════════════════════════════════════════════════════════════════════

@alert_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_alert_stats():
    """
    Get alert statistics for dashboard
    """
    try:
        # Get students below 75% attendance
        low_attendance = AlertService.get_students_below_attendance_threshold(75.0)
        
        # Get high-risk students (for academic alerts)
        from backend.services.prediction_service import PredictionService
        high_risk = PredictionService.get_high_risk_students()
        
        return jsonify({
            'low_attendance_count': len(low_attendance),
            'high_risk_count': len(high_risk),
            'total_alerts_pending': len(low_attendance) + len(high_risk)
        }), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500
