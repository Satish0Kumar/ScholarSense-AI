"""
Backend Configuration Settings
"""
import os
from pathlib import Path

# Base directories
BASE_DIR = Path(__file__).resolve().parent.parent.parent
MODEL_DIR = BASE_DIR / "models" / "saved_models"
DATA_DIR = BASE_DIR / "data"

# School Configuration
SCHOOL_NAME = os.getenv("SCHOOL_NAME", "Greenwood High School")
ACADEMIC_YEAR = os.getenv("ACADEMIC_YEAR", "2025-26")

# Model paths
MODEL_PATH = MODEL_DIR / "best_model.pkl"
SCALER_PATH = MODEL_DIR / "scaler.pkl"
ENCODERS_PATH = MODEL_DIR / "label_encoders.pkl"
METADATA_PATH = MODEL_DIR / "model_metadata.pkl"

# Risk level mappings
RISK_LABELS = {
    0: 'Low',
    1: 'Medium',
    2: 'High',
    3: 'Critical'
}

RISK_COLORS = {
    0: 'green',
    1: 'orange',
    2: 'red',
    3: 'darkred'
}

# Feature names - must match prediction_service.py and train_model.py
FEATURE_NAMES = [
    'age', 'grade', 'gender', 'socioeconomic_status', 'parent_education',
    'current_gpa', 'previous_gpa', 'grade_trend', 'attendance_rate',
    'failed_subjects', 'assignment_submission_rate', 'behavioral_incidents',
    'math_score', 'science_score', 'english_score', 'social_score',
    'language_score'
]

# Valid input values
VALID_GENDERS = ['Male', 'Female']
VALID_SES = ['Low', 'Medium', 'High']
VALID_PARENT_EDU = ['None', 'High School', 'Graduate', 'Post-Graduate']
VALID_GRADES = [6, 7, 8, 9, 10]  # Grades 6-10 only (per schema and training data)

# API Configuration
API_HOST = os.getenv("API_HOST", "127.0.0.1")
API_PORT = int(os.getenv("API_PORT", 5000))

print("[OK] Configuration loaded")
print(f"  Model directory: {MODEL_DIR}")
print(f"  API will run on: {API_HOST}:{API_PORT}")
