"""
UCI Student Performance Dataset Importer
ScholarSense - AI-Powered Academic Intelligence System

Hybrid Approach:
- Real academic patterns from UCI dataset
- Generated Indian names, contact details, school structure
- Maps UCI columns → ScholarSense PostgreSQL schema

Usage:
    python backend/scripts/import_uci_data.py
"""

import sys
import os
from pathlib import Path

# Add project root to Python path
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

import pandas as pd
import numpy as np
import random
from datetime import datetime, date, timedelta
from sqlalchemy import text

# Import project modules
from backend.database.db_config import engine, SessionLocal
from backend.database.models import Student, AcademicRecord, Attendance, RiskPrediction
from backend.scripts.indian_names import (
    FIRST_NAMES_MALE, FIRST_NAMES_FEMALE, LAST_NAMES,
    PARENT_FIRST_NAMES_MALE, PARENT_FIRST_NAMES_FEMALE
)
from backend.scripts.uci_column_mapping import (
    AGE_TO_GRADE, SECTIONS,
    derive_socioeconomic_status, derive_parent_education,
    derive_risk_label, uci_grade_to_percent,
    derive_submission_rate, PASS_MARK
)

# ── Constants ──────────────────────────────────────────────────────────────────
SCRIPT_DIR = Path(__file__).parent
MAT_CSV    = SCRIPT_DIR / "student-mat.csv"
POR_CSV    = SCRIPT_DIR / "student-por.csv"

TOTAL_TARGET   = 400   # Target number of students to import
STUDENTS_PER_GRADE = {6: 80, 7: 80, 8: 80, 9: 80, 10: 80}

random.seed(42)
np.random.seed(42)


# ==============================================================================
# STEP 1 — LOAD UCI CSV FILES
# ==============================================================================

def load_uci_data():
    """
    Load UCI student-mat.csv and student-por.csv.
    Returns combined DataFrame with source column.
    """
    print("\n📂 Loading UCI dataset files...")

    dfs = []

    if MAT_CSV.exists():
        df_mat = pd.read_csv(MAT_CSV, sep=';')
        df_mat['source'] = 'math'
        dfs.append(df_mat)
        print(f"   ✅ student-mat.csv loaded → {len(df_mat)} rows")
    else:
        print(f"   ❌ student-mat.csv not found at {MAT_CSV}")

    if POR_CSV.exists():
        df_por = pd.read_csv(POR_CSV, sep=';')
        df_por['source'] = 'portuguese'
        dfs.append(df_por)
        print(f"   ✅ student-por.csv loaded → {len(df_por)} rows")
    else:
        print(f"   ❌ student-por.csv not found at {POR_CSV}")

    if not dfs:
        print("\n❌ No UCI CSV files found!")
        print(f"   Please place CSV files in: {SCRIPT_DIR}")
        sys.exit(1)

    # Combine both files
    combined = pd.concat(dfs, ignore_index=True)

    # Drop duplicates based on key academic columns
    combined = combined.drop_duplicates(
        subset=['age', 'sex', 'G1', 'G2', 'G3', 'failures', 'absences'],
        keep='first'
    )

    print(f"\n   📊 Total unique UCI rows: {len(combined)}")
    return combined


# ==============================================================================
# STEP 2 — GENERATE STUDENT RECORD FROM UCI ROW
# ==============================================================================

