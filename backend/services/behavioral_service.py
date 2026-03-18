"""
Behavioral Incident Service
ScholarSense - AI-Powered Academic Intelligence System
Handles all behavioral incident operations
"""

from datetime import datetime, date, timedelta
from sqlalchemy import and_, func, desc
from sqlalchemy.orm import Session

from backend.database.models import BehavioralIncident, Student, User
from backend.database.db_config import SessionLocal

# ============================================
# CONSTANTS
# ============================================
INCIDENT_TYPES = [
    'Disciplinary', 'Disruptive', 'Bullying', 
    'Academic Misconduct', 'Attendance Issue', 
    'Property Damage', 'Other'
]

SEVERITY_LEVELS = ['Minor', 'Moderate', 'Serious', 'Critical']

# Severity color mapping for frontend
SEVERITY_COLORS = {
    'Minor': '#00CC44',      # Green
    'Moderate': '#FFA500',   # Orange  
    'Serious': '#FF4B4B',    # Red
    'Critical': '#8B0000'    # Dark Red
}

class BehavioralService:
    """Behavioral Incident Service"""
    
    @staticmethod
    def get_db():
        """Get database session"""
        db = SessionLocal()
        try:
            yield db
        finally:
            db.close()
    
    @staticmethod
    def log_incident(data: dict, reporter_id: int) -> dict:
        """
        Log new behavioral incident
        Args:
            data: Incident data dict
            reporter_id: User ID who reported
        Returns:
            {"status": "success", "data": incident} or {"status": "error", "message": "..."}
        """
        db = next(BehavioralService.get_db())
        try:
            # Validate required fields
            required = ['student_id', 'incident_date', 'incident_type', 'severity', 'description']
            if not all(field in data for field in required):
                return {"status": "error", "message": "Missing required fields"}
            
            # Validate enum values
            if data['incident_type'] not in INCIDENT_TYPES:
                return {"status": "error", "message": f"Invalid incident_type. Must be one of: {INCIDENT_TYPES}"}
            
            if data['severity'] not in SEVERITY_LEVELS:
                return {"status": "error", "message": f"Invalid severity. Must be one of: {SEVERITY_LEVELS}"}
            
            # Check student exists
            student = db.query(Student).filter(
                Student.id == data['student_id'],
                Student.is_active == True
            ).first()
            
            if not student:
                return {"status": "error", "message": "Student not found or inactive"}
            
            # Create incident
            incident = BehavioralIncident(
                student_id=data['student_id'],
                incident_date=data.get('incident_date'),
                incident_time=data.get('incident_time'),
                incident_type=data['incident_type'],
                severity=data['severity'],
                description=data['description'],
                location=data.get('location'),
                action_taken=data.get('action_taken'),
                reported_by=reporter_id,
                witnesses=data.get('witnesses'),
                parent_notified=data.get('parent_notified', False),
                counseling_given=data.get('counseling_given', False),
                follow_up_date=data.get('follow_up_date'),
                notes=data.get('notes')
            )
            
            db.add(incident)
            db.commit()
            db.refresh(incident)
            
            print(f"✅ Incident logged: Student {data['student_id']} - {data['incident_type']} ({data['severity']})")
            
            return {
                "status": "success", 
                "data": incident.to_dict()
            }
            
        except Exception as e:
            db.rollback()
            print(f"❌ Log incident error: {e}")
            return {"status": "error", "message": str(e)}
    
    @staticmethod
    def get_incidents(filters: dict = {}) -> dict:
        """
        Get incidents with filters
        Filters: student_id, date_from, date_to, severity, type, limit
        Returns: {"status": "success", "data": {"incidents": [...], "total": int}}
        """
        db = next(BehavioralService.get_db())
        try:
            query = db.query(BehavioralIncident).join(Student).outerjoin(User)
            
            # Apply filters
            if 'student_id' in filters:
                query = query.filter(BehavioralIncident.student_id == filters['student_id'])
            
            if 'date_from' in filters:
                query = query.filter(BehavioralIncident.incident_date >= filters['date_from'])
            
            if 'date_to' in filters:
                query = query.filter(BehavioralIncident.incident_date <= filters['date_to'])
            
            if 'severity' in filters:
                query = query.filter(BehavioralIncident.severity == filters['severity'])
            
            if 'type' in filters:
                query = query.filter(BehavioralIncident.incident_type == filters['type'])
            
            # Count total
            total = query.count()
            
            # Order by recent first
            query = query.order_by(desc(BehavioralIncident.created_at))
            
            # Pagination
            limit = filters.get('limit', 50)
            offset = filters.get('offset', 0)
            incidents = query.offset(offset).limit(limit).all()
            
            incidents_list = [inc.to_dict() for inc in incidents]
            
            return {
                "status": "success",
                "data": {
                    "incidents": incidents_list,
                    "total": total,
                    "filters": filters
                }
            }
            
        except Exception as e:
            print(f"❌ Get incidents error: {e}")
            return {"status": "error", "message": str(e)}
    
    @staticmethod
    def get_student_incidents(student_id: int, limit: int = 20) -> dict:
        """
        Get all incidents for a specific student
        """
        filters = {'student_id': student_id, 'limit': limit}
        return BehavioralService.get_incidents(filters)
    
    @staticmethod
    def get_incident_stats(date_range: str = '30_days') -> dict:
        """
        Get incident statistics
        date_range: '7_days', '30_days', '90_days', 'all_time'
        Returns: Stats by type, severity, grade, etc.
        """
        db = next(BehavioralService.get_db())
        try:
            # Calculate date range
            days_ago = {
                '7_days': 7, '30_days': 30, '90_days': 90, 'all_time': 36500
            }.get(date_range, 30)
            
            cutoff_date = date.today() - timedelta(days=days_ago)
            
            # Stats queries
            stats = {}
            
            # By severity
            severity_stats = db.query(
                BehavioralIncident.severity,
                func.count().label('count')
            ).filter(
                BehavioralIncident.incident_date >= cutoff_date
            ).group_by(BehavioralIncident.severity).all()
            
            stats['by_severity'] = [
                {'severity': row.severity, 'count': row.count} for row in severity_stats
            ]
            
            # By type
            type_stats = db.query(
                BehavioralIncident.incident_type,
                func.count().label('count')
            ).filter(
                BehavioralIncident.incident_date >= cutoff_date
            ).group_by(BehavioralIncident.incident_type).order_by(desc(func.count())).limit(5).all()
            
            stats['by_type'] = [
                {'type': row.incident_type, 'count': row.count} for row in type_stats
            ]
            
            # Total incidents
            stats['total'] = db.query(func.count()).filter(
                BehavioralIncident.incident_date >= cutoff_date
            ).scalar()
            
            # Critical incidents
            stats['critical'] = db.query(func.count()).filter(
                and_(
                    BehavioralIncident.incident_date >= cutoff_date,
                    BehavioralIncident.severity == 'Critical'
                )
            ).scalar()
            
            # Parent notified
            stats['parent_notified'] = db.query(func.count()).filter(
                and_(
                    BehavioralIncident.incident_date >= cutoff_date,
                    BehavioralIncident.parent_notified == True
                )
            ).scalar()
            
            # By grade
            grade_stats = db.query(
                Student.grade,
                func.count().label('count')
            ).join(BehavioralIncident).filter(
                BehavioralIncident.incident_date >= cutoff_date
            ).group_by(Student.grade).all()
            
            stats['by_grade'] = [
                {'grade': row.grade, 'count': row.count} for row in grade_stats
            ]
            
            stats['period'] = date_range
            
            return {
                "status": "success",
                "data": stats
            }
            
        except Exception as e:
            print(f"❌ Incident stats error: {e}")
            return {"status": "error", "message": str(e)}
    
    @staticmethod
    def get_incident_trends(days: int = 30) -> dict:
        """
        Get incident trends over time (daily counts)
        """
        db = next(BehavioralService.get_db())
        try:
            cutoff_date = date.today() - timedelta(days=days)
            
            trends = db.query(
                func.date(BehavioralIncident.incident_date).label('date'),
                func.count().label('count'),
                func.string_agg(BehavioralIncident.severity, ', ').label('severities')
            ).filter(
                BehavioralIncident.incident_date >= cutoff_date
            ).group_by(
                func.date(BehavioralIncident.incident_date)
            ).order_by('date').all()
            
            trend_data = [
                {
                    'date': row.date.isoformat(),
                    'count': row.count,
                    'severities': row.severities.split(', ') if row.severities else []
                }
                for row in trends
            ]
            
            return {
                "status": "success",
                "data": {
                    "trends": trend_data,
                    "period_days": days
                }
            }
            
        except Exception as e:
            print(f"❌ Incident trends error: {e}")
            return {"status": "error", "message": str(e)}
    
    @staticmethod
    def update_incident(incident_id: int, data: dict) -> dict:
        """
        Update existing incident (teacher/admin only)
        """
        db = next(BehavioralService.get_db())
        try:
            incident = db.query(BehavioralIncident).filter(
                BehavioralIncident.id == incident_id
            ).first()
            
            if not incident:
                return {"status": "error", "message": "Incident not found"}
            
            # Update allowed fields
            update_fields = [
                'incident_time', 'severity', 'description', 'location',
                'action_taken', 'witnesses', 'parent_notified',
                'counseling_given', 'follow_up_date', 'notes'
            ]
            
            for field in update_fields:
                if field in data:
                    setattr(incident, field, data[field])
            
            db.commit()
            db.refresh(incident)
            
            print(f"✅ Incident {incident_id} updated")
            
            return {
                "status": "success",
                "data": incident.to_dict()
            }
            
        except Exception as e:
            db.rollback()
            print(f"❌ Update incident error: {e}")
            return {"status": "error", "message": str(e)}
    
    @staticmethod
    def delete_incident(incident_id: int) -> dict:
        """
        Soft-delete incident (set student.is_active = false equivalent)
        """
        db = next(BehavioralService.get_db())
        try:
            incident = db.query(BehavioralIncident).filter(
                BehavioralIncident.id == incident_id
            ).first()
            
            if not incident:
                return {"status": "error", "message": "Incident not found"}
            
            db.delete(incident)
            db.commit()
            
            print(f"✅ Incident {incident_id} deleted")
            
            return {"status": "success", "message": "Incident deleted successfully"}
            
        except Exception as e:
            db.rollback()
            print(f"❌ Delete incident error: {e}")
            return {"status": "error", "message": str(e)}
