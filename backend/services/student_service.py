"""
Student Management Service
ScholarSense - AI-Powered Academic Intelligence System
"""
from datetime import datetime, date
from backend.database.models import Student, AcademicRecord
from backend.database.db_config import get_db
from sqlalchemy import or_, and_

class StudentService:
    """Handle student CRUD operations"""
    
    @staticmethod
    def create_student(data: dict):
        """
        Create a new student
        Args: dict with student info
        Returns: created student dict or error
        """
        db = next(get_db())
        try:
            # Validate grade is in valid range
            grade = data.get('grade')
            if grade not in [6, 7, 8, 9, 10]:
                return {'error': f"Grade must be between 6 and 10, got {grade}"}
            
            # Check if student ID already exists
            existing = db.query(Student).filter(Student.student_id == data.get('student_id')).first()
            if existing:
                return {'error': f"Student ID {data.get('student_id')} already exists"}
            
            # Parse date_of_birth if provided as string
            dob = data.get('date_of_birth')
            if isinstance(dob, str) and dob:
                try:
                    dob = datetime.strptime(dob, '%Y-%m-%d').date()
                except ValueError:
                    dob = None

            # If no date_of_birth but age provided, estimate DOB from age
            if not dob and data.get('age'):
                try:
                    birth_year = date.today().year - int(data['age'])
                    dob = date(birth_year, 6, 15)  # mid-year estimate
                except (ValueError, TypeError):
                    dob = None

            # Create student — do NOT set 'age' directly (it's a computed @property)
            student = Student(
                student_id=data.get('student_id'),
                first_name=data.get('first_name'),
                last_name=data.get('last_name'),
                grade=data.get('grade'),
                section=data.get('section'),
                gender=data.get('gender'),
                date_of_birth=dob,
                parent_name=data.get('parent_name'),
                parent_phone=data.get('parent_phone'),
                parent_email=data.get('parent_email'),
                socioeconomic_status=data.get('socioeconomic_status', 'Medium'),
                parent_education=data.get('parent_education', 'High School'),
                is_active=True
            )
            
            db.add(student)
            db.commit()
            db.refresh(student)
            
            return student.to_dict()
        except Exception as e:
            db.rollback()
            print(f"❌ Create student error: {e}")
            return {'error': str(e)}
        finally:
            db.close()
    
    @staticmethod
    def get_student(student_id: int):
        """Get student by database ID"""
        db = next(get_db())
        try:
            student = db.query(Student).filter(Student.id == student_id).first()
            if student:
                return student.to_dict()
            return {'error': 'Student not found'}
        finally:
            db.close()
    
    @staticmethod
    def get_student_by_student_id(student_id: str):
        """Get student by student ID (e.g., 'STU2024001')"""
        db = next(get_db())
        try:
            student = db.query(Student).filter(Student.student_id == student_id).first()
            if student:
                return student.to_dict()
            return {'error': 'Student not found'}
        finally:
            db.close()
    
    @staticmethod
    def get_all_students_paginated(grade: int = None, section: str = None,
                                   search: str = None,
                                   page: int = 1, per_page: int = 50):
        """
        Get all students with optional filters and pagination
        """
        db = next(get_db())
        try:
            query = db.query(Student).filter(Student.is_active == True)

            if grade:
                query = query.filter(Student.grade == grade)
            if section:
                query = query.filter(Student.section == section)
            if search:
                pattern = f"%{search}%"
                query = query.filter(
                    or_(
                        Student.first_name.ilike(pattern),
                        Student.last_name.ilike(pattern),
                        Student.student_id.ilike(pattern),
                        Student.parent_name.ilike(pattern)
                    )
                )

            total = query.count()
            students = query.order_by(
                Student.grade, Student.section, Student.last_name
            ).offset((page - 1) * per_page).limit(per_page).all()

            return [student.to_dict() for student in students], total
        finally:
            db.close()
    
    @staticmethod
    def search_students(search_term: str):
        """Search students by name, student ID, or parent name"""
        db = next(get_db())
        try:
            search_pattern = f"%{search_term}%"
            students = db.query(Student).filter(
                or_(
                    Student.first_name.ilike(search_pattern),
                    Student.last_name.ilike(search_pattern),
                    Student.student_id.ilike(search_pattern),
                    Student.parent_name.ilike(search_pattern)
                )
            ).filter(Student.is_active == True).limit(50).all()
            return [student.to_dict() for student in students]
        finally:
            db.close()
    
    @staticmethod
    def update_student(student_id: int, data: dict):
        """
        Update student information.
        'age' is a computed @property — update date_of_birth instead.
        """
        db = next(get_db())
        try:
            if 'grade' in data and data['grade'] not in [6, 7, 8, 9, 10]:
                return {'error': 'Invalid grade. Grades must be between 6 and 10.'}
            
            student = db.query(Student).filter(Student.id == student_id).first()
            if not student:
                return {'error': 'Student not found'}
            
            # If age is provided but no date_of_birth, estimate DOB from age
            if 'age' in data and data['age'] and 'date_of_birth' not in data:
                try:
                    birth_year = date.today().year - int(data['age'])
                    data['date_of_birth'] = date(birth_year, 6, 15)
                except (ValueError, TypeError):
                    pass

            # 'age' is NOT a settable column — remove it before setattr loop
            data.pop('age', None)

            updatable_fields = [
                'first_name', 'last_name', 'grade', 'section', 'gender',
                'date_of_birth', 'parent_name', 'parent_phone', 'parent_email',
                'socioeconomic_status', 'parent_education', 'is_active'
            ]
            
            for field in updatable_fields:
                if field in data:
                    if field == 'date_of_birth' and isinstance(data[field], str):
                        try:
                            data[field] = datetime.strptime(data[field], '%Y-%m-%d').date()
                        except ValueError:
                            continue
                    setattr(student, field, data[field])
            
            student.updated_at = datetime.utcnow()
            db.commit()
            db.refresh(student)
            
            return student.to_dict()
        except Exception as e:
            db.rollback()
            print(f"❌ Update student error: {e}")
            return {'error': str(e)}
        finally:
            db.close()
    
    @staticmethod
    def delete_student(student_id: int, soft_delete: bool = True):
        """Delete or deactivate student"""
        db = next(get_db())
        try:
            student = db.query(Student).filter(Student.id == student_id).first()
            if not student:
                return {'error': 'Student not found'}
            
            if soft_delete:
                student.is_active = False
                student.updated_at = datetime.utcnow()
                db.commit()
                return {'message': 'Student deactivated successfully'}
            else:
                db.delete(student)
                db.commit()
                return {'message': 'Student deleted permanently'}
        except Exception as e:
            db.rollback()
            print(f"❌ Delete student error: {e}")
            return {'error': str(e)}
        finally:
            db.close()
    
    @staticmethod
    def get_students_count(grade: int = None):
        """Get total number of students, optionally by grade"""
        db = next(get_db())
        try:
            query = db.query(Student).filter(Student.is_active == True)
            if grade:
                query = query.filter(Student.grade == grade)
            return {'count': query.count()}
        finally:
            db.close()

    @staticmethod
    def get_all_students(grade=None, section=None):
        """Alias for backward compatibility"""
        students, _ = StudentService.get_all_students_paginated(
            grade=grade, section=section, per_page=500
        )
        return students

    @staticmethod
    def get_student_with_records(student_id: int):
        """Get student with all related records (academic, attendance, predictions)"""
        db = next(get_db())
        try:
            student = db.query(Student).filter(Student.id == student_id).first()
            if not student:
                return {'error': 'Student not found'}
            
            student_data = student.to_dict()
            student_data['academic_records'] = [record.to_dict() for record in student.academic_records]
            
            from datetime import timedelta
            thirty_days_ago = date.today() - timedelta(days=30)
            recent_attendance = [att.to_dict() for att in student.attendance_records 
                               if att.attendance_date >= thirty_days_ago]
            student_data['recent_attendance'] = recent_attendance
            
            six_months_ago = date.today() - timedelta(days=180)
            recent_incidents = [inc.to_dict() for inc in student.incidents 
                              if inc.incident_date >= six_months_ago]
            student_data['recent_incidents'] = recent_incidents
            
            if student.predictions:
                latest_prediction = max(student.predictions, key=lambda x: x.prediction_date)
                student_data['latest_risk_prediction'] = latest_prediction.to_dict()
            else:
                student_data['latest_risk_prediction'] = None
            
            return student_data
        finally:
            db.close()