def generate_student_record(uci_row, student_num, grade, section, used_names):
    """
    Generate a full ScholarSense student record from one UCI row.

    Args:
        uci_row    : Single row from UCI DataFrame
        student_num: Sequential student number (for student_id)
        grade      : Assigned grade (6-10)
        section    : Assigned section (A/B/C)
        used_names : Set of already used full names (for uniqueness)

    Returns:
        dict with student data ready for DB insert
    """

    # ── Gender ─────────────────────────────────────────────────────────────
    gender = 'Male' if uci_row.get('sex', 'M') == 'M' else 'Female'

    # ── Generate unique Indian name ────────────────────────────────────────
    name_pool = FIRST_NAMES_MALE if gender == 'Male' else FIRST_NAMES_FEMALE
    attempts  = 0

    while attempts < 50:
        first_name = random.choice(name_pool)
        last_name  = random.choice(LAST_NAMES)
        full_name  = f"{first_name} {last_name}"
        if full_name not in used_names:
            used_names.add(full_name)
            break
        attempts += 1
    else:
        # Fallback: append number to make unique
        first_name = random.choice(name_pool)
        last_name  = random.choice(LAST_NAMES)
        full_name  = f"{first_name} {last_name} {student_num}"

    # ── Age (map UCI age, cap to grade-appropriate range) ──────────────────
    uci_age = int(uci_row.get('age', 16))
    # Grade-appropriate age range
    grade_age_map = {6: (11, 12), 7: (12, 13), 8: (13, 14),
                     9: (14, 15), 10: (15, 16)}
    age_min, age_max = grade_age_map[grade]
    age = random.randint(age_min, age_max)

    # ── Date of birth ───────────────────────────────────────────────────────
    today         = date.today()
    birth_year    = today.year - age
    birth_month   = random.randint(1, 12)
    birth_day     = random.randint(1, 28)
    date_of_birth = date(birth_year, birth_month, birth_day)

    # ── Parent details ──────────────────────────────────────────────────────
    parent_gender     = random.choice(['male', 'female'])
    parent_first_pool = (PARENT_FIRST_NAMES_MALE
                         if parent_gender == 'male'
                         else PARENT_FIRST_NAMES_FEMALE)
    parent_first      = random.choice(parent_first_pool)
    parent_name       = f"{parent_first} {last_name}"
    parent_phone      = f"9{random.randint(100000000, 999999999)}"
    parent_email      = (
        f"{first_name.lower()}.{last_name.lower()}"
        f"{random.randint(1, 99)}@gmail.com"
    )

    # ── Socioeconomic status ────────────────────────────────────────────────
    pstatus = str(uci_row.get('Pstatus', 'T'))
    medu    = int(uci_row.get('Medu', 2))
    fedu    = int(uci_row.get('Fedu', 2))
    socioeconomic_status = derive_socioeconomic_status(pstatus, medu, fedu)

    # ── Parent education ────────────────────────────────────────────────────
    parent_education = derive_parent_education(medu, fedu)

    # ── Enrollment date (1-3 years ago, realistic) ──────────────────────────
    days_ago        = random.randint(365, 365 * 3)
    enrollment_date = today - timedelta(days=days_ago)

    # ── Student ID ──────────────────────────────────────────────────────────
    student_id = f"STU{student_num:04d}"

    return {
        'student_id'          : student_id,
        'first_name'          : first_name,
        'last_name'           : last_name,
        'grade'               : grade,
        'section'             : section,
        'age'                 : age,
        'gender'              : gender,
        'date_of_birth'       : date_of_birth,
        'parent_name'         : parent_name,
        'parent_phone'        : parent_phone,
        'parent_email'        : parent_email,
        'socioeconomic_status': socioeconomic_status,
        'parent_education'    : parent_education,
        'enrollment_date'     : enrollment_date,
        'is_active'           : True,
    }


# ==============================================================================
# STEP 3 — GENERATE ACADEMIC RECORD FROM UCI ROW
# ==============================================================================

