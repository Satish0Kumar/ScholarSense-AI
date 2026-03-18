"""
ML Model Retraining Script
ScholarSense - AI-Powered Academic Intelligence System

Retrains the Gradient Boosting Classifier on UCI-imported data
from PostgreSQL database.

Usage:
    python backend/scripts/retrain_model.py
"""

import sys
import os
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

import numpy as np
import pickle
from datetime import date, timedelta
from sqlalchemy import func

# Suppress warnings
import warnings
warnings.filterwarnings('ignore')

# ML imports
from sklearn.ensemble import GradientBoostingClassifier, RandomForestClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler, LabelEncoder
from sklearn.metrics import (
    accuracy_score, classification_report,
    confusion_matrix
)

# Project imports
from backend.database.db_config import SessionLocal
from backend.database.models import (
    Student, AcademicRecord, Attendance, BehavioralIncident
)
from backend.scripts.uci_column_mapping import derive_risk_label

# ── Model save path ────────────────────────────────────────────────────────────
MODEL_DIR  = Path(__file__).parent.parent.parent / "models" / "saved_models"
MODEL_PATH = MODEL_DIR / "best_model.pkl"
SCALER_PATH    = MODEL_DIR / "scaler.pkl"
ENCODER_PATH   = MODEL_DIR / "label_encoders.pkl"
METADATA_PATH  = MODEL_DIR / "model_metadata.pkl"

FEATURE_NAMES = [
    'age', 'grade', 'gender', 'socioeconomic_status', 'parent_education',
    'current_gpa', 'previous_gpa', 'grade_trend', 'attendance_rate',
    'failed_subjects', 'assignment_submission_rate', 'behavioral_incidents',
    'math_score', 'science_score', 'english_score', 'social_score',
    'language_score'
]

RISK_LABELS = {0: 'Low', 1: 'Medium', 2: 'High', 3: 'Critical'}


# ==============================================================================
# STEP 1 — EXTRACT FEATURES FROM DATABASE
# ==============================================================================

