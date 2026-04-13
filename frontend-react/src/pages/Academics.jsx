import { useState, useEffect } from 'react';
import api from '../utils/api';

/* ── shared style tokens ── */
const glass = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(99,102,241,0.2)',
  backdropFilter: 'blur(12px)',
};

const inputStyle = {
  background: 'rgba(99,102,241,0.1)',
  border: '1px solid rgba(99,102,241,0.3)',
  color: '#fff',
};

const labelStyle = {
  display: 'block',
  fontSize: '0.7rem',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'rgba(165,180,252,0.7)',
  marginBottom: '0.4rem',
};

/* ── Loading spinner ── */
const Spinner = ({ text = 'Loading...' }) => (
  <div className="flex items-center justify-center py-16 gap-3">
    <svg className="animate-spin w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
    <p className="text-indigo-300 text-sm">{text}</p>
  </div>
);

/* ── Empty state ── */
const EmptyState = ({ icon, message }) => (
  <div className="flex flex-col items-center justify-center py-14 gap-3">
    <span className="text-4xl">{icon}</span>
    <p className="text-sm" style={{ color: 'rgba(165,180,252,0.5)' }}>{message}</p>
  </div>
);

/* ── Styled select ── */
const StyledSelect = ({ label, value, onChange, children, className = '' }) => (
  <div className={className}>
    {label && <label style={labelStyle}>{label}</label>}
    <select
      value={value}
      onChange={onChange}
      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
      style={inputStyle}
    >
      {children}
    </select>
  </div>
);

/* ── Styled input ── */
const StyledInput = ({ label, type = 'text', value, onChange, placeholder, className = '' }) => (
  <div className={className}>
    {label && <label style={labelStyle}>{label}</label>}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
      style={inputStyle}
      onFocus={e => e.target.style.borderColor = '#6366f1'}
      onBlur={e => e.target.style.borderColor = 'rgba(99,102,241,0.3)'}
    />
  </div>
);

/* ── Posted banner ── */
const PostedBanner = ({ title, subtitle }) => (
  <div className="flex items-center gap-4 p-4 rounded-2xl"
    style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.3)' }}>
    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
      style={{ background: 'rgba(34,197,94,0.2)' }}>✅</div>
    <div>
      <p className="font-semibold text-sm" style={{ color: '#86efac' }}>{title}</p>
      <p className="text-xs mt-0.5" style={{ color: 'rgba(134,239,172,0.7)' }}>{subtitle}</p>
    </div>
  </div>
);

const Academics = () => {
  const [activeTab, setActiveTab] = useState('attendance');

  const tabs = [
    { id: 'attendance', icon: '📅', label: 'Attendance' },
    { id: 'marks',      icon: '📝', label: 'Marks Entry' },
    { id: 'behaviour',  icon: '⚠️', label: 'Behaviour' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Academics</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(165,180,252,0.6)' }}>
            Attendance, marks, and behavioural records
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 rounded-2xl" style={glass}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            style={activeTab === tab.id
              ? { background: 'linear-gradient(135deg, rgba(99,102,241,0.5), rgba(139,92,246,0.4))', color: '#fff', border: '1px solid rgba(99,102,241,0.5)' }
              : { color: 'rgba(165,180,252,0.6)', border: '1px solid transparent' }
            }
          >
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="rounded-2xl p-6" style={glass}>
        {activeTab === 'attendance' && <AttendanceTab />}
        {activeTab === 'marks'      && <MarksTab />}
        {activeTab === 'behaviour'  && <BehaviourTab />}
      </div>
    </div>
  );
};

