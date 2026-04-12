# Alert Management System Documentation

## Overview
The Alert Management System provides two comprehensive alert mechanisms for proactive student monitoring:

1. **Academic Performance Alerts** - PDF reports with detailed analysis
2. **Attendance Threshold Alerts** - Email alerts with attendance reports

---

## 🎓 Academic Performance Alerts

### Features
- **Comprehensive PDF Reports** including:
  - Student information and parent contact details
  - Current risk assessment with confidence scores
  - Risk factors analysis (GPA, attendance, behavioral issues, etc.)
  - Subject-wise performance breakdown
  - Detailed recommendations and action plan
  - Parent action required section

### How It Works
1. System identifies high-risk students (High/Critical risk levels)
2. Teacher/Admin can preview PDF report before sending
3. PDF is generated with complete academic analysis
4. Email sent to parent with PDF attachment
5. Email includes HTML formatted summary

### Usage

#### Frontend (React)
```javascript
// Navigate to Alerts page → Academic Performance Alerts tab
// 1. Filter by Grade/Section
// 2. Click "Preview PDF" to review report
// 3. Click "Send Alert" to email parent
```

#### Backend API
```python
# Preview PDF (download)
GET /api/alerts/academic-alert/preview/{student_id}

# Send PDF via email
POST /api/alerts/academic-alert/send/{student_id}
```

### PDF Report Sections
1. **Student Information** - Name, ID, Grade, Parent details
2. **Risk Assessment** - Current risk level with confidence
3. **Risk Factors Analysis** - Detailed breakdown of contributing factors:
   - Critical/Low GPA
   - Declining grades
   - Failed subjects
   - Low assignment submission
   - Poor attendance
   - Behavioral incidents
4. **Academic Performance Details** - Subject-wise scores
5. **Recommendations & Action Plan** - Specific suggestions:
   - Remedial classes
   - Peer tutoring
   - Counseling sessions
   - Parent-teacher meetings
   - Progress monitoring
6. **Parent Action Required** - Clear call-to-action

---

## 📅 Attendance Threshold Alerts

### Features
- **Flexible Threshold Setting** - Set any percentage (e.g., 75%)
- **Filter Options** - By Grade and/or Section
- **Bulk or Individual Sending** - Send to all or selected students
- **Simple Email Format** - Text and HTML table format
- **Real-time Statistics** - View attendance breakdown

### How It Works
1. Teacher sets attendance threshold (e.g., 75%)
2. System calculates attendance for last 30 days
3. Identifies students below threshold
4. Shows detailed list with attendance stats
5. Send alerts individually or in bulk
6. Email includes attendance table and status

### Usage

#### Frontend (React)
```javascript
// Navigate to Alerts page → Attendance Alerts tab
// 1. Set threshold percentage (e.g., 75)
// 2. Optional: Filter by Grade/Section
// 3. Click "Check Threshold"
// 4. Review list of students below threshold
// 5. Select students or use "Select All"
// 6. Click "Send Alerts" for bulk send
// OR click individual "Send Alert" buttons
```

#### Backend API
```python
# Check students below threshold
POST /api/alerts/attendance-alert/check
Body: {
  "threshold": 75.0,
  "grade": 8,  # optional
  "section": "A"  # optional
}

# Send single alert
POST /api/alerts/attendance-alert/send-single
Body: {
  "student_id": 123,
  "threshold": 75.0
}

# Send bulk alerts
POST /api/alerts/attendance-alert/send-bulk
Body: {
  "threshold": 75.0,
  "grade": 8,  # optional
  "section": "A"  # optional
}
```

### Email Content
- **Subject**: ⚠️ Low Attendance Alert - [Student Name]
- **Content**:
  - Student details (Name, Grade, Section, ID)
  - Attendance table (Last 30 days):
    - Total school days
    - Days present
    - Days absent
    - Attendance rate
    - Required threshold
  - Status alert (Below threshold by X%)
  - Action required message

---

## 🏗️ Architecture

### Backend Structure
```
backend/
├── services/
│   ├── alert_service.py          # Main alert logic
│   ├── pdf_service.py            # PDF generation (updated)
│   └── email_service.py          # Email sending
├── routes/
│   └── alert_routes.py           # API endpoints
└── test_alerts.py                # Test script
```

### Frontend Structure
```
frontend-react/
└── src/
    └── pages/
        └── Alerts.jsx            # Complete alert UI
```

### Key Components

#### AlertService (backend/services/alert_service.py)
- `send_academic_performance_alert(student_id)` - Generate & send PDF
- `get_students_below_attendance_threshold(threshold, grade, section)` - Query students
- `send_attendance_alert_email(student_data, threshold)` - Send single email
- `send_bulk_attendance_alerts(threshold, grade, section)` - Bulk send

#### PDFService (backend/services/pdf_service.py)
- `generate_academic_performance_alert(student_id)` - New comprehensive PDF

#### Alert Routes (backend/routes/alert_routes.py)
- `/api/alerts/academic-alert/preview/<id>` - Preview PDF
- `/api/alerts/academic-alert/send/<id>` - Send academic alert
- `/api/alerts/attendance-alert/check` - Check threshold
- `/api/alerts/attendance-alert/send-single` - Send one
- `/api/alerts/attendance-alert/send-bulk` - Send many
- `/api/alerts/stats` - Get statistics