def generate_academic_record(uci_row, student_db_id):
    """
    Generate academic record for a student from UCI grade data.

    Maps UCI G1/G2/G3 → 5 subject scores + GPA
    """

    # ── Raw UCI scores (0-20 scale) → convert to percentage ────────────────
    g1 = int(uci_row.get('G1', 10))
    g2 = int(uci_row.get('G2', 10))
    g3 = int(uci_row.get('G3', 10))

    g1_pct = uci_grade_to_percent(g1)   # Previous term 1
    g2_pct = uci_grade_to_percent(g2)   # Previous term 2
    g3_pct = uci_grade_to_percent(g3)   # Current final

    # ── Generate 5 correlated subject scores from G3 ───────────────────────
    # Math is directly from UCI math source (if available)
    source = uci_row.get('source', 'math')

    def vary(base, spread=8):
        """Add realistic variation to a base score"""
        score = base + random.uniform(-spread, spread)
        return round(max(0, min(100, score)), 2)

    if source == 'math':
        math_score    = round(max(0, min(100, g3_pct + random.uniform(-3, 3))), 2)
        science_score = vary(g3_pct, 8)
        english_score = vary(g2_pct, 10)   # Slightly different from math
        social_score  = vary((g1_pct + g2_pct) / 2, 7)
        language_score= vary(g2_pct, 9)
    else:
        # Portuguese source
        english_score  = round(max(0, min(100, g3_pct + random.uniform(-3, 3))), 2)
        language_score = vary(g3_pct, 5)   # Close to English
        math_score     = vary(g2_pct, 10)
        science_score  = vary(g2_pct, 8)
        social_score   = vary((g1_pct + g2_pct) / 2, 7)

    # ── GPA calculation ─────────────────────────────────────────────────────
    scores = [math_score, science_score, english_score,
              social_score, language_score]
    current_gpa  = round(sum(scores) / len(scores), 2)
    previous_gpa = round((g1_pct + g2_pct) / 2, 2)
    grade_trend  = round(current_gpa - previous_gpa, 2)

    # ── Failed subjects ─────────────────────────────────────────────────────
    failed_subjects = sum(1 for s in scores if s < PASS_MARK)

    # ── Assignment submission rate ──────────────────────────────────────────
    studytime = int(uci_row.get('studytime', 2))
    absences  = int(uci_row.get('absences', 0))
    assignment_submission_rate = derive_submission_rate(studytime, absences)

    # ── Semester label ──────────────────────────────────────────────────────
    current_year = datetime.now().year
    semester     = f"Term 1 {current_year}"

    return {
        'student_id'               : student_db_id,
        'semester'                 : semester,
        'current_gpa'             : current_gpa,
        'previous_gpa'            : previous_gpa,
        'grade_trend'              : grade_trend,
        'failed_subjects'          : failed_subjects,
        'total_subjects'           : 5,
        'assignment_submission_rate': assignment_submission_rate,
        'math_score'               : math_score,
        'science_score'            : science_score,
        'english_score'            : english_score,
        'social_score'             : social_score,
        'language_score'           : language_score,
        'recorded_date'            : date.today(),
    }


# ==============================================================================
# STEP 4 — GENERATE ATTENDANCE RECORDS FROM UCI ABSENCES
# ==============================================================================

def generate_attendance_records(uci_row, student_db_id):
    """
    Generate daily attendance records from UCI absences count.
    Spreads absences realistically over the last 90 days.
    """
    absences_total = int(uci_row.get('absences', 0))
    records        = []
    today          = date.today()

    # Generate last 90 school days (Mon-Fri only)
    school_days = []
    current     = today - timedelta(days=1)
    while len(school_days) < 90:
        if current.weekday() < 5:   # Mon=0 ... Fri=4
            school_days.append(current)
        current -= timedelta(days=1)

    # Cap absences to available school days
    absences_total = min(absences_total, len(school_days) - 5)

    # Randomly pick which days are absent
    absent_days = set(random.sample(
        range(len(school_days)),
        max(0, absences_total)
    ))

    for idx, school_day in enumerate(school_days):
        if idx in absent_days:
            status = 'absent'
        else:
            # 5% chance of 'late', rest 'present'
            status = 'late' if random.random() < 0.05 else 'present'

        records.append({
            'student_id'     : student_db_id,
            'attendance_date': school_day,
            'status'         : status,
            'remarks'        : None,
            'marked_by'      : None,
        })

    return records


# ==============================================================================
# STEP 5 — CLEAR EXISTING STUDENT DATA
# ==============================================================================

