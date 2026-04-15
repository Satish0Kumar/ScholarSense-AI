import { useState, useEffect } from 'react';
import api from '../utils/api';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Alerts = () => {
  const [activeTab, setActiveTab] = useState('academic');

  const tabs = [
    { id: 'academic',    label: 'Academic Performance Alerts' },
    { id: 'attendance',  label: 'Attendance Alerts' },
  ];

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Alert Management</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(165,180,252,0.6)' }}>
            Academic &amp; attendance alerts for at-risk students
          </p>
        </div>
      </div>

      {/* ── Tab Switcher ── */}
      <div className="flex gap-1 p-1 rounded-2xl" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.2)', backdropFilter: 'blur(12px)' }}>
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            style={activeTab === tab.id
              ? { background: 'linear-gradient(135deg, rgba(99,102,241,0.5), rgba(139,92,246,0.4))', color: '#fff', border: '1px solid rgba(99,102,241,0.5)' }
              : { color: 'rgba(165,180,252,0.6)', border: '1px solid transparent' }
            }>
            <span>{tab.id === 'academic' ? '📊' : '📅'}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── Tab Body ── */}
      <div className="rounded-2xl p-6" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.2)', backdropFilter: 'blur(12px)' }}>
        {activeTab === 'academic'   && <AcademicAlertsTab />}
        {activeTab === 'attendance' && <AttendanceAlertsTab />}
      </div>
    </div>
  );
};

