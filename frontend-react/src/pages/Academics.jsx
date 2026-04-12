import { useState, useEffect } from 'react';
import api from '../utils/api';

const Academics = () => {
  const [activeTab, setActiveTab] = useState('attendance');

  const tabs = [
    { id: 'attendance', label: 'Attendance' },
    { id: 'marks', label: 'Marks Entry' },
    { id: 'behaviour', label: 'Behaviour' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Academics</h1>
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
          {activeTab === 'attendance' && <AttendanceTab />}
          {activeTab === 'marks' && <MarksTab />}
          {activeTab === 'behaviour' && <BehaviourTab />}
        </div>
      </div>
    </div>
  );
};

// ============================================
// ATTENDANCE TAB
// ============================================
const AttendanceTab = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [grade, setGrade] = useState(6);
  const [section, setSection] = useState('A');
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isPosted, setIsPosted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchDailyAttendance();
  }, [date, grade, section]);

  const fetchDailyAttendance = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/attendance/daily?date=${date}&grade=${grade}&section=${section}`);
      const studentsList = response.data || [];
      setStudents(studentsList);
      const attendanceMap = {};
      let hasPostedAttendance = false;
      
      studentsList.forEach(s => {
        if (s.attendance?.status) {
          attendanceMap[s.id] = s.attendance.status.charAt(0).toUpperCase() + s.attendance.status.slice(1);
          hasPostedAttendance = true;
        } else {
          attendanceMap[s.id] = 'Present';
        }
      });
      
      setAttendance(attendanceMap);
      setIsPosted(hasPostedAttendance);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
      setStudents([]);
      setAttendance({});
      setIsPosted(false);
      setIsEditing(false);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendance(prev => ({ ...prev, [studentId]: status }));
  };

  const handleBulkSave = async () => {
    setSaving(true);
    try {
      const attendanceList = students.map(s => ({
        student_id: s.id,
        date: date,
        status: (attendance[s.id] || 'Present').toLowerCase()
      }));
      await api.post('/attendance/bulk', { attendance_list: attendanceList });
      alert('Attendance saved successfully!');
      setIsPosted(true);
      setIsEditing(false);
      fetchDailyAttendance();
    } catch (error) {
      alert('Failed to save attendance: ' + (error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Present': return 'bg-green-100 text-green-800 border-green-300';
      case 'Absent': return 'bg-red-100 text-red-800 border-red-300';
      case 'Late': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Excused': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
          <select
            value={grade}
            onChange={(e) => setGrade(Number(e.target.value))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {[6, 7, 8, 9, 10].map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
          <select
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {['A', 'B', 'C', 'D'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        {isPosted && !isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Edit Attendance
          </button>
        ) : (
          <button
            onClick={handleBulkSave}
            disabled={saving || students.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : isPosted ? 'Update Attendance' : 'Save Attendance'}
          </button>
        )}
      </div>

      {isPosted && !isEditing && (
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-green-800">Attendance Posted</p>
              <p className="text-sm text-green-700">Attendance for Grade {grade}-{section} on {new Date(date).toLocaleDateString()} has been recorded.</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading students...</div>
      ) : students.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No students found for this class</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border p-3 text-left">Student ID</th>
                <th className="border p-3 text-left">Name</th>
                <th className="border p-3 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="border p-3">{student.student_id}</td>
                  <td className="border p-3 font-medium">{student.first_name} {student.last_name}</td>
                  <td className="border p-3">
                    {isPosted && !isEditing ? (
                      <span className={`px-4 py-2 rounded-lg border-2 text-sm font-medium ${getStatusColor(attendance[student.id])}`}>
                        {attendance[student.id]}
                      </span>
                    ) : (
                      <div className="flex gap-2">
                        {['Present', 'Absent', 'Late', 'Excused'].map(status => (
                          <button
                            key={status}
                            onClick={() => handleStatusChange(student.id, status)}
                            className={`px-3 py-1 rounded-lg border-2 text-sm font-medium transition ${
                              attendance[student.id] === status
                                ? getStatusColor(status)
                                : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
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
// MARKS ENTRY TAB
// ============================================
const MarksTab = () => {
  const [grade, setGrade] = useState(6);
  const [section, setSection] = useState('A');
  const [semester, setSemester] = useState('Semester 1');
  const [examType, setExamType] = useState('Mid Term');
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isPosted, setIsPosted] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchStudentsAndMarks();
  }, [grade, section, semester, examType]);

  const fetchStudentsAndMarks = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/students?grade=${grade}&section=${section}`);
      const studentList = response.data.students || response.data || [];
      setStudents(studentList);
      
      // Try to fetch existing marks
      try {
        const marksResponse = await api.get(`/marks/${grade}/${section}?semester=${semester}`);
        const existingMarks = marksResponse.data.data?.marks || [];
        
        const marksMap = {};
        let hasMarks = false;
        
        studentList.forEach(s => {
          const existing = existingMarks.find(m => m.student_id === s.id && m.exam_type === examType);
          if (existing) {
            marksMap[s.id] = {
              math: existing.math_score || '',
              science: existing.science_score || '',
              english: existing.english_score || '',
              social: existing.social_score || '',
              language: existing.language_score || ''
            };
            hasMarks = true;
          } else {
            marksMap[s.id] = { math: '', science: '', english: '', social: '', language: '' };
          }
        });
        
        setMarks(marksMap);
        setIsPosted(hasMarks);
        setIsEditing(false);
      } catch (err) {
        // No existing marks, initialize empty
        const marksMap = {};
        studentList.forEach(s => {
          marksMap[s.id] = { math: '', science: '', english: '', social: '', language: '' };
        });
        setMarks(marksMap);
        setIsPosted(false);
        setIsEditing(false);
      }
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (studentId, subject, value) => {
    setMarks(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [subject]: value }
    }));
  };

  const handleSaveMarks = async () => {
    // Validate all marks are filled
    const emptyFields = [];
    for (const student of students) {
      const studentMarks = marks[student.id];
      if (!studentMarks.math || !studentMarks.science || !studentMarks.english || 
          !studentMarks.social || !studentMarks.language) {
        emptyFields.push(`${student.first_name} ${student.last_name}`);
      }
    }
    
    if (emptyFields.length > 0) {
      alert(`Please fill all subject scores for: ${emptyFields.join(', ')}`);
      return;
    }
    
    setSaving(true);
    try {
      const promises = students.map(student => {
        const studentMarks = marks[student.id];
        return api.post('/marks/entry', {
          student_id: student.id,
          grade: grade,
          section: section,
          semester: semester,
          exam_type: examType,
          math_score: parseFloat(studentMarks.math),
          science_score: parseFloat(studentMarks.science),
          english_score: parseFloat(studentMarks.english),
          social_score: parseFloat(studentMarks.social),
          language_score: parseFloat(studentMarks.language)
        });
      });
      await Promise.all(promises);
      alert('Marks saved successfully!');
      setIsPosted(true);
      setIsEditing(false);
      fetchStudentsAndMarks();
    } catch (error) {
      alert('Failed to save marks: ' + (error.response?.data?.message || error.response?.data?.error || error.message));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
          <select
            value={grade}
            onChange={(e) => setGrade(Number(e.target.value))}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {[6, 7, 8, 9, 10].map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
          <select
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            {['A', 'B', 'C', 'D'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Semester</label>
          <select
            value={semester}
            onChange={(e) => setSemester(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option>Semester 1</option>
            <option>Semester 2</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Exam Type</label>
          <select
            value={examType}
            onChange={(e) => setExamType(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option>Unit Test 1</option>
            <option>Unit Test 2</option>
            <option>Mid Term</option>
            <option>Final Exam</option>
            <option>Assignment</option>
            <option>Other</option>
          </select>
        </div>
      </div>

      <div className="flex gap-4 items-end">
        {isPosted && !isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            Edit Marks
          </button>
        ) : (
          <button
            onClick={handleSaveMarks}
            disabled={saving || students.length === 0}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Saving...' : isPosted ? 'Update Marks' : 'Save All Marks'}
          </button>
        )}
      </div>

      {isPosted && !isEditing && (
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="font-semibold text-green-800">Marks Posted</p>
              <p className="text-sm text-green-700">Marks for Grade {grade}-{section}, {semester}, {examType} have been recorded.</p>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">Loading students...</div>
      ) : students.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No students found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border p-3 text-left">Student ID</th>
                <th className="border p-3 text-left">Name</th>
                <th className="border p-3 text-left">Math</th>
                <th className="border p-3 text-left">Science</th>
                <th className="border p-3 text-left">English</th>
                <th className="border p-3 text-left">Social</th>
                <th className="border p-3 text-left">Language</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="border p-3">{student.student_id}</td>
                  <td className="border p-3 font-medium">{student.first_name} {student.last_name}</td>
                  {['math', 'science', 'english', 'social', 'language'].map(subject => (
                    <td key={subject} className="border p-3">
                      {isPosted && !isEditing ? (
                        <span className="font-medium">{marks[student.id]?.[subject] || '-'}</span>
                      ) : (
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.01"
                          value={marks[student.id]?.[subject] || ''}
                          onChange={(e) => handleMarkChange(student.id, subject, e.target.value)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                          placeholder="0-100"
                          required
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
  const [incidents, setIncidents] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [students, setStudents] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState(6);
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

  useEffect(() => {
    fetchIncidents();
  }, []);

  useEffect(() => {
    if (showForm) {
      fetchStudents();
    }
  }, [showForm, selectedGrade, selectedSection]);

  const fetchStudents = async () => {
    try {
      const response = await api.get(`/students?grade=${selectedGrade}&section=${selectedSection}`);
      const studentList = response.data.students || response.data || [];
      setStudents(studentList);
    } catch (error) {
      console.error('Failed to fetch students:', error);
      setStudents([]);
    }
  };

  const fetchIncidents = async () => {
    setLoading(true);
    try {
      const response = await api.get('/incidents?limit=50');
      const data = response.data;
      if (data.status === 'success') {
        setIncidents(data.data?.incidents || []);
      } else {
        setIncidents(response.data.incidents || response.data || []);
      }
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
      setIncidents([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.student_id) {
      alert('Please select a student');
      return;
    }
    try {
      await api.post('/incidents/log', formData);
      alert('Incident logged successfully!');
      setShowForm(false);
      setFormData({
        student_id: '',
        incident_date: new Date().toISOString().split('T')[0],
        incident_type: 'Disruption',
        severity: 'Minor',
        description: '',
        location: '',
        action_taken: ''
      });
      fetchIncidents();
    } catch (error) {
      alert('Failed to log incident: ' + (error.response?.data?.error || error.message));
    }
  };

  const getSeverityColor = (severity) => {
    switch(severity) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'Serious': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Moderate': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Minor': return 'bg-blue-100 text-blue-800 border-blue-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Behavioral Incidents</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          {showForm ? 'Cancel' : '+ Log New Incident'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-gray-50 p-6 rounded-lg space-y-4">
          <h3 className="text-lg font-bold mb-4">Log Behavioral Incident</h3>
          
          {/* Student Selection Section */}
          <div className="bg-white p-4 rounded-lg border-2 border-blue-200">
            <h4 className="text-sm font-semibold text-gray-700 mb-3">Select Student</h4>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Grade</label>
                <select
                  value={selectedGrade}
                  onChange={(e) => {
                    setSelectedGrade(Number(e.target.value));
                    setFormData({...formData, student_id: ''});
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {[6, 7, 8, 9, 10].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Section</label>
                <select
                  value={selectedSection}
                  onChange={(e) => {
                    setSelectedSection(e.target.value);
                    setFormData({...formData, student_id: ''});
                  }}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {['A', 'B', 'C', 'D'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Student <span className="text-red-500">*</span></label>
                <select
                  required
                  value={formData.student_id}
                  onChange={(e) => setFormData({...formData, student_id: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Student</option>
                  {students.map(student => (
                    <option key={student.id} value={student.id}>
                      {student.student_id} - {student.first_name} {student.last_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Incident Details Section */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                required
                value={formData.incident_date}
                onChange={(e) => setFormData({...formData, incident_date: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Incident Type <span className="text-red-500">*</span></label>
              <select
                value={formData.incident_type}
                onChange={(e) => setFormData({...formData, incident_type: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option>Disruption</option>
                <option>Fighting</option>
                <option>Bullying</option>
                <option>Vandalism</option>
                <option>Disrespect</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Severity <span className="text-red-500">*</span></label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({...formData, severity: e.target.value})}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option>Minor</option>
                <option>Moderate</option>
                <option>Serious</option>
                <option>Critical</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input
                type="text"
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="e.g., Classroom, Playground"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Description <span className="text-red-500">*</span></label>
            <textarea
              required
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Describe the incident in detail..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Action Taken</label>
            <textarea
              rows={2}
              value={formData.action_taken}
              onChange={(e) => setFormData({...formData, action_taken: e.target.value})}
              placeholder="What action was taken? (optional)"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Log Incident
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center py-8">Loading incidents...</div>
      ) : incidents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">No incidents recorded</div>
      ) : (
        <div className="space-y-3">
          {incidents.map((incident) => (
            <div key={incident.id} className="border rounded-lg p-4 hover:shadow-md transition">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-semibold text-gray-800">{incident.incident_type}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getSeverityColor(incident.severity)}`}>
                      {incident.severity}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{incident.description}</p>
                  {incident.location && (
                    <p className="text-xs text-gray-500">📍 {incident.location}</p>
                  )}
                  {incident.action_taken && (
                    <p className="text-xs text-gray-500 mt-1">✅ Action: {incident.action_taken}</p>
                  )}
                </div>
                <div className="text-right text-sm text-gray-500">
                  <p>{new Date(incident.incident_date).toLocaleDateString()}</p>
                  <p className="text-xs">Student ID: {incident.student_id}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Academics;