def clear_existing_data(db):
    """
    Clear all existing student-related data from the database.
    Preserves: users table (admin/teacher accounts stay intact)
    """
    print("\n🗑️  Clearing existing student data...")

    try:
        # Order matters due to foreign key constraints
        db.execute(text("DELETE FROM risk_predictions"))
        db.execute(text("DELETE FROM behavioral_incidents"))
        db.execute(text("DELETE FROM attendance"))
        db.execute(text("DELETE FROM academic_records"))
        db.execute(text("DELETE FROM students"))

        # Reset sequences so IDs start from 1
        db.execute(text("ALTER SEQUENCE students_id_seq RESTART WITH 1"))
        db.execute(text("ALTER SEQUENCE academic_records_id_seq RESTART WITH 1"))
        db.execute(text("ALTER SEQUENCE attendance_id_seq RESTART WITH 1"))
        db.execute(text("ALTER SEQUENCE risk_predictions_id_seq RESTART WITH 1"))

        db.commit()
        print("   ✅ Existing data cleared successfully")

    except Exception as e:
        db.rollback()
        print(f"   ❌ Error clearing data: {e}")
        raise


# ==============================================================================
# STEP 6 — ASSIGN STUDENTS TO GRADES EVENLY
# ==============================================================================

def assign_grades_to_rows(df):
    """
    Assign each UCI row to a grade (6-10) evenly.
    Returns list of (uci_row, grade, section) tuples.
    """
    total    = min(len(df), TOTAL_TARGET)
    df_sample = df.sample(n=total, random_state=42).reset_index(drop=True)

    assignments = []
    grade_counts = {6: 0, 7: 0, 8: 0, 9: 0, 10: 0}
    per_grade    = total // 5

    for _, row in df_sample.iterrows():
        # Find grade that still needs students
        assigned_grade = None
        for g in [6, 7, 8, 9, 10]:
            if grade_counts[g] < per_grade:
                assigned_grade = g
                break

        if assigned_grade is None:
            break

        section = SECTIONS[grade_counts[assigned_grade] % len(SECTIONS)]
        grade_counts[assigned_grade] += 1
        assignments.append((row, assigned_grade, section))

    return assignments, grade_counts


# ==============================================================================
# MAIN IMPORT FUNCTION
# ==============================================================================