// ============================================
// ACADEMIC PERFORMANCE ALERTS TAB
// ============================================
const AcademicAlertsTab = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedStudents, setSelectedStudents] = useState([]);

  useEffect(() => {
    fetchHighRiskStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, selectedGrade, selectedSection]);

  const fetchHighRiskStudents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/predictions/high-risk');
      const highRiskData = response.data.students || response.data || [];
      setStudents(highRiskData);
    } catch (error) {
      console.error('Failed to fetch high-risk students:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;
    
    if (selectedGrade) {
      filtered = filtered.filter(s => s.student?.grade === parseInt(selectedGrade));
    }
    
    if (selectedSection) {
      filtered = filtered.filter(s => s.student?.section === selectedSection);
    }
    
    setFilteredStudents(filtered);
  };

  const handlePreviewPDF = async (studentId) => {
    try {
      const response = await api.get(`/alerts/academic-alert/preview/${studentId}`, {
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      alert('Failed to preview PDF: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleSendAlert = async (studentId, studentName) => {
    if (!confirm(`Send Academic Performance Alert PDF to parent of ${studentName}?`)) return;
    setSending(true);
    try {
      const response = await api.post(`/alerts/academic-alert/send/${studentId}`);
      alert(`✅ Alert sent successfully to ${response.data.parent_email}`);
      setSelectedStudent(null);
    } catch (error) {
      alert('Failed to send alert: ' + (error.response?.data?.error || error.message));
    } finally {
      setSending(false);
    }
  };

  const handleSendBatchAlerts = async () => {
    if (selectedStudents.length === 0) {
      alert('Please select at least one student.');
      return;
    }
    if (!confirm(`Send Academic Performance Alert PDFs to parents of ${selectedStudents.length} selected student(s)?`)) return;
    setSending(true);
    let sent = 0, failed = 0;
    for (const id of selectedStudents) {
      try {
        await api.post(`/alerts/academic-alert/send/${id}`);
        sent++;
      } catch {
        failed++;
      }
    }
    alert(`✅ Batch complete: ${sent} sent, ${failed} failed.`);
    setSelectedStudents([]);
    setSending(false);
  };

  const toggleSelect = (id) => {
    setSelectedStudents(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(item => item.student?.id).filter(Boolean));
    }
  };

  const getRiskStyle = (risk) => {
    const map = {
      Critical: { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.4)',  color: '#fca5a5' },
      High:     { bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.4)', color: '#fdba74' },
      Medium:   { bg: 'rgba(234,179,8,0.15)',  border: 'rgba(234,179,8,0.4)',  color: '#fde047' },
      Low:      { bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.4)',  color: '#86efac' },
    };
    return map[risk] || { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.3)', color: '#a5b4fc' };
  };

  const getRiskColor = (riskLabel) => {
    switch(riskLabel?.toLowerCase()) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getRiskIcon = (riskLabel) => {
    switch(riskLabel?.toLowerCase()) {
      case 'critical': return '🔴';
      case 'high': return '🟠';
      case 'medium': return '🟡';
      case 'low': return '🟢';
      default: return '⚪';
    }
  };

  const grades = [6, 7, 8, 9, 10];
  const sections = ['A', 'B', 'C', 'D'];

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="flex items-center gap-4 p-4 rounded-2xl"
        style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)' }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: 'rgba(249,115,22,0.15)' }}>📊</div>
        <div>
          <p className="font-semibold text-sm text-white">Academic Performance Alert System</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(165,180,252,0.6)' }}>
            Send comprehensive PDF reports to parents of high-risk students including progress report,
            risk factors analysis, and detailed improvement suggestions.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 p-4 rounded-2xl"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.2)' }}>
        <select
          value={selectedGrade}
          onChange={(e) => setSelectedGrade(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc' }}
        >
          <option value="" style={{ background: '#1e1b4b' }}>All Grades</option>
          {grades.map(g => <option key={g} value={g} style={{ background: '#1e1b4b' }}>Grade {g}</option>)}
        </select>
        <select
          value={selectedSection}
          onChange={(e) => setSelectedSection(e.target.value)}
          className="px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
          style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc' }}
        >
          <option value="" style={{ background: '#1e1b4b' }}>All Sections</option>
          {sections.map(s => <option key={s} value={s} style={{ background: '#1e1b4b' }}>Section {s}</option>)}
        </select>
        {(selectedGrade || selectedSection) && (
          <button
            onClick={() => { setSelectedGrade(''); setSelectedSection(''); }}
            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total High-Risk', value: students.length, icon: '⚠️', bg: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(99,102,241,0.1))', border: 'rgba(99,102,241,0.4)' },
          { label: 'Critical Risk',   value: students.filter(s => s.prediction?.risk_label?.toLowerCase() === 'critical').length, icon: '🔴', bg: 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(239,68,68,0.1))', border: 'rgba(239,68,68,0.4)' },
          { label: 'High Risk',       value: students.filter(s => s.prediction?.risk_label?.toLowerCase() === 'high').length,     icon: '🟠', bg: 'linear-gradient(135deg, rgba(249,115,22,0.3), rgba(249,115,22,0.1))', border: 'rgba(249,115,22,0.4)' },
        ].map(card => (
          <div key={card.label} className="rounded-2xl p-5 flex items-center gap-4 transition-all duration-200 hover:-translate-y-1"
            style={{ background: card.bg, border: `1px solid ${card.border}` }}>
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ background: 'rgba(0,0,0,0.2)' }}>{card.icon}</div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.6)' }}>{card.label}</p>
              <p className="text-3xl font-bold text-white mt-0.5">{card.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Student List */}
      <div>
      {/* List Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-base font-bold text-white">High-Risk Students</h3>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-xl"
            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}>
            {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
          </span>
        </div>
        <button
          onClick={fetchHighRiskStudents}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
          style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.3)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.15)'}
        >
          🔄 Refresh
        </button>
      </div>

        {/* Batch Select Bar */}
        {filteredStudents.length > 0 && (
          <div className="flex justify-between items-center p-3 rounded-2xl"
            style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 accent-indigo-500"
              />
              <span className="text-sm font-medium" style={{ color: '#a5b4fc' }}>
                Select All
              </span>
              <span className="text-xs px-2 py-0.5 rounded-lg"
                style={{ background: 'rgba(99,102,241,0.15)', color: 'rgba(165,180,252,0.7)' }}>
                {selectedStudents.length} of {filteredStudents.length}
              </span>
            </label>
            <button
              onClick={handleSendBatchAlerts}
              disabled={sending || selectedStudents.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-40"
              style={{ background: selectedStudents.length === 0 ? 'rgba(249,115,22,0.1)' : 'linear-gradient(135deg, rgba(249,115,22,0.6), rgba(239,68,68,0.5))', border: '1px solid rgba(249,115,22,0.4)', color: selectedStudents.length === 0 ? '#fdba74' : '#fff' }}
              onMouseEnter={e => { if (selectedStudents.length > 0) e.currentTarget.style.opacity = '0.85'; }}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              {sending
                ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Sending...</>
                : `📧 Send Alerts to ${selectedStudents.length} Selected`
              }
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16 gap-3">
            <svg className="animate-spin w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
            </svg>
            <p className="text-indigo-300 text-sm">Loading students...</p>
          </div>
        ) : filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 gap-3">
            <span className="text-4xl">{students.length === 0 ? '✅' : '🔍'}</span>
            <p className="text-sm" style={{ color: 'rgba(165,180,252,0.5)' }}>
              {students.length === 0 ? 'No high-risk students found' : 'No students match the selected filters'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredStudents.map((item) => {
              const student = item.student || {};
              const prediction = item.prediction || {};
              const riskLabel = prediction.risk_label || 'Unknown';
              const rs = getRiskStyle(riskLabel);
              return (
                <div key={student.id}
                  className="p-4 rounded-2xl transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(99,102,241,0.15)' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.15)'}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => toggleSelect(student.id)}
                      className="mt-1 w-4 h-4 accent-indigo-500 flex-shrink-0 cursor-pointer"
                    />
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                      {student.first_name?.[0]}{student.last_name?.[0]}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-sm font-bold text-white">{student.first_name} {student.last_name}</span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded-lg"
                          style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
                          {student.student_id}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                          style={{ background: rs.bg, border: `1px solid ${rs.border}`, color: rs.color }}>
                          {riskLabel}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1">
                        {[
                          { label: 'Grade', value: `${student.grade} — Section ${student.section}` },
                          { label: 'Parent', value: student.parent_name || 'N/A' },
                          { label: 'Email', value: student.parent_email || 'N/A' },
                          { label: 'Confidence', value: prediction.confidence_score ? `${prediction.confidence_score.toFixed(1)}%` : 'N/A' },
                          { label: 'Assessed', value: prediction.created_at ? new Date(prediction.created_at).toLocaleDateString() : 'N/A' },
                        ].map(f => (
                          <p key={f.label} className="text-xs">
                            <span style={{ color: 'rgba(165,180,252,0.5)' }}>{f.label}: </span>
                            <span style={{ color: 'rgba(165,180,252,0.85)' }}>{f.value}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <button
                        onClick={() => handlePreviewPDF(student.id)}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200"
                        style={{ background: 'rgba(139,92,246,0.2)', border: '1px solid rgba(139,92,246,0.4)', color: '#c4b5fd' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.4)'; e.currentTarget.style.color = '#fff'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(139,92,246,0.2)'; e.currentTarget.style.color = '#c4b5fd'; }}
                      >
                        👁️ Preview PDF
                      </button>
                      <button
                        onClick={() => handleSendAlert(student.id, `${student.first_name} ${student.last_name}`)}
                        disabled={sending || !student.parent_email}
                        className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 disabled:opacity-40"
                        style={{ background: 'rgba(249,115,22,0.2)', border: '1px solid rgba(249,115,22,0.4)', color: '#fdba74' }}
                        onMouseEnter={e => { if (!sending && student.parent_email) { e.currentTarget.style.background = 'rgba(249,115,22,0.4)'; e.currentTarget.style.color = '#fff'; }}}
                        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(249,115,22,0.2)'; e.currentTarget.style.color = '#fdba74'; }}
                      >
                        📧 Send Alert
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================
// ATTENDANCE ALERTS TAB
// ============================================
const AttendanceAlertsTab = () => {
  const [threshold, setThreshold] = useState(75);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedStudents, setSelectedStudents] = useState([]);

  const checkThreshold = async () => {
    setLoading(true);
    try {
      const response = await api.post('/alerts/attendance-alert/check', {
        threshold: parseFloat(threshold),
        grade: selectedGrade ? parseInt(selectedGrade) : null,
        section: selectedSection || null
      });
      setStudents(response.data.students || []);
    } catch (error) {
      alert('Failed to check attendance: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSendSingle = async (student) => {
    if (!confirm(`Send attendance alert to ${student.parent_name || 'parent'} of ${student.name}?`)) {
      return;
    }

    setSending(true);
    try {
      await api.post('/alerts/attendance-alert/send-single', {
        student_id: student.id,
        threshold: parseFloat(threshold)
      });
      alert(`✅ Alert sent successfully to ${student.parent_email}`);
    } catch (error) {
      alert('Failed to send alert: ' + (error.response?.data?.error || error.message));
    } finally {
      setSending(false);
    }
  };

  const handleSendBulk = async () => {
    const count = selectedStudents.length > 0 ? selectedStudents.length : students.length;
    if (!confirm(`Send attendance alerts to ${count} students' parents?`)) {
      return;
    }

    setSending(true);
    try {
      const response = await api.post('/alerts/attendance-alert/send-bulk', {
        threshold: parseFloat(threshold),
        grade: selectedGrade ? parseInt(selectedGrade) : null,
        section: selectedSection || null
      });
      alert(`✅ Sent ${response.data.sent} alerts successfully. ${response.data.failed} failed.`);
      setSelectedStudents([]);
    } catch (error) {
      alert('Failed to send bulk alerts: ' + (error.response?.data?.error || error.message));
    } finally {
      setSending(false);
    }
  };

  const toggleStudentSelection = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedStudents.length === students.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(students.map(s => s.id));
    }
  };

  const getAttendanceColor = (rate) => {
    if (rate >= 75) return 'text-green-700';
    if (rate >= 60) return 'text-orange-700';
    return 'text-red-700';
  };

  const grades = [6, 7, 8, 9, 10];
  const sections = ['A', 'B', 'C', 'D'];

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <div className="flex items-center gap-4 p-4 rounded-2xl"
        style={{ background: 'rgba(234,179,8,0.08)', border: '1px solid rgba(234,179,8,0.25)' }}>
        <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: 'rgba(234,179,8,0.15)' }}>📅</div>
        <div>
          <p className="font-semibold text-sm text-white">Attendance Threshold Alert System</p>
          <p className="text-xs mt-0.5" style={{ color: 'rgba(165,180,252,0.6)' }}>
            Set attendance threshold and send email alerts to parents of students below that threshold.
            Alerts include detailed attendance report in simple text/table format.
          </p>
        </div>
      </div>

      {/* Threshold & Filters */}
      <div className="p-4 rounded-2xl space-y-3"
        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.2)' }}>
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(165,180,252,0.6)' }}>Configure Threshold &amp; Filters</p>
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(165,180,252,0.7)' }}>Threshold (%)</label>
            <input
              type="number" min="0" max="100" step="1"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-32 px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#fff' }}
              onFocus={e => e.target.style.borderColor = '#6366f1'}
              onBlur={e => e.target.style.borderColor = 'rgba(99,102,241,0.3)'}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(165,180,252,0.7)' }}>Grade</label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc' }}
            >
              <option value="" style={{ background: '#1e1b4b' }}>All Grades</option>
              {grades.map(g => <option key={g} value={g} style={{ background: '#1e1b4b' }}>Grade {g}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'rgba(165,180,252,0.7)' }}>Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc' }}
            >
              <option value="" style={{ background: '#1e1b4b' }}>All Sections</option>
              {sections.map(s => <option key={s} value={s} style={{ background: '#1e1b4b' }}>Section {s}</option>)}
            </select>
          </div>
          <button
            onClick={checkThreshold}
            disabled={loading}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50"
            style={{ background: loading ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          >
            {loading
              ? <span className="flex items-center gap-2"><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg>Checking...</span>
              : '🔍 Check Threshold'
            }
          </button>
        </div>
      </div>

      {/* Results */}
      {students.length > 0 && (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Below Threshold', value: students.length,                                                                          icon: '📉', bg: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(99,102,241,0.1))',  border: 'rgba(99,102,241,0.4)'  },
              { label: 'Below 60%',       value: students.filter(s => s.attendance_rate < 60).length,                                      icon: '🔴', bg: 'linear-gradient(135deg, rgba(239,68,68,0.3), rgba(239,68,68,0.1))',    border: 'rgba(239,68,68,0.4)'   },
              { label: '60% – 75%',       value: students.filter(s => s.attendance_rate >= 60 && s.attendance_rate < 75).length,           icon: '🟠', bg: 'linear-gradient(135deg, rgba(249,115,22,0.3), rgba(249,115,22,0.1))',  border: 'rgba(249,115,22,0.4)'  },
              { label: 'Selected',        value: selectedStudents.length,                                                                   icon: '✅', bg: 'linear-gradient(135deg, rgba(34,197,94,0.3), rgba(34,197,94,0.1))',    border: 'rgba(34,197,94,0.4)'   },
            ].map(card => (
              <div key={card.label} className="rounded-2xl p-5 flex items-center gap-4 transition-all duration-200 hover:-translate-y-1"
                style={{ background: card.bg, border: `1px solid ${card.border}` }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                  style={{ background: 'rgba(0,0,0,0.2)' }}>{card.icon}</div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.6)' }}>{card.label}</p>
                  <p className="text-3xl font-bold text-white mt-0.5">{card.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Bulk Actions Bar */}
          <div className="flex justify-between items-center p-3 rounded-2xl"
            style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedStudents.length === students.length && students.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4 accent-indigo-500"
              />
              <span className="text-sm font-medium" style={{ color: '#a5b4fc' }}>Select All</span>
              <span className="text-xs px-2 py-0.5 rounded-lg"
                style={{ background: 'rgba(99,102,241,0.15)', color: 'rgba(165,180,252,0.7)' }}>
                {selectedStudents.length} of {students.length}
              </span>
            </label>
            <button
              onClick={handleSendBulk}
              disabled={sending || students.length === 0}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-40"
              style={{ background: selectedStudents.length === 0 ? 'rgba(234,179,8,0.1)' : 'linear-gradient(135deg, rgba(234,179,8,0.6), rgba(249,115,22,0.5))', border: '1px solid rgba(234,179,8,0.4)', color: selectedStudents.length === 0 ? '#fde047' : '#fff' }}
              onMouseEnter={e => { if (students.length > 0) e.currentTarget.style.opacity = '0.85'; }}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}
            >
              {sending
                ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/></svg> Sending...</>
                : `📧 Send Alerts to ${selectedStudents.length > 0 ? selectedStudents.length : students.length} Students`
              }
            </button>
          </div>

          {/* Student List */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-base font-bold text-white">Students Below {threshold}% Attendance</h3>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-xl"
                style={{ background: 'rgba(234,179,8,0.15)', border: '1px solid rgba(234,179,8,0.3)', color: '#fde047' }}>
                {students.length} student{students.length !== 1 ? 's' : ''}
              </span>
            </div>
            {students.map((student) => {
              const rate = student.attendance_rate;
              const rateStyle = rate < 60
                ? { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.4)',  color: '#fca5a5' }
                : rate < 75
                ? { bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.4)', color: '#fdba74' }
                : { bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.4)',  color: '#86efac' };
              return (
                <div key={student.id}
                  className="p-4 rounded-2xl transition-all duration-200"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(99,102,241,0.15)' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.35)'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.15)'}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => toggleStudentSelection(student.id)}
                      className="mt-1 w-4 h-4 accent-indigo-500 flex-shrink-0 cursor-pointer"
                    />
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
                      {student.name?.split(' ')[0]?.[0]}{student.name?.split(' ')[1]?.[0]}
                    </div>
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="text-sm font-bold text-white">{student.name}</span>
                        <span className="text-xs font-mono px-2 py-0.5 rounded-lg"
                          style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
                          {student.student_id}
                        </span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-bold"
                          style={{ background: rateStyle.bg, border: `1px solid ${rateStyle.border}`, color: rateStyle.color }}>
                          {rate}%
                        </span>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1">
                        {[
                          { label: 'Grade',       value: `${student.grade} — Section ${student.section}` },
                          { label: 'Parent',      value: student.parent_name || 'N/A' },
                          { label: 'Email',       value: student.parent_email || 'N/A' },
                          { label: 'Total Days',  value: student.total_days },
                          { label: 'Present',     value: student.present_days },
                          { label: 'Absent',      value: student.absent_days },
                        ].map(f => (
                          <p key={f.label} className="text-xs">
                            <span style={{ color: 'rgba(165,180,252,0.5)' }}>{f.label}: </span>
                            <span style={{ color: 'rgba(165,180,252,0.85)' }}>{f.value}</span>
                          </p>
                        ))}
                      </div>
                    </div>
                    {/* Send Button */}
                    <button
                      onClick={() => handleSendSingle(student)}
                      disabled={sending || !student.parent_email}
                      className="px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 disabled:opacity-40 flex-shrink-0"
                      style={{ background: 'rgba(234,179,8,0.2)', border: '1px solid rgba(234,179,8,0.4)', color: '#fde047' }}
                      onMouseEnter={e => { if (!sending && student.parent_email) { e.currentTarget.style.background = 'rgba(234,179,8,0.4)'; e.currentTarget.style.color = '#fff'; }}}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(234,179,8,0.2)'; e.currentTarget.style.color = '#fde047'; }}
                    >
                      📧 Send Alert
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {!loading && students.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl"
            style={{ background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)' }}>✅</div>
          <p className="text-sm font-semibold" style={{ color: '#86efac' }}>All students meeting attendance requirements</p>
          <p className="text-xs" style={{ color: 'rgba(165,180,252,0.45)' }}>No students found below {threshold}% threshold</p>
        </div>
      )}
    </div>
  );
};

// ============================================
// OLD TABS (KEPT FOR REFERENCE)
// ============================================
const NotificationsTab = () => {
  const [notifications, setNotifications] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    fetchStats();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/notifications?limit=100');
      setNotifications(response.data.notifications || response.data || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/notifications/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'high_risk': return 'bg-red-100 text-red-800 border-red-300';
      case 'low_gpa': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'low_attendance': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'failed_subjects': return 'bg-purple-100 text-purple-800 border-purple-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {stats && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Notification Statistics</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border rounded-lg p-4">
                <p className="text-sm text-gray-500">Total Sent</p>
                <p className="text-3xl font-bold">{stats.total_sent || 0}</p>
              </div>
              <div className="bg-green-50 border border-green-300 rounded-lg p-4">
                <p className="text-sm text-gray-600">Successful</p>
                <p className="text-3xl font-bold text-green-700">{stats.successful || 0}</p>
              </div>
              <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-3xl font-bold text-red-700">{stats.failed || 0}</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-3xl font-bold text-yellow-700">{stats.pending || 0}</p>
              </div>
            </div>
            
            {/* Pie Chart */}
            <div className="bg-white border rounded-lg p-4 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Successful', value: stats.successful || 0, color: '#22c55e' },
                      { name: 'Failed', value: stats.failed || 0, color: '#ef4444' },
                      { name: 'Pending', value: stats.pending || 0, color: '#eab308' }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'Successful', value: stats.successful || 0, color: '#22c55e' },
                      { name: 'Failed', value: stats.failed || 0, color: '#ef4444' },
                      { name: 'Pending', value: stats.pending || 0, color: '#eab308' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Recent Notifications</h2>
        <button
          onClick={fetchNotifications}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          🔄 Refresh
        </button>
      </div>

      {loading ? (
        <div className="text-center py-8">Loading notifications...</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No notifications found</div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notif) => (
            <div key={notif.id} className="border rounded-lg p-4 hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getTypeColor(notif.notification_type)}`}>
                      {notif.notification_type?.replace('_', ' ').toUpperCase()}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(notif.status)}`}>
                      {notif.status}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-800 mb-1">{notif.trigger_reason}</p>
                  <p className="text-sm text-gray-600 mb-2">{notif.message}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>📧 {notif.sent_to_email}</span>
                    <span>👤 {notif.sent_to_name}</span>
                    {notif.sent_at && <span>🕒 {new Date(notif.sent_at).toLocaleString()}</span>}
                  </div>
                  {notif.error_message && (
                    <p className="text-xs text-red-600 mt-2">❌ Error: {notif.error_message}</p>
                  )}
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>Student ID: {notif.student_id}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================
// PARENT PORTAL TAB
// ============================================
const ParentPortalTab = () => {
  const [communications, setCommunications] = useState([]);
  const [stats, setStats] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    student_id: '',
    communication_type: 'General Update',
    subject: '',
    message: ''
  });

  useEffect(() => {
    fetchCommunications();
    fetchStats();
  }, []);

  const fetchCommunications = async () => {
    setLoading(true);
    try {
      const response = await api.get('/communications/history?limit=100');
      setCommunications(response.data.communications || response.data || []);
    } catch (error) {
      console.error('Failed to fetch communications:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/communications/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post('/communications/send', formData);
      alert('Communication sent successfully!');
      setShowForm(false);
      setFormData({
        student_id: '',
        communication_type: 'General Update',
        subject: '',
        message: ''
      });
      fetchCommunications();
      fetchStats();
    } catch (error) {
      alert('Failed to send communication: ' + (error.response?.data?.error || error.message));
    } finally {
      setSending(false);
    }
  };

  const getTypeColor = (type) => {
    switch(type) {
      case 'Risk Alert': return 'bg-red-100 text-red-800';
      case 'Academic Update': return 'bg-blue-100 text-blue-800';
      case 'Attendance Alert': return 'bg-yellow-100 text-yellow-800';
      case 'General Update': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'sent': return 'bg-green-100 text-green-800';
      case 'failed': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {stats && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Communication Statistics</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border rounded-lg p-4">
                <p className="text-sm text-gray-500">Total Sent</p>
                <p className="text-3xl font-bold">{stats.total_sent || 0}</p>
              </div>
              <div className="bg-green-50 border border-green-300 rounded-lg p-4">
                <p className="text-sm text-gray-600">Successful</p>
                <p className="text-3xl font-bold text-green-700">{stats.successful || 0}</p>
              </div>
              <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                <p className="text-sm text-gray-600">Failed</p>
                <p className="text-3xl font-bold text-red-700">{stats.failed || 0}</p>
              </div>
              <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
                <p className="text-sm text-gray-600">This Month</p>
                <p className="text-3xl font-bold text-blue-700">{stats.this_month || 0}</p>
              </div>
            </div>
            
            {/* Pie Chart */}
            <div className="bg-white border rounded-lg p-4 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Successful', value: stats.successful || 0, color: '#22c55e' },
                      { name: 'Failed', value: stats.failed || 0, color: '#ef4444' }
                    ]}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {[
                      { name: 'Successful', value: stats.successful || 0, color: '#22c55e' },
                      { name: 'Failed', value: stats.failed || 0, color: '#ef4444' }
                    ].map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Parent Communications</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '✉️ Compose Message'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Student ID</label>
              <input
                type="number"
                required
                value={formData.student_id}
                onChange={(e) => setFormData({...formData, student_id: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Communication Type</label>
              <select
                value={formData.communication_type}
                onChange={(e) => setFormData({...formData, communication_type: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option>General Update</option>
                <option>Academic Update</option>
                <option>Risk Alert</option>
                <option>Attendance Alert</option>
                <option>Behavioral Concern</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <input
              type="text"
              required
              value={formData.subject}
              onChange={(e) => setFormData({...formData, subject: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Email subject line"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
            <textarea
              required
              rows={6}
              value={formData.message}
              onChange={(e) => setFormData({...formData, message: e.target.value})}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Compose your message to the parent..."
            />
          </div>
          <button
            type="submit"
            disabled={sending}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {sending ? 'Sending...' : 'Send Communication'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8">Loading communications...</div>
      ) : communications.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No communications found</div>
      ) : (
        <div className="space-y-3">
          {communications.map((comm) => (
            <div key={comm.id} className="border rounded-lg p-4 hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getTypeColor(comm.communication_type)}`}>
                      {comm.communication_type}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getStatusColor(comm.status)}`}>
                      {comm.status}
                    </span>
                    {comm.risk_label && (
                      <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-100 text-purple-800">
                        Risk: {comm.risk_label}
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-gray-800 mb-1">{comm.subject}</p>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">{comm.message_body}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span>📧 {comm.parent_email}</span>
                    <span>👤 {comm.parent_name}</span>
                    {comm.sent_at && <span>🕒 {new Date(comm.sent_at).toLocaleString()}</span>}
                  </div>
                  {comm.template_used && (
                    <p className="text-xs text-gray-500 mt-1">📄 Template: {comm.template_used}</p>
                  )}
                  {comm.error_message && (
                    <p className="text-xs text-red-600 mt-2">❌ Error: {comm.error_message}</p>
                  )}
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>Student ID: {comm.student_id}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Alerts;