// ============================================
// ATTENDANCE TAB
// ============================================
const AttendanceTab = () => {
  const [date, setDate]         = useState(new Date().toISOString().split('T')[0]);
  const [grade, setGrade]       = useState(6);
  const [section, setSection]   = useState('A');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [isPosted, setIsPosted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => { fetchDailyAttendance(); }, [date, grade, section]);

  const fetchDailyAttendance = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/attendance/daily?date=${date}&grade=${grade}&section=${section}`);
      const studentsList = response.data || [];
      setStudents(studentsList);
      const map = {};
      let hasPosted = false;
      studentsList.forEach(s => {
        if (s.attendance?.status) {
          map[s.id] = s.attendance.status.charAt(0).toUpperCase() + s.attendance.status.slice(1);
          hasPosted = true;
        } else {
          map[s.id] = 'Present';
        }
      });
      setAttendance(map);
      setIsPosted(hasPosted);
      setIsEditing(false);
    } catch {
      setStudents([]); setAttendance({}); setIsPosted(false); setIsEditing(false);
    } finally { setLoading(false); }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleBulkSave = async () => {
    setSaving(true);
    try {
      const attendanceList = students.map(s => ({
        student_id: s.id,
        date,
        status: (attendance[s.id] || 'Present').toLowerCase()
      }));
      await api.post('/attendance/bulk', { attendance_list: attendanceList });
      alert('Attendance saved successfully!');
      setIsPosted(true); setIsEditing(false);
      fetchDailyAttendance();
    } catch (error) {
      alert('Failed to save attendance: ' + (error.response?.data?.error || error.message));
    } finally { setSaving(false); }
  };

  const statusConfig = {
    Present: { bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.4)',  color: '#86efac' },
    Absent:  { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.4)',  color: '#fca5a5' },
    Late:    { bg: 'rgba(234,179,8,0.15)',  border: 'rgba(234,179,8,0.4)',  color: '#fde047' },
    Excused: { bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.4)', color: '#a5b4fc' },
  };

  const presentCount = Object.values(attendance).filter(s => s === 'Present').length;
  const absentCount  = Object.values(attendance).filter(s => s === 'Absent').length;

  return (
    <div className="space-y-5">
      {/* Controls Row */}
      <div className="flex flex-wrap gap-3 items-end">
        <StyledInput
          label="Date"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          className="w-44"
        />
        <StyledSelect label="Grade" value={grade} onChange={e => setGrade(Number(e.target.value))} className="w-28">
          {[6,7,8,9,10].map(g => <option key={g} value={g} style={{background:'#1e1b4b'}}>{g}</option>)}
        </StyledSelect>
        <StyledSelect label="Section" value={section} onChange={e => setSection(e.target.value)} className="w-28">
          {['A','B','C','D'].map(s => <option key={s} value={s} style={{background:'#1e1b4b'}}>{s}</option>)}
        </StyledSelect>
        <div className="mt-auto">
          {isPosted && !isEditing ? (
            <button onClick={() => setIsEditing(true)}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200"
              style={{ background: 'rgba(249,115,22,0.2)', border: '1px solid rgba(249,115,22,0.4)', color: '#fdba74' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(249,115,22,0.35)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(249,115,22,0.2)'}>
              ✏️ Edit Attendance
            </button>
          ) : (
            <button onClick={handleBulkSave} disabled={saving || students.length === 0}
              className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ background: saving ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
              {saving ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                  Saving...
                </span>
              ) : isPosted ? '🔄 Update Attendance' : '💾 Save Attendance'}
            </button>
          )}
        </div>
      </div>

      {/* Summary Pills */}
      {students.length > 0 && (
        <div className="flex gap-3 flex-wrap">
          {[
            { label: 'Total', val: students.length, color: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.35)', text: '#a5b4fc' },
            { label: 'Present', val: presentCount,  color: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.3)',   text: '#86efac' },
            { label: 'Absent',  val: absentCount,   color: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',   text: '#fca5a5' },
          ].map(p => (
            <div key={p.label} className="px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2"
              style={{ background: p.color, border: `1px solid ${p.border}`, color: p.text }}>
              <span style={{ color: 'rgba(165,180,252,0.6)', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{p.label}</span>
              <span className="text-lg font-bold">{p.val}</span>
            </div>
          ))}
        </div>
      )}

      {isPosted && !isEditing && (
        <PostedBanner
          title="Attendance Posted"
          subtitle={`Grade ${grade}-${section} · ${new Date(date).toLocaleDateString()}`}
        />
      )}

      {loading ? <Spinner text="Loading students..." /> : students.length === 0 ? (
        <EmptyState icon="🏫" message="No students found for this class" />
      ) : (
        <div className="rounded-2xl overflow-hidden" style={{ border: '1px solid rgba(99,102,241,0.15)' }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.08)' }}>
                {['Student ID', 'Name', 'Attendance Status'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'rgba(165,180,252,0.7)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map(student => {
                const currentStatus = attendance[student.id] || 'Present';
                const sc = statusConfig[currentStatus] || statusConfig.Present;
                return (
                  <tr key={student.id}
                    style={{ borderBottom: '1px solid rgba(99,102,241,0.08)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td className="px-5 py-3.5">
                      <span className="text-xs font-mono px-2 py-1 rounded-lg"
                        style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
                        {student.student_id}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                          {student.first_name?.[0]}{student.last_name?.[0]}
                        </div>
                        <span className="text-sm font-semibold text-white">{student.first_name} {student.last_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      {isPosted && !isEditing ? (
                        <span className="px-3 py-1.5 rounded-full text-xs font-semibold"
                          style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color }}>
                          {currentStatus}
                        </span>
                      ) : (
                        <div className="flex gap-2 flex-wrap">
                          {['Present', 'Absent', 'Late', 'Excused'].map(status => {
                            const s = statusConfig[status];
                            const isActive = currentStatus === status;
                            return (
                              <button key={status} onClick={() => handleStatusChange(student.id, status)}
                                className="px-3 py-1 rounded-lg text-xs font-semibold transition-all duration-150"
                                style={isActive
                                  ? { background: s.bg, border: `1px solid ${s.border}`, color: s.color }
                                  : { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.15)', color: 'rgba(165,180,252,0.5)' }
                                }>
                                {status}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ============================================
// MARKS ENTRY TAB
// ============================================
const MarksTab = () => {
  const [grade, setGrade]       = useState(6);
  const [section, setSection]   = useState('A');
  const [semester, setSemester] = useState('Semester 1');
  const [examType, setExamType] = useState('Mid Term');
  const [students, setStudents] = useState([]);
  const [marks, setMarks]       = useState({});
  const [loading, setLoading]   = useState(false);
  const [saving, setSaving]     = useState(false);
  const [isPosted, setIsPosted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => { fetchStudentsAndMarks(); }, [grade, section, semester, examType]);

  const fetchStudentsAndMarks = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/students?grade=${grade}&section=${section}`);
      const studentList = response.data.students || response.data || [];
      setStudents(studentList);
      try {
        const marksResponse = await api.get(`/marks/${grade}/${section}?semester=${semester}`);
        const existingMarks = marksResponse.data.data?.marks || [];
        const marksMap = {};
        let hasMarks = false;
        studentList.forEach(s => {
          const existing = existingMarks.find(m => m.student_id === s.id && m.exam_type === examType);
          if (existing) {
            marksMap[s.id] = {
              math: existing.math_score || '', science: existing.science_score || '',
              english: existing.english_score || '', social: existing.social_score || '',
              language: existing.language_score || ''
            };
            hasMarks = true;
          } else {
            marksMap[s.id] = { math: '', science: '', english: '', social: '', language: '' };
          }
        });
        setMarks(marksMap); setIsPosted(hasMarks); setIsEditing(false);
      } catch {
        const marksMap = {};
        studentList.forEach(s => { marksMap[s.id] = { math: '', science: '', english: '', social: '', language: '' }; });
        setMarks(marksMap); setIsPosted(false); setIsEditing(false);
      }
    } catch { console.error('Failed to fetch students'); }
    finally { setLoading(false); }
  };

  const handleMarkChange = (studentId, subject, value) => {
    setMarks(prev => ({ ...prev, [studentId]: { ...prev[studentId], [subject]: value } }));
  };

  const handleSaveMarks = async () => {
    const emptyFields = [];
    for (const student of students) {
      const m = marks[student.id];
      if (!m.math || !m.science || !m.english || !m.social || !m.language) {
        emptyFields.push(`${student.first_name} ${student.last_name}`);
      }
    }
    if (emptyFields.length > 0) { alert(`Please fill all subject scores for: ${emptyFields.join(', ')}`); return; }
    setSaving(true);
    try {
      const promises = students.map(student => {
        const m = marks[student.id];
        return api.post('/marks/entry', {
          student_id: student.id, grade, section, semester, exam_type: examType,
          math_score: parseFloat(m.math), science_score: parseFloat(m.science),
          english_score: parseFloat(m.english), social_score: parseFloat(m.social),
          language_score: parseFloat(m.language)
        });
      });
      await Promise.all(promises);
      alert('Marks saved successfully!');
      setIsPosted(true); setIsEditing(false);
      fetchStudentsAndMarks();
    } catch (error) {
      alert('Failed to save marks: ' + (error.response?.data?.message || error.response?.data?.error || error.message));
    } finally { setSaving(false); }
  };

  const subjects = ['math', 'science', 'english', 'social', 'language'];
  const subjectLabels = { math: 'Math', science: 'Science', english: 'English', social: 'Social', language: 'Language' };

  return (
    <div className="space-y-5">
      {/* Filter Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StyledSelect label="Grade" value={grade} onChange={e => setGrade(Number(e.target.value))}>
          {[6,7,8,9,10].map(g => <option key={g} value={g} style={{background:'#1e1b4b'}}>{g}</option>)}
        </StyledSelect>
        <StyledSelect label="Section" value={section} onChange={e => setSection(e.target.value)}>
          {['A','B','C','D'].map(s => <option key={s} value={s} style={{background:'#1e1b4b'}}>{s}</option>)}
        </StyledSelect>
        <StyledSelect label="Semester" value={semester} onChange={e => setSemester(e.target.value)}>
          <option style={{background:'#1e1b4b'}}>Semester 1</option>
          <option style={{background:'#1e1b4b'}}>Semester 2</option>
        </StyledSelect>
        <StyledSelect label="Exam Type" value={examType} onChange={e => setExamType(e.target.value)}>
          {['Unit Test 1','Unit Test 2','Mid Term','Final Exam','Assignment','Other'].map(t => (
            <option key={t} style={{background:'#1e1b4b'}}>{t}</option>
          ))}
        </StyledSelect>
      </div>

      {/* Action Row */}
      <div className="flex items-center gap-3">
        {isPosted && !isEditing ? (
          <button onClick={() => setIsEditing(true)}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{ background: 'rgba(249,115,22,0.2)', border: '1px solid rgba(249,115,22,0.4)', color: '#fdba74' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(249,115,22,0.35)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(249,115,22,0.2)'}>
            ✏️ Edit Marks
          </button>
        ) : (
          <button onClick={handleSaveMarks} disabled={saving || students.length === 0}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50"
            style={{ background: saving ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            {saving ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
                Saving...
              </span>
            ) : isPosted ? '🔄 Update Marks' : '💾 Save All Marks'}
          </button>
        )}
      </div>

      {isPosted && !isEditing && (
        <PostedBanner
          title="Marks Posted"
          subtitle={`Grade ${grade}-${section} · ${semester} · ${examType}`}
        />
      )}

      {loading ? <Spinner text="Loading students..." /> : students.length === 0 ? (
        <EmptyState icon="🎒" message="No students found for this class" />
      ) : (
        <div className="overflow-x-auto rounded-2xl" style={{ border: '1px solid rgba(99,102,241,0.15)' }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.08)' }}>
                {['Student ID', 'Name', ...subjects.map(s => subjectLabels[s])].map(h => (
                  <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color: 'rgba(165,180,252,0.7)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student.id}
                  style={{ borderBottom: '1px solid rgba(99,102,241,0.08)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td className="px-4 py-3.5">
                    <span className="text-xs font-mono px-2 py-1 rounded-lg"
                      style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
                      {student.student_id}
                    </span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                        style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                        {student.first_name?.[0]}{student.last_name?.[0]}
                      </div>
                      <span className="text-sm font-semibold text-white whitespace-nowrap">{student.first_name} {student.last_name}</span>
                    </div>
                  </td>
                  {subjects.map(subject => (
                    <td key={subject} className="px-4 py-3.5">
                      {isPosted && !isEditing ? (
                        <span className="text-sm font-semibold" style={{ color: '#a5b4fc' }}>
                          {marks[student.id]?.[subject] || '—'}
                        </span>
                      ) : (
                        <input
                          type="number" min="0" max="100" step="0.01"
                          value={marks[student.id]?.[subject] || ''}
                          onChange={e => handleMarkChange(student.id, subject, e.target.value)}
                          placeholder="0-100"
                          className="w-20 px-2 py-1.5 rounded-lg text-sm outline-none transition-all duration-200"
                          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#fff' }}
                          onFocus={e => e.target.style.borderColor = '#6366f1'}
                          onBlur={e => e.target.style.borderColor = 'rgba(99,102,241,0.25)'}
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// ============================================
// BEHAVIOUR TAB
// ============================================
const BehaviourTab = () => {
  const [incidents, setIncidents]       = useState([]);
  const [showForm, setShowForm]         = useState(false);
  const [loading, setLoading]           = useState(false);
  const [students, setStudents]         = useState([]);
  const [selectedGrade, setSelectedGrade]     = useState(6);
  const [selectedSection, setSelectedSection] = useState('A');
  const [formData, setFormData] = useState({
    student_id: '',
    incident_date: new Date().toISOString().split('T')[0],
    incident_type: 'Disruption',
    severity: 'Minor',
    description: '',
    location: '',
    action_taken: ''
  });

  useEffect(() => { fetchIncidents(); }, []);
  useEffect(() => { if (showForm) fetchStudents(); }, [showForm, selectedGrade, selectedSection]);

  const fetchStudents = async () => {
    try {
      const response = await api.get(`/students?grade=${selectedGrade}&section=${selectedSection}`);
      setStudents(response.data.students || response.data || []);
    } catch { setStudents([]); }
  };

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/incidents?limit=50');
      const data = response.data;
      setIncidents(
        data.status === 'success'
          ? (data.data?.incidents || [])
          : (response.data.incidents || response.data || [])
      );
    } catch { setIncidents([]); }
    finally { setLoading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.student_id) { alert('Please select a student'); return; }
    try {
      await api.post('/incidents/log', formData);
      alert('Incident logged successfully!');
      setShowForm(false);
      setFormData({
        student_id: '', incident_date: new Date().toISOString().split('T')[0],
        incident_type: 'Disruption', severity: 'Minor', description: '', location: '', action_taken: ''
      });
      fetchIncidents();
    } catch (error) {
      alert('Failed to log incident: ' + (error.response?.data?.error || error.message));
    }
  };

  const severityConfig = {
    Critical: { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.4)',  color: '#fca5a5' },
    Serious:  { bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.4)', color: '#fdba74' },
    Moderate: { bg: 'rgba(234,179,8,0.15)',  border: 'rgba(234,179,8,0.4)',  color: '#fde047' },
    Minor:    { bg: 'rgba(99,102,241,0.15)', border: 'rgba(99,102,241,0.4)', color: '#a5b4fc' },
  };

  const textareaStyle = {
    width: '100%', padding: '0.6rem 1rem', borderRadius: '0.75rem',
    fontSize: '0.875rem', outline: 'none', resize: 'vertical',
    ...inputStyle,
  };

  return (
    <div className="space-y-5">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white">Behavioral Incidents</h2>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(165,180,252,0.5)' }}>
            {incidents.length} incident{incidents.length !== 1 ? 's' : ''} recorded
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
          style={showForm
            ? { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }
            : { background: 'linear-gradient(135deg, #6366f1, #8b5cf6)', color: '#fff' }}
          onMouseEnter={e => { if (!showForm) e.currentTarget.style.opacity = '0.85'; }}
          onMouseLeave={e => { e.currentTarget.style.opacity = '1'; }}>
          {showForm ? '✕ Cancel' : '+ Log Incident'}
        </button>
      </div>

      {/* Incident Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 p-5 rounded-2xl"
          style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.2)' }}>
          <h3 className="text-sm font-bold text-white mb-1">Log Behavioral Incident</h3>

          {/* Student Selection */}
          <div className="p-4 rounded-xl space-y-3" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(165,180,252,0.6)' }}>Select Student</p>
            <div className="grid grid-cols-3 gap-3">
              <StyledSelect label="Grade" value={selectedGrade}
                onChange={e => { setSelectedGrade(Number(e.target.value)); setFormData({...formData, student_id: ''}); }}>
                {[6,7,8,9,10].map(g => <option key={g} value={g} style={{background:'#1e1b4b'}}>{g}</option>)}
              </StyledSelect>
              <StyledSelect label="Section" value={selectedSection}
                onChange={e => { setSelectedSection(e.target.value); setFormData({...formData, student_id: ''}); }}>
                {['A','B','C','D'].map(s => <option key={s} value={s} style={{background:'#1e1b4b'}}>{s}</option>)}
              </StyledSelect>
              <StyledSelect label="Student *" value={formData.student_id}
                onChange={e => setFormData({...formData, student_id: e.target.value})}>
                <option value="" style={{background:'#1e1b4b'}}>Select Student</option>
                {students.map(student => (
                  <option key={student.id} value={student.id} style={{background:'#1e1b4b'}}>
                    {student.student_id} – {student.first_name} {student.last_name}
                  </option>
                ))}
              </StyledSelect>
            </div>
          </div>

          {/* Incident Details */}
          <div className="grid grid-cols-2 gap-3">
            <StyledInput label="Date *" type="date" value={formData.incident_date}
              onChange={e => setFormData({...formData, incident_date: e.target.value})} />
            <StyledSelect label="Incident Type *" value={formData.incident_type}
              onChange={e => setFormData({...formData, incident_type: e.target.value})}>
              {['Disruption','Fighting','Bullying','Vandalism','Disrespect','Other'].map(t => (
                <option key={t} style={{background:'#1e1b4b'}}>{t}</option>
              ))}
            </StyledSelect>
            <StyledSelect label="Severity *" value={formData.severity}
              onChange={e => setFormData({...formData, severity: e.target.value})}>
              {['Minor','Moderate','Serious','Critical'].map(t => (
                <option key={t} style={{background:'#1e1b4b'}}>{t}</option>
              ))}
            </StyledSelect>
            <StyledInput label="Location" value={formData.location}
              onChange={e => setFormData({...formData, location: e.target.value})}
              placeholder="e.g., Classroom, Playground" />
          </div>

          <div>
            <label style={labelStyle}>Description *</label>
            <textarea rows={3} required value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              placeholder="Describe the incident in detail..."
              style={textareaStyle}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = 'rgba(99,102,241,0.3)'}
            />
          </div>

          <div>
            <label style={labelStyle}>Action Taken</label>
            <textarea rows={2} value={formData.action_taken}
              onChange={e => setFormData({...formData, action_taken: e.target.value})}
              placeholder="What action was taken? (optional)"
              style={textareaStyle}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = 'rgba(99,102,241,0.3)'}
            />
          </div>

          <button type="submit"
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
            📋 Log Incident
          </button>
        </form>
      )}

      {/* Incidents List */}
      {loading ? <Spinner text="Loading incidents..." /> : incidents.length === 0 ? (
        <EmptyState icon="✅" message="No incidents recorded" />
      ) : (
        <div className="space-y-3">
          {incidents.map(incident => {
            const sc = severityConfig[incident.severity] || severityConfig.Minor;
            return (
              <div key={incident.id} className="p-4 rounded-2xl transition-all duration-200"
                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(99,102,241,0.15)' }}
                onMouseEnter={e => e.currentTarget.style.border = '1px solid rgba(99,102,241,0.3)'}
                onMouseLeave={e => e.currentTarget.style.border = '1px solid rgba(99,102,241,0.15)'}>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-semibold text-sm text-white">{incident.incident_type}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.color }}>
                        {incident.severity}
                      </span>
                    </div>
                    <p className="text-xs mb-2" style={{ color: 'rgba(165,180,252,0.7)' }}>{incident.description}</p>
                    {incident.location && (
                      <p className="text-xs" style={{ color: 'rgba(165,180,252,0.45)' }}>📍 {incident.location}</p>
                    )}
                    {incident.action_taken && (
                      <p className="text-xs mt-1" style={{ color: 'rgba(134,239,172,0.6)' }}>✅ {incident.action_taken}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-medium" style={{ color: 'rgba(165,180,252,0.6)' }}>
                      {new Date(incident.incident_date).toLocaleDateString()}
                    </p>
                    <p className="text-xs mt-0.5 font-mono" style={{ color: 'rgba(165,180,252,0.35)' }}>
                      ID: {incident.student_id}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Academics;