def run_import():
    """Main function to run the full UCI import pipeline"""

    print("\n" + "=" * 65)
    print("  🎓 SCHOLARSENSE — UCI DATASET IMPORT")
    print("=" * 65)

    # ── Load UCI data ───────────────────────────────────────────────────────
    df = load_uci_data()

    # ── Confirmation prompt ─────────────────────────────────────────────────
    print(f"\n⚠️  WARNING: This will DELETE all existing student data!")
    print(f"   New data: ~{TOTAL_TARGET} students from UCI dataset")
    confirm = input("\n   Type 'YES' to continue: ").strip()

    if confirm != 'YES':
        print("\n❌ Import cancelled.")
        sys.exit(0)

    # ── Assign grades ───────────────────────────────────────────────────────
    print("\n📊 Assigning students to grades...")
    assignments, grade_counts = assign_grades_to_rows(df)
    print(f"   Total to import: {len(assignments)} students")

    # ── Database session ────────────────────────────────────────────────────
    db = SessionLocal()

    try:
        # ── Clear existing data ─────────────────────────────────────────────
        clear_existing_data(db)

        # ── Import loop ─────────────────────────────────────────────────────
        print(f"\n⏳ Importing students...")
        print(f"   {'Progress':<15} {'Student':<25} {'Grade':<8} {'Section'}")
        print(f"   {'-'*55}")

        used_names           = set()
        students_imported    = 0
        attendance_imported  = 0
        failed_rows          = 0

        # Collect features + labels for ML retraining
        ml_features = []
        ml_labels   = []

        for idx, (uci_row, grade, section) in enumerate(assignments, 1):

            try:
                # ── 1. Generate student record ──────────────────────────────
                student_data = generate_student_record(
                    uci_row, idx, grade, section, used_names
                )

                # ── 2. Insert student into DB ───────────────────────────────
                student = Student(**student_data)
                db.add(student)
                db.flush()   # Get the auto-generated student.id

                # ── 3. Generate + insert academic record ────────────────────
                academic_data = generate_academic_record(uci_row, student.id)
                academic      = AcademicRecord(**academic_data)
                db.add(academic)

                # ── 4. Generate + insert attendance records ──────────────────
                att_records = generate_attendance_records(uci_row, student.id)
                for att in att_records:
                    attendance = Attendance(**att)
                    db.add(attendance)
                attendance_imported += len(att_records)

                # ── 5. Collect ML features for retraining ───────────────────
                absences  = int(uci_row.get('absences', 0))
                failures  = int(uci_row.get('failures', 0))
                g3        = int(uci_row.get('G3', 10))
                risk_level, _ = derive_risk_label(g3, failures, absences)

                ml_features.append([
                    student_data['age'],
                    grade,
                    1 if student_data['gender'] == 'Male' else 0,
                    {'Low': 0, 'Medium': 1, 'High': 2}.get(
                        student_data['socioeconomic_status'], 1),
                    {'None': 0, 'High School': 1,
                     'Graduate': 2, 'Post-Graduate': 3}.get(
                        student_data['parent_education'], 1),
                    academic_data['current_gpa'],
                    academic_data['previous_gpa'],
                    academic_data['grade_trend'],
                    # attendance rate
                    round(
                        (len(att_records) - absences)
                        / max(len(att_records), 1) * 100, 2
                    ),
                    academic_data['failed_subjects'],
                    academic_data['assignment_submission_rate'],
                    failures,   # behavioral proxy
                    academic_data['math_score'],
                    academic_data['science_score'],
                    academic_data['english_score'],
                    academic_data['social_score'],
                    academic_data['language_score'],
                ])
                ml_labels.append(risk_level)

                students_imported += 1

                # ── Progress display ─────────────────────────────────────────
                if idx % 20 == 0 or idx == len(assignments):
                    pct  = int((idx / len(assignments)) * 100)
                    bar  = '█' * (pct // 5) + '░' * (20 - pct // 5)
                    name = (f"{student_data['first_name']} "
                            f"{student_data['last_name']}")
                    print(f"   [{bar}] {pct:3}%  "
                          f"{name:<25} Gr.{grade}  {section}")

            except Exception as e:
                failed_rows += 1
                print(f"\n   ⚠️  Row {idx} failed: {e}")
                db.rollback()
                # Re-open session and continue
                db = SessionLocal()
                continue

        # ── Commit all records ───────────────────────────────────────────────
        db.commit()
        print(f"\n   ✅ Database commit successful!")

    except Exception as e:
        db.rollback()
        print(f"\n❌ Import failed: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

    finally:
        db.close()

    # ── Print summary ────────────────────────────────────────────────────────
    print("\n" + "=" * 65)
    print("  ✅ IMPORT COMPLETE — SUMMARY")
    print("=" * 65)
    print(f"  📥 Students imported    : {students_imported}")
    print(f"  📋 Attendance records   : {attendance_imported}")
    print(f"  ⚠️  Failed rows          : {failed_rows}")
    print(f"\n  📊 Students per grade:")
    for g, count in grade_counts.items():
        bar = '█' * (count // 4)
        print(f"     Grade {g}  : {count:3} students  {bar}")
    print("=" * 65)

    # ── Return ML data for retraining ────────────────────────────────────────
    return ml_features, ml_labels


# ==============================================================================
# ENTRY POINT
# ==============================================================================

if __name__ == "__main__":
    ml_features, ml_labels = run_import()

    # ── Ask if user wants to retrain ML model ───────────────────────────────
    print("\n🤖 ML Model Retraining")
    retrain = input(
        "   Retrain ML model on imported UCI data? (YES/no): "
    ).strip()

    if retrain.upper() == 'YES' or retrain == '':
        print("\n   ⏳ Retraining... (see Phase 3 script)")
        print("   Run: python backend/scripts/retrain_model.py")
    else:
        print("\n   ⏭️  Skipping model retraining.")

    print("\n🎉 Enhancement 1 — Phase 2 Complete!\n")