---

## 📊 Data Flow

### Academic Performance Alert Flow
```
1. Frontend: User clicks "Send Alert"
   ↓
2. API: POST /api/alerts/academic-alert/send/{student_id}
   ↓
3. AlertService.send_academic_performance_alert()
   ↓
4. PDFService.generate_academic_performance_alert()
   - Fetch student data
   - Fetch academic records
   - Fetch risk prediction
   - Fetch attendance stats
   - Fetch behavioral incidents
   - Generate PDF with all sections
   ↓
5. EmailService: Send email with PDF attachment
   ↓
6. Return success/failure to frontend
```

### Attendance Alert Flow
```
1. Frontend: User sets threshold & clicks "Check Threshold"
   ↓
2. API: POST /api/alerts/attendance-alert/check
   ↓
3. AlertService.get_students_below_attendance_threshold()
   - Query all active students (with filters)
   - Calculate attendance for last 30 days
   - Filter students below threshold
   - Sort by attendance rate
   ↓
4. Return list to frontend
   ↓
5. Frontend: User clicks "Send Alerts"
   ↓
6. API: POST /api/alerts/attendance-alert/send-bulk
   ↓
7. AlertService.send_bulk_attendance_alerts()
   - For each student:
     - Generate email with attendance table
     - Send via EmailService
   ↓
8. Return summary (sent/failed counts)
```

---

## ⚙️ Configuration

### Email Settings (.env)
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM_NAME=ScholarSense
```

### School Settings (backend/config/settings.py)
```python
SCHOOL_NAME = "Greenwood High School"
ACADEMIC_YEAR = "2024-2025"
```

---

## 🧪 Testing

### Run Test Script
```bash
cd backend
python test_alerts.py
```

### Manual Testing

#### Test Academic Alert
1. Start backend: `python backend/api.py`
2. Start frontend: `npm run dev` (in frontend-react)
3. Login as admin/teacher
4. Navigate to Alerts → Academic Performance Alerts
5. Click "Preview PDF" on any high-risk student
6. Verify PDF opens with all sections
7. Click "Send Alert" (ensure parent email is configured)
8. Check parent email inbox

#### Test Attendance Alert
1. Navigate to Alerts → Attendance Alerts
2. Set threshold to 75%
3. Click "Check Threshold"
4. Verify list shows students below 75%
5. Select a student
6. Click "Send Alert"
7. Check parent email inbox
8. Verify email has attendance table

---

## 🎨 UI Features

### Academic Performance Alerts Tab
- **Filter Panel**: Grade and Section dropdowns
- **Statistics Cards**: Total high-risk, Critical, High counts
- **Student Cards**: 
  - Risk badge with color coding
  - Student details
  - Preview PDF button (purple)
  - Send Alert button (orange)
- **Color Coding**:
  - 🔴 Critical - Red
  - 🟠 High - Orange
  - 🟡 Medium - Yellow
  - 🟢 Low - Green

### Attendance Alerts Tab
- **Configuration Panel**: Threshold, Grade, Section inputs
- **Statistics Cards**: Below threshold, <60%, 60-75%, Selected counts
- **Bulk Actions Bar**: Select All, Send to X students
- **Student Cards**:
  - Checkbox for selection
  - Attendance percentage (color-coded)
  - Attendance breakdown (Total/Present/Absent)
  - Individual Send Alert button
- **Empty State**: Checkmark icon when all students meet threshold

---

## 📝 Best Practices

### Academic Performance Alerts
1. **Preview First**: Always preview PDF before sending
2. **Verify Email**: Ensure parent email is configured
3. **Regular Monitoring**: Send alerts weekly for high-risk students
4. **Follow Up**: Schedule parent meetings after sending alerts

### Attendance Alerts
1. **Consistent Threshold**: Use school policy threshold (typically 75%)
2. **Regular Checks**: Run weekly attendance checks
3. **Bulk Send**: Use bulk send for efficiency
4. **Grade-Level Focus**: Filter by grade for targeted interventions
5. **Track Responses**: Monitor which parents respond

---

## 🔒 Security & Privacy

- **JWT Authentication**: All endpoints require valid JWT token
- **Role-Based Access**: Only teachers/admins can send alerts
- **Email Privacy**: Parent emails not exposed in frontend
- **PDF Confidentiality**: PDFs marked "Confidential - For Parent/Guardian Use Only"
- **Data Protection**: Student data encrypted in transit (HTTPS)

---

## 🚀 Future Enhancements

### Potential Features
1. **SMS Alerts**: Add SMS option for urgent alerts
2. **Alert History**: Track sent alerts with timestamps
3. **Parent Acknowledgment**: Track if parent opened email/PDF
4. **Scheduled Alerts**: Auto-send alerts on specific days
5. **Custom Templates**: Allow teachers to customize alert messages
6. **Multi-language**: Support for regional languages
7. **Alert Analytics**: Dashboard showing alert effectiveness
8. **Batch Scheduling**: Schedule bulk alerts for future date

---

## 📞 Support

For issues or questions:
1. Check backend logs: `backend/api.py` console output
2. Check browser console for frontend errors
3. Verify email configuration in `.env`
4. Test email service: `python backend/services/email_service.py`
5. Run alert tests: `python backend/test_alerts.py`

---

## 📄 License
Educational Project - 2024
