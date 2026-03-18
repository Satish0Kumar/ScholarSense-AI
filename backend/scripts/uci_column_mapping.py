"""
UCI Dataset Column Mapping Configuration
Maps UCI Student Performance columns → ScholarSense database schema
"""

# ── Age to Grade mapping ───────────────────────────────────────────────────────
# UCI students are aged 15-22. We map them to grades 6-10.
AGE_TO_GRADE = {
    15: 6,
    16: 7,
    17: 8,
    18: 9,
    19: 10,
    20: 10,
    21: 10,
    22: 10
}

# ── Parent education mapping ───────────────────────────────────────────────────
# UCI: 0=none, 1=primary(4th), 2=5th-9th, 3=secondary, 4=higher
PARENT_EDUCATION_MAP = {
    0: "None",
    1: "High School",
    2: "High School",
    3: "High School",
    4: "Graduate"
}

# ── Socioeconomic status derivation ───────────────────────────────────────────
# Derived from UCI's Pstatus (parent cohabitation) + Medu/Fedu average
def derive_socioeconomic_status(pstatus, medu, fedu):
    """
    Derive socioeconomic status from UCI columns.
    pstatus: 'T' = together, 'A' = apart
    medu/fedu: 0-4 education levels
    """
    edu_avg = (medu + fedu) / 2

    if pstatus == 'A' and edu_avg <= 1:
        return 'Low'
    elif pstatus == 'T' and edu_avg >= 3:
        return 'High'
    else:
        return 'Medium'

# ── Parent education (take higher of mother/father) ────────────────────────────
def derive_parent_education(medu, fedu):
    """Take the higher education level of both parents"""
    max_edu = max(medu, fedu)
    return PARENT_EDUCATION_MAP.get(max_edu, "High School")

# ── Risk label derivation from UCI scores ─────────────────────────────────────
def derive_risk_label(g3, failures, absences):
    """
    Derive dropout risk level from real UCI outcome data.
    This is the ground truth used to retrain the ML model.
    
    g3       : Final grade (0-20 scale in UCI)
    failures : Past class failures (0-4)
    absences : Number of school absences
    """
    # Convert G3 from UCI 0-20 scale → percentage 0-100
    g3_pct = g3 * 5

    if g3_pct < 35 or failures >= 2 or absences > 20:
        return 3, "Critical"
    elif g3_pct < 50 or failures == 1 or absences > 12:
        return 2, "High"
    elif g3_pct < 65 or absences > 6:
        return 1, "Medium"
    else:
        return 0, "Low"

# ── Convert UCI 0-20 grade → percentage score ─────────────────────────────────
def uci_grade_to_percent(grade):
    """Convert UCI 0-20 grade to 0-100 percentage"""
    return round(grade * 5, 2)

# ── Assignment submission rate from studytime ─────────────────────────────────
# UCI studytime: 1=<2hrs, 2=2-5hrs, 3=5-10hrs, 4=>10hrs
STUDYTIME_TO_SUBMISSION_RATE = {
    1: 55.0,   # Low study → low submission
    2: 72.0,
    3: 85.0,
    4: 95.0    # High study → high submission
}

def derive_submission_rate(studytime, absences):
    """
    Derive assignment submission rate.
    Base from studytime, reduced by absence impact.
    """
    base = STUDYTIME_TO_SUBMISSION_RATE.get(studytime, 72.0)
    # Each 5 absences reduces submission rate by ~5%
    absence_penalty = (absences // 5) * 5
    return max(30.0, round(base - absence_penalty, 2))

# ── Sections assignment ────────────────────────────────────────────────────────
SECTIONS = ['A', 'B', 'C']

# ── Pass mark threshold ───────────────────────────────────────────────────────
PASS_MARK = 35  # Below this = failed subject
