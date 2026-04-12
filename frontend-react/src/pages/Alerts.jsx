import { useState, useEffect } from 'react';
import api from '../utils/api';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Alerts = () => {
  const [activeTab, setActiveTab] = useState('academic');

  const tabs = [
    { id: 'academic', label: '📊 Academic Performance Alerts' },
    { id: 'attendance', label: '📅 Attendance Alerts' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Alert Management System</h1>
      <div className="bg-white rounded-lg shadow">
        <div className="border-b">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-6 py-3 font-medium ${
                  activeTab === tab.id
                    ? 'border-b-2 border-blue-600 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
        <div className="p-6">
          {activeTab === 'academic' && <AcademicAlertsTab />}
          {activeTab === 'attendance' && <AttendanceAlertsTab />}
        </div>
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
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-50 to-red-50 border border-orange-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-3xl">📊</div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              Academic Performance Alert System
            </h3>
            <p className="text-sm text-gray-600">
              Send comprehensive PDF reports to parents of high-risk students including progress report, 
              risk factors analysis, and detailed improvement suggestions.
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-700 mb-3">Filter Students</h3>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Grades</option>
              {grades.map(g => (
                <option key={g} value={g}>Grade {g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Sections</option>
              {sections.map(s => (
                <option key={s} value={s}>Section {s}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => {
                setSelectedGrade('');
                setSelectedSection('');
              }}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Total High-Risk Students</p>
          <p className="text-3xl font-bold text-gray-800">{students.length}</p>
        </div>
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">Critical Risk</p>
          <p className="text-3xl font-bold text-red-700">
            {students.filter(s => s.prediction?.risk_label?.toLowerCase() === 'critical').length}
          </p>
        </div>
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <p className="text-sm text-gray-600">High Risk</p>
          <p className="text-3xl font-bold text-orange-700">
            {students.filter(s => s.prediction?.risk_label?.toLowerCase() === 'high').length}
          </p>
        </div>
      </div>

      {/* Student List */}
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">High-Risk Students ({filteredStudents.length})</h3>
          <div className="flex gap-2">
            <button
              onClick={fetchHighRiskStudents}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Batch Select Bar */}
        {filteredStudents.length > 0 && (
          <div className="bg-gray-50 border rounded-lg p-3 mb-4 flex justify-between items-center">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                onChange={toggleSelectAll}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium text-gray-700">
                Select All &nbsp;·&nbsp; {selectedStudents.length} of {filteredStudents.length} selected
              </span>
            </label>
            <button
              onClick={handleSendBatchAlerts}
              disabled={sending || selectedStudents.length === 0}
              className="px-5 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm font-medium"
            >
              {sending ? 'Sending...' : `📧 Send Alerts to ${selectedStudents.length} Selected`}
            </button>
          </div>
        )}

        {loading ? (
          <div className="text-center py-8">Loading students...</div>
        ) : filteredStudents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {students.length === 0 ? 'No high-risk students found' : 'No students match the selected filters'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredStudents.map((item) => {
              const student = item.student || {};
              const prediction = item.prediction || {};
              const riskLabel = prediction.risk_label || 'Unknown';
              
              return (
                <div key={student.id} className="border rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start">
                    <div className="flex items-start gap-3 flex-1">
                      <input
                        type="checkbox"
                        checked={selectedStudents.includes(student.id)}
                        onChange={() => toggleSelect(student.id)}
                        className="mt-1 w-4 h-4 cursor-pointer"
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="text-lg font-semibold text-gray-800">
                            {student.first_name} {student.last_name}
                          </h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRiskColor(riskLabel)}`}>
                            {getRiskIcon(riskLabel)} {riskLabel}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm text-gray-600">
                          <p><span className="font-medium">Grade:</span> {student.grade} - Section {student.section}</p>
                          <p><span className="font-medium">Student ID:</span> {student.student_id}</p>
                          <p><span className="font-medium">Parent:</span> {student.parent_name || 'N/A'}</p>
                          <p><span className="font-medium">Email:</span> {student.parent_email || 'N/A'}</p>
                          <p><span className="font-medium">Confidence:</span> {prediction.confidence_score?.toFixed(1)}%</p>
                          <p><span className="font-medium">Assessment Date:</span> {prediction.created_at ? new Date(prediction.created_at).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => handlePreviewPDF(student.id)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                      >
                        👁️ Preview PDF
                      </button>
                      <button
                        onClick={() => handleSendAlert(student.id, `${student.first_name} ${student.last_name}`)}
                        disabled={sending || !student.parent_email}
                        className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm"
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
      {/* Header */}
      <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="text-3xl">📅</div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              Attendance Threshold Alert System
            </h3>
            <p className="text-sm text-gray-600">
              Set attendance threshold and send email alerts to parents of students below that threshold. 
              Alerts include detailed attendance report in simple text/table format.
            </p>
          </div>
        </div>
      </div>

      {/* Threshold Settings */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">⚙️ Configure Threshold & Filters</h3>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Attendance Threshold (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              step="1"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Grade (Optional)</label>
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Grades</option>
              {grades.map(g => (
                <option key={g} value={g}>Grade {g}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Section (Optional)</label>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Sections</option>
              {sections.map(s => (
                <option key={s} value={s}>Section {s}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={checkThreshold}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Checking...' : '🔍 Check Threshold'}
            </button>
          </div>
        </div>
      </div>

      {/* Results */}
      {students.length > 0 && (
        <>
          {/* Statistics */}
          <div className="grid grid-cols-4 gap-4">
            <div className="bg-white border rounded-lg p-4">
              <p className="text-sm text-gray-500">Students Below Threshold</p>
              <p className="text-3xl font-bold text-gray-800">{students.length}</p>
            </div>
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">Below 60%</p>
              <p className="text-3xl font-bold text-red-700">
                {students.filter(s => s.attendance_rate < 60).length}
              </p>
            </div>
            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">60% - 75%</p>
              <p className="text-3xl font-bold text-orange-700">
                {students.filter(s => s.attendance_rate >= 60 && s.attendance_rate < 75).length}
              </p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-600">Selected</p>
              <p className="text-3xl font-bold text-blue-700">{selectedStudents.length}</p>
            </div>
          </div>

          {/* Bulk Actions */}
          <div className="bg-gray-50 border rounded-lg p-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStudents.length === students.length}
                    onChange={toggleSelectAll}
                    className="w-4 h-4"
                  />
                  <span className="text-sm font-medium text-gray-700">Select All</span>
                </label>
                <span className="text-sm text-gray-600">
                  {selectedStudents.length} of {students.length} selected
                </span>
              </div>
              <button
                onClick={handleSendBulk}
                disabled={sending || students.length === 0}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
              >
                {sending ? 'Sending...' : `📧 Send Alerts to ${selectedStudents.length > 0 ? selectedStudents.length : students.length} Students`}
              </button>
            </div>
          </div>

          {/* Student List */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Students Below {threshold}% Attendance</h3>
            <div className="space-y-3">
              {students.map((student) => (
                <div key={student.id} className="border rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex items-start gap-4">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => toggleStudentSelection(student.id)}
                      className="mt-1 w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="text-lg font-semibold text-gray-800">{student.name}</h4>
                        <span className={`text-2xl font-bold ${getAttendanceColor(student.attendance_rate)}`}>
                          {student.attendance_rate}%
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-x-6 gap-y-1 text-sm text-gray-600">
                        <p><span className="font-medium">Grade:</span> {student.grade} - Section {student.section}</p>
                        <p><span className="font-medium">Student ID:</span> {student.student_id}</p>
                        <p><span className="font-medium">Parent:</span> {student.parent_name || 'N/A'}</p>
                        <p><span className="font-medium">Total Days:</span> {student.total_days}</p>
                        <p><span className="font-medium">Present:</span> {student.present_days}</p>
                        <p><span className="font-medium">Absent:</span> {student.absent_days}</p>
                        <p className="col-span-3"><span className="font-medium">Email:</span> {student.parent_email || 'N/A'}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleSendSingle(student)}
                      disabled={sending || !student.parent_email}
                      className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm"
                    >
                      📧 Send Alert
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {!loading && students.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <div className="text-6xl mb-4">✅</div>
          <p className="text-lg font-medium">No students below {threshold}% attendance threshold</p>
          <p className="text-sm mt-2">All students are meeting the attendance requirements!</p>
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
