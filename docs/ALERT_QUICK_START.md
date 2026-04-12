# Alert System - Quick Start Guide

## 🚀 Getting Started in 5 Minutes

### Prerequisites
✅ Backend running on port 5001
✅ Frontend running on port 5173
✅ Email credentials configured in `.env`
✅ Students with academic records and attendance data

---

## 📧 Step 1: Configure Email (One-time Setup)

Edit `backend/.env`:
```bash
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password  # Use Gmail App Password, not regular password
EMAIL_FROM_NAME=ScholarSense
```

**Get Gmail App Password:**
1. Go to Google Account → Security
2. Enable 2-Step Verification
3. Search "App passwords"
4. Generate password for "Mail"
5. Copy 16-character password to `.env`

---

## 🎯 Step 2: Academic Performance Alerts

### Send Alert to High-Risk Student

1. **Login** to ScholarSense (admin or teacher account)

2. **Navigate** to Alerts page (sidebar menu)

3. **Select** "📊 Academic Performance Alerts" tab

4. **Filter** (optional):
   - Select Grade: e.g., "Grade 8"
   - Select Section: e.g., "Section A"

5. **Preview PDF**:
   - Click "👁️ Preview PDF" button on any student
   - PDF opens in new tab
   - Review all sections

6. **Send Alert**:
   - Click "📧 Send Alert" button
   - Confirm in popup dialog
   - Wait for success message
   - Check parent's email inbox

### What Parent Receives
- **Email Subject**: 📊 Academic Performance Alert - [Student Name]
- **Email Body**: HTML formatted summary
- **Attachment**: Comprehensive PDF report (5-7 pages) with:
  - Student information
  - Risk assessment
  - Risk factors analysis
  - Performance details
  - Recommendations
  - Action plan

---

## 📅 Step 3: Attendance Threshold Alerts

### Send Alerts to Students Below 75% Attendance

1. **Navigate** to "📅 Attendance Alerts" tab

2. **Set Threshold**:
   - Enter: `75` (or any percentage)

3. **Filter** (optional):
   - Select Grade: e.g., "Grade 9"
   - Select Section: e.g., "Section B"

4. **Check Threshold**:
   - Click "🔍 Check Threshold" button
   - Wait for results

5. **Review Students**:
   - See list of students below threshold
   - Check attendance percentages
   - View statistics cards

6. **Send Alerts**:
   
   **Option A - Bulk Send (All Students):**
   - Click "Select All" checkbox
   - Click "📧 Send Alerts to X Students"
   - Confirm in popup
   - Wait for success message
   
   **Option B - Individual Send:**
   - Click "📧 Send Alert" on specific student
   - Confirm in popup
   - Wait for success message

### What Parent Receives
- **Email Subject**: ⚠️ Low Attendance Alert - [Student Name]
- **Email Body**: HTML table with:
  - Student details
  - Attendance report (last 30 days)
  - Total days, Present, Absent
  - Attendance rate vs threshold
  - Status alert
  - Action required message

---

## 📊 Understanding the Dashboard

### Academic Performance Alerts Tab

**Statistics Cards:**
- **Total High-Risk Students** - All students with High/Critical risk
- **Critical Risk** - Students needing immediate intervention
- **High Risk** - Students requiring close monitoring

**Student Cards Show:**
- Student name with risk badge (🔴 Critical, 🟠 High)
- Grade, Section, Student ID
- Parent name and email
- Confidence score
- Assessment date
- Two action buttons

### Attendance Alerts Tab

**Statistics Cards:**
- **Students Below Threshold** - Total count
- **Below 60%** - Severe attendance issues
- **60% - 75%** - Moderate attendance issues
- **Selected** - Currently selected for bulk send

**Student Cards Show:**
- Student name with attendance percentage
- Grade, Section, Student ID
- Parent name and email
- Total days, Present, Absent
- Checkbox for selection
- Send alert button

---

## 🎨 Color Coding Guide

### Risk Levels
- 🔴 **Critical** (Red) - Immediate action required
- 🟠 **High** (Orange) - Close monitoring needed
- 🟡 **Medium** (Yellow) - Watch carefully
- 🟢 **Low** (Green) - On track

### Attendance Rates
- **Green** (≥75%) - Meeting requirements
- **Orange** (60-74%) - Below threshold
- **Red** (<60%) - Severe attendance issues

---

## ✅ Quick Checklist

### Before Sending Academic Alerts
- [ ] Student has risk prediction (run prediction first)
- [ ] Student has academic records
- [ ] Parent email is configured
- [ ] Preview PDF to verify content
- [ ] Confirm parent contact details

### Before Sending Attendance Alerts
- [ ] Attendance data exists for last 30 days
- [ ] Threshold is set correctly (school policy)
- [ ] Parent email is configured
- [ ] Filters applied if needed (Grade/Section)
- [ ] Reviewed list of students

---

## 🔧 Troubleshooting

### "Failed to send alert"
**Possible causes:**
1. Email credentials not configured → Check `.env`
2. Parent email missing → Update student record
3. SMTP blocked → Check firewall/antivirus
4. Gmail security → Use App Password, not regular password

**Solution:**
```bash
# Test email service
cd backend
python services/email_service.py
# Enter test email when prompted
```

### "No students found"
**Academic Alerts:**
- No high-risk students → Run risk predictions first
- Filters too restrictive → Clear filters

**Attendance Alerts:**
- All students above threshold → Lower threshold or check attendance data
- No attendance records → Post attendance first

### "PDF preview not working"
**Possible causes:**
1. Student has no academic records
2. Browser blocking popups
3. Backend error

**Solution:**
- Check browser console for errors
- Allow popups for localhost:5173
- Check backend logs

---

## 📱 Mobile/Tablet Usage

The alert system is responsive and works on:
- ✅ Desktop (recommended)
- ✅ Tablet (landscape mode)
- ⚠️ Mobile (limited, use desktop for best experience)

---

## 🎓 Best Practices

### Academic Performance Alerts
1. **Weekly Review** - Check high-risk students every week
2. **Preview First** - Always preview PDF before sending
3. **Follow Up** - Schedule parent meeting after sending
4. **Document** - Keep record of sent alerts
5. **Monitor Response** - Track parent engagement

### Attendance Alerts
1. **Consistent Threshold** - Use school policy (typically 75%)
2. **Weekly Checks** - Run every Monday morning
3. **Bulk Send** - More efficient than individual
4. **Grade-Level Focus** - Target specific grades
5. **Track Improvement** - Monitor attendance changes

---

## 📞 Need Help?

### Common Questions

**Q: How often should I send alerts?**
A: Academic alerts - weekly for high-risk students. Attendance alerts - weekly or bi-weekly.

**Q: Can I customize the PDF content?**
A: Yes, edit `backend/services/pdf_service.py` → `generate_academic_performance_alert()`

**Q: Can I change email template?**
A: Yes, edit `backend/services/alert_service.py` → email HTML sections

**Q: What if parent doesn't have email?**
A: Update student record with parent email, or use phone contact (future SMS feature)

**Q: Can I send to multiple grades at once?**
A: Yes, leave Grade filter empty to include all grades

---

## 🎉 You're Ready!

Start sending alerts to keep parents informed and students on track for success!

**Quick Links:**
- Full Documentation: `docs/ALERT_SYSTEM.md`
- Implementation Details: `docs/ALERT_IMPLEMENTATION_SUMMARY.md`
- Test Script: `backend/test_alerts.py`

---

**Happy Alerting! 🚀**