def extract_features_from_db():
    """
    Extract all student features from PostgreSQL for ML training.
    Returns: (X, y) numpy arrays
    """
    print("\n📦 Extracting features from database...")

    db = SessionLocal()
    features_list = []
    labels_list   = []
    skipped       = 0

    try:
        # Get all active students
        students = db.query(Student).filter(
            Student.is_active == True
        ).all()

        print(f"   Found {len(students)} active students")

        for student in students:

            # ── Get latest academic record ──────────────────────────────────
            academic = db.query(AcademicRecord).filter(
                AcademicRecord.student_id == student.id
            ).order_by(AcademicRecord.recorded_date.desc()).first()

            if not academic:
                skipped += 1
                continue

            # ── Get attendance rate (last 90 days) ──────────────────────────
            ninety_days_ago = date.today() - timedelta(days=90)

            total_days = db.query(func.count(Attendance.id)).filter(
                Attendance.student_id == student.id,
                Attendance.attendance_date >= ninety_days_ago
            ).scalar() or 0

            present_days = db.query(func.count(Attendance.id)).filter(
                Attendance.student_id == student.id,
                Attendance.attendance_date >= ninety_days_ago,
                Attendance.status == 'present'
            ).scalar() or 0

            attendance_rate = (
                round(present_days / total_days * 100, 2)
                if total_days > 0 else 95.0
            )

            # ── Behavioral incidents (last 90 days) ─────────────────────────
            try:
                incident_count = db.query(
                    func.count(BehavioralIncident.id)
                ).filter(
                    BehavioralIncident.student_id == student.id,
                ).scalar() or 0
            except Exception:
                incident_count = 0

            # ── Encode categorical features ─────────────────────────────────
            gender_enc = 1 if student.gender == 'Male' else 0

            ses_map = {'Low': 0, 'Medium': 1, 'High': 2}
            ses_enc = ses_map.get(
                student.socioeconomic_status or 'Medium', 1
            )

            edu_map = {
                'None': 0, 'High School': 1,
                'Graduate': 2, 'Post-Graduate': 3
            }
            edu_enc = edu_map.get(
                student.parent_education or 'High School', 1
            )

            # ── Build feature vector ────────────────────────────────────────
            feature_vector = [
                student.age or 14,
                student.grade,
                gender_enc,
                ses_enc,
                edu_enc,
                float(academic.current_gpa or 0),
                float(academic.previous_gpa or 0),
                float(academic.grade_trend or 0),
                attendance_rate,
                int(academic.failed_subjects or 0),
                float(academic.assignment_submission_rate or 80),
                incident_count,
                float(academic.math_score or 0),
                float(academic.science_score or 0),
                float(academic.english_score or 0),
                float(academic.social_score or 0),
                float(academic.language_score or 0),
            ]

            # ── Derive risk label from academic data ────────────────────────
            # Convert GPA (0-100) back to 0-20 scale for risk derivation
            g3_approx  = int((float(academic.current_gpa or 0)) / 5)
            failures   = int(academic.failed_subjects or 0)
            absences   = total_days - present_days

            risk_level, _ = derive_risk_label(g3_approx, failures, absences)

            features_list.append(feature_vector)
            labels_list.append(risk_level)

        print(f"   ✅ Features extracted: {len(features_list)} students")
        print(f"   ⚠️  Skipped (no academic record): {skipped}")

        # ── Show class distribution ─────────────────────────────────────────
        from collections import Counter
        dist = Counter(labels_list)
        print(f"\n   📊 Risk Label Distribution:")
        for level in sorted(dist.keys()):
            label = RISK_LABELS[level]
            count = dist[level]
            pct   = count / len(labels_list) * 100
            bar   = '█' * int(pct // 3)
            print(f"      {label:<10}: {count:3} students ({pct:5.1f}%)  {bar}")

        return np.array(features_list), np.array(labels_list)

    finally:
        db.close()


# ==============================================================================
# STEP 2 — TRAIN THE MODEL
# ==============================================================================

def train_model(X, y):
    """
    Train Gradient Boosting Classifier on extracted features.
    Returns: trained model, scaler, accuracy score
    """
    print("\n🤖 Training ML Model...")

    # ── Train/test split ────────────────────────────────────────────────────
    X_train, X_test, y_train, y_test = train_test_split(
        X, y,
        test_size=0.2,
        random_state=42,
        stratify=y
    )
    print(f"   Train size : {len(X_train)} samples")
    print(f"   Test size  : {len(X_test)} samples")

    # ── Feature scaling ─────────────────────────────────────────────────────
    scaler  = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled  = scaler.transform(X_test)

    # ── Train Gradient Boosting Classifier ──────────────────────────────────
    print("\n   ⏳ Training Gradient Boosting Classifier...")
    model = GradientBoostingClassifier(
        n_estimators=200,
        learning_rate=0.1,
        max_depth=5,
        min_samples_split=4,
        min_samples_leaf=2,
        subsample=0.8,
        random_state=42
    )
    model.fit(X_train_scaled, y_train)

    # ── Evaluate ─────────────────────────────────────────────────────────────
    y_pred    = model.predict(X_test_scaled)
    accuracy  = accuracy_score(y_test, y_pred)

    print(f"\n   ✅ Training complete!")
    print(f"   🎯 Test Accuracy: {accuracy * 100:.2f}%")

    # ── Cross validation ─────────────────────────────────────────────────────
    print("\n   📊 Running 5-fold cross validation...")
    cv_scores = cross_val_score(
        model, scaler.transform(X), y,
        cv=5, scoring='accuracy'
    )
    print(f"   CV Scores  : {[f'{s*100:.1f}%' for s in cv_scores]}")
    print(f"   CV Mean    : {cv_scores.mean()*100:.2f}%")
    print(f"   CV Std     : ±{cv_scores.std()*100:.2f}%")

    # ── Classification report ────────────────────────────────────────────────
    print("\n   📋 Classification Report:")
    print("   " + "-" * 55)
    report = classification_report(
        y_test, y_pred,
        target_names=['Low', 'Medium', 'High', 'Critical'],
        digits=3
    )
    for line in report.split('\n'):
        print(f"   {line}")

    # ── Feature importance ───────────────────────────────────────────────────
    print("\n   🔍 Top 10 Important Features:")
    importances = model.feature_importances_
    indices     = np.argsort(importances)[::-1]
    for i in range(min(10, len(FEATURE_NAMES))):
        feat = FEATURE_NAMES[indices[i]]
        imp  = importances[indices[i]]
        bar  = '█' * int(imp * 100)
        print(f"      {i+1:2}. {feat:<30} {imp:.4f}  {bar}")

    return model, scaler, accuracy


# ==============================================================================
# STEP 3 — SAVE MODEL & METADATA
# ==============================================================================

def save_model(model, scaler, accuracy):
    """
    Save trained model, scaler, and metadata to disk.
    """
    print(f"\n💾 Saving model to {MODEL_DIR}...")

    # Create directory if it doesn't exist
    MODEL_DIR.mkdir(parents=True, exist_ok=True)

    # ── Save model ───────────────────────────────────────────────────────────
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(model, f)
    print(f"   ✅ Model saved     → {MODEL_PATH.name}")

    # ── Save scaler ──────────────────────────────────────────────────────────
    with open(SCALER_PATH, 'wb') as f:
        pickle.dump(scaler, f)
    print(f"   ✅ Scaler saved    → {SCALER_PATH.name}")

    # ── Save metadata ────────────────────────────────────────────────────────
    metadata = {
        'model_type'    : 'GradientBoostingClassifier',
        'feature_names' : FEATURE_NAMES,
        'risk_labels'   : RISK_LABELS,
        'accuracy'      : accuracy,
        'trained_on'    : date.today().isoformat(),
        'n_features'    : len(FEATURE_NAMES),
        'n_classes'     : 4,
        'pass_mark'     : 35,
        'version'       : '2.0'
    }
    with open(METADATA_PATH, 'wb') as f:
        pickle.dump(metadata, f)
    print(f"   ✅ Metadata saved  → {METADATA_PATH.name}")

    # ── File sizes ────────────────────────────────────────────────────────────
    model_size  = MODEL_PATH.stat().st_size / 1024
    scaler_size = SCALER_PATH.stat().st_size / 1024
    print(f"\n   📦 Model size  : {model_size:.1f} KB")
    print(f"   📦 Scaler size : {scaler_size:.1f} KB")


# ==============================================================================
# MAIN
# ==============================================================================

def run_retraining():
    print("\n" + "=" * 65)
    print("  🤖 SCHOLARSENSE — ML MODEL RETRAINING")
    print("=" * 65)

    # ── Step 1: Extract features ─────────────────────────────────────────────
    X, y = extract_features_from_db()

    if len(X) < 50:
        print("\n❌ Not enough data to train! Need at least 50 students.")
        print("   Run import_uci_data.py first.")
        sys.exit(1)

    # ── Step 2: Train model ──────────────────────────────────────────────────
    model, scaler, accuracy = train_model(X, y)

    # ── Step 3: Save model ───────────────────────────────────────────────────
    save_model(model, scaler, accuracy)

    # ── Final summary ────────────────────────────────────────────────────────
    print("\n" + "=" * 65)
    print("  ✅ RETRAINING COMPLETE — SUMMARY")
    print("=" * 65)
    print(f"  🎯 Final Accuracy   : {accuracy * 100:.2f}%")
    print(f"  📦 Model saved to   : models/saved_models/best_model.pkl")
    print(f"  📅 Trained on       : {date.today().isoformat()}")
    print(f"  🔢 Features used    : {len(FEATURE_NAMES)}")
    print(f"  📊 Training samples : {len(X)}")
    print("=" * 65)
    print("\n🎉 Enhancement 1 — Phase 3 Complete!")
    print("   Your ML model is now trained on real UCI data.\n")


if __name__ == "__main__":
    run_retraining()
