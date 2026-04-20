import { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import AddStudentForm from '../components/AddStudentForm';
import toast from 'react-hot-toast';

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

const Students = () => {
  const [students, setStudents]             = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading]               = useState(true);
  const [searchTerm, setSearchTerm]         = useState('');
  const [selectedGrade, setSelectedGrade]   = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [activeTab, setActiveTab]           = useState('list');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/students');
      setStudents(response.data.students || response.data);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally { setLoading(false); }
  };

  const fetchStudentDetails = async (id) => {
    setLoading(true);
    try {
      const [student, academics, predictions, incidents] = await Promise.all([
        api.get(`/students/${id}`),
        api.get(`/students/${id}/academics`).catch(() => ({ data: [] })),
        api.get(`/students/${id}/predictions`).catch(() => ({ data: [] })),
        api.get(`/incidents?student_id=${id}`).catch(() => ({ data: [] })),
      ]);
      setSelectedStudent({
        ...student.data,
        academics: academics.data || [],
        predictions: predictions.data || [],
        incidents: incidents.data.incidents || incidents.data || [],
      });
      setActiveTab('profile');
    } catch (error) {
      console.error('Failed to fetch student details:', error);
    } finally { setLoading(false); }
  };

  const handleDeleteStudent = async () => {
    try {
      await api.delete(`/students/${selectedStudent.id}`);
      setStudents(students.filter(s => s.id !== selectedStudent.id));
      setShowDeleteModal(false);
      setSelectedStudent(null);
      setActiveTab('list');
      toast.success('Student deleted successfully!');
    } catch {
      toast.error('Failed to delete student');
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade   = !selectedGrade   || s.grade?.toString() === selectedGrade;
    const matchesSection = !selectedSection || s.section?.toUpperCase() === selectedSection.toUpperCase();
    const matchesId      = !selectedStudentId || s.student_id === selectedStudentId;
    return matchesSearch && matchesGrade && matchesSection && matchesId;
  });

  const grades   = [...new Set(students.map(s => s.grade).filter(Boolean))].sort((a, b) => a - b);
  const sections = [...new Set(students.map(s => s.section).filter(Boolean))].sort();

  const filteredStudentIds = students
    .filter(s => {
      const mg = !selectedGrade   || s.grade?.toString() === selectedGrade;
      const ms = !selectedSection || s.section?.toUpperCase() === selectedSection.toUpperCase();
      return mg && ms;
    })
    .map(s => s.student_id).filter(Boolean).sort();

  const getRiskStyle = (risk) => {
    const map = {
      Critical: { bg: 'rgba(239,68,68,0.15)',  border: 'rgba(239,68,68,0.4)',  color: '#fca5a5' },
      High:     { bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.4)', color: '#fdba74' },
      Medium:   { bg: 'rgba(234,179,8,0.15)',  border: 'rgba(234,179,8,0.4)',  color: '#fde047' },
      Low:      { bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.4)',  color: '#86efac' },
    };
    return map[risk] || { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.3)', color: '#a5b4fc' };
  };

  if (loading && !selectedStudent) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <svg className="animate-spin w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <p className="text-indigo-300 text-sm">Loading students...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="text-2xl font-bold text-white">Students</h1>
            <p className="text-sm mt-0.5" style={{ color: 'rgba(165,180,252,0.6)' }}>Manage and monitor student records</p>
          </div>
          <div className="text-sm font-medium px-3 py-1.5 rounded-xl"
            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a5b4fc' }}>
            {filteredStudents.length} student{filteredStudents.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="flex gap-1 p-1 rounded-2xl" style={glass}>
          {[
            { key: 'list',    icon: '📋', label: 'Students List' },
            { key: 'add',     icon: '➕', label: 'Add New Student' },
            { key: 'profile', icon: '👤', label: selectedStudent ? `${selectedStudent.first_name} ${selectedStudent.last_name}` : 'Student Profile' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={activeTab === tab.key
                ? { background: 'linear-gradient(135deg, rgba(99,102,241,0.5), rgba(139,92,246,0.4))', color: '#fff', border: '1px solid rgba(99,102,241,0.5)' }
                : { color: 'rgba(165,180,252,0.6)', border: '1px solid transparent' }
              }>
              <span>{tab.icon}</span>
              <span className="hidden sm:inline truncate max-w-[140px]">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ============================
          STUDENTS LIST TAB
      ============================= */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3 p-4 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.2)' }}>
            <div className="relative flex-1 min-w-[220px]">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400 text-sm">🔍</span>
              <input type="text" placeholder="Search by name or ID..."
                value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl text-white text-sm outline-none transition-all duration-200"
                style={inputStyle}
                onFocus={e => e.target.style.borderColor = '#6366f1'}
                onBlur={e => e.target.style.borderColor = 'rgba(99,102,241,0.3)'} />
            </div>
            <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)}
              className="px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
              style={inputStyle}>
              <option value="" style={{ background: '#1e1b4b' }}>All Grades</option>
              {grades.map(g => <option key={g} value={g} style={{ background: '#1e1b4b' }}>Grade {g}</option>)}
            </select>
            <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)}
              className="px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
              style={inputStyle}>
              <option value="" style={{ background: '#1e1b4b' }}>All Sections</option>
              {sections.map(s => <option key={s} value={s} style={{ background: '#1e1b4b' }}>Section {s}</option>)}
            </select>
            {(searchTerm || selectedGrade || selectedSection) && (
              <button onClick={() => { setSearchTerm(''); setSelectedGrade(''); setSelectedSection(''); }}
                className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}>
                ✕ Clear
              </button>
            )}
          </div>
          <div className="rounded-2xl overflow-hidden"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.2)', backdropFilter: 'blur(12px)' }}>
            <table className="w-full">
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.08)' }}>
                  {['Student ID', 'Name', 'Grade', 'Section', 'Risk Level', 'Actions'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider"
                      style={{ color: 'rgba(165,180,252,0.7)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredStudents.map(student => {
                  const rs = getRiskStyle(student.risk_label);
                  return (
                    <tr key={student.id} className="transition-all duration-150"
                      style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.08)'}
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
                      <td className="px-5 py-3.5"><span className="text-sm" style={{ color: 'rgba(165,180,252,0.8)' }}>{student.grade}</span></td>
                      <td className="px-5 py-3.5"><span className="text-sm" style={{ color: 'rgba(165,180,252,0.8)' }}>{student.section || '—'}</span></td>
                      <td className="px-5 py-3.5">
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                          style={{ background: rs.bg, border: `1px solid ${rs.border}`, color: rs.color }}>
                          {student.risk_label || 'N/A'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <button onClick={() => fetchStudentDetails(student.id)}
                          className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                          style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', color: '#a5b4fc' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.4)'; e.currentTarget.style.color = '#fff'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.2)'; e.currentTarget.style.color = '#a5b4fc'; }}>
                          View Profile →
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {filteredStudents.length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <span className="text-4xl">🔍</span>
                <p className="text-sm" style={{ color: 'rgba(165,180,252,0.5)' }}>No students found matching your filters</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================
          STUDENT PROFILE TAB
      ============================= */}
      {activeTab === 'profile' && (
        <div className="space-y-5">
          {/* Profile Filters */}
          <div className="flex flex-wrap gap-3 p-4 rounded-2xl" style={glass}>
            <select value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)}
              className="px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
              style={inputStyle}>
              <option value="" style={{ background: '#1e1b4b' }}>All Grades</option>
              {grades.map(g => <option key={g} value={g} style={{ background: '#1e1b4b' }}>Grade {g}</option>)}
            </select>
            <select value={selectedSection} onChange={e => setSelectedSection(e.target.value)}
              className="px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
              style={inputStyle}>
              <option value="" style={{ background: '#1e1b4b' }}>All Sections</option>
              {sections.map(s => <option key={s} value={s} style={{ background: '#1e1b4b' }}>Section {s}</option>)}
            </select>
            <select value={selectedStudentId}
              onChange={e => {
                setSelectedStudentId(e.target.value);
                if (e.target.value) {
                  const student = students.find(s => s.student_id === e.target.value);
                  if (student) fetchStudentDetails(student.id);
                }
              }}
              className="flex-1 min-w-[250px] px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
              style={inputStyle}>
              <option value="" style={{ background: '#1e1b4b' }}>Select Student ID</option>
              {filteredStudentIds.map(id => (
                <option key={id} value={id} style={{ background: '#1e1b4b' }}>{id}</option>
              ))}
            </select>
            {(selectedGrade || selectedSection || selectedStudentId) && (
              <button
                onClick={() => { setSelectedGrade(''); setSelectedSection(''); setSelectedStudentId(''); setSelectedStudent(null); }}
                className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.25)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}>
                ✕ Clear
              </button>
            )}
          </div>

          {!selectedStudent ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 rounded-2xl" style={glass}>
              <span className="text-5xl">👤</span>
              <p className="text-sm" style={{ color: 'rgba(165,180,252,0.5)' }}>Select a student using the filters above to view their profile</p>
            </div>
          ) : (
            <div className="space-y-5">

              {/* ── Profile Hero Card ── */}
              <div className="rounded-2xl p-6 relative overflow-hidden"
                style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.35) 0%, rgba(139,92,246,0.25) 100%)', border: '1px solid rgba(99,102,241,0.4)' }}>
                {/* decorative dot grid */}
                <div className="absolute inset-0 opacity-10 pointer-events-none"
                  style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #fff 1px, transparent 1px)', backgroundSize: '22px 22px' }} />
                <div className="relative z-10 flex items-start justify-between gap-4 flex-wrap">
                  <div className="flex items-center gap-5">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
                      style={{ background: 'rgba(255,255,255,0.18)' }}>
                      {selectedStudent.first_name?.[0]}{selectedStudent.last_name?.[0]}
                    </div>
                    <div>
                      <h2 className="text-2xl font-bold text-white">{selectedStudent.first_name} {selectedStudent.last_name}</h2>
                      <p className="text-sm mt-0.5" style={{ color: 'rgba(199,210,254,0.8)' }}>ID: {selectedStudent.student_id}</p>
                      <p className="text-xs mt-1" style={{ color: 'rgba(199,210,254,0.6)' }}>
                        Grade {selectedStudent.grade}{selectedStudent.section ? ` · Section ${selectedStudent.section}` : ''}
                        {selectedStudent.is_active ? ' · Active' : ' · Inactive'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Risk Badge */}
                    {(() => {
                      const rs = getRiskStyle(selectedStudent.risk_label);
                      return (
                        <span className="px-4 py-2 rounded-xl text-sm font-bold"
                          style={{ background: rs.bg, border: `1px solid ${rs.border}`, color: rs.color }}>
                          ⚠️ Risk: {selectedStudent.risk_label || 'Not Assessed'}
                        </span>
                      );
                    })()}
                    <button onClick={() => setShowDeleteModal(true)}
                      className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
                      style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.3)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}>
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>

              {/* ── Info Grid Row ── */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

                {/* Basic Information */}
                <div className="rounded-2xl p-5" style={glass}>
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <span>📋</span> Basic Information
                  </h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { label: 'Grade & Section', val: `${selectedStudent.grade}${selectedStudent.section ? ` - ${selectedStudent.section}` : ''}` },
                      { label: 'Gender', val: selectedStudent.gender || 'N/A' },
                      { label: 'Age', val: selectedStudent.age || 'N/A' },
                      { label: 'Date of Birth', val: selectedStudent.date_of_birth || 'N/A' },
                      { label: 'Enrollment Date', val: selectedStudent.enrollment_date || 'N/A' },
                      { label: 'Status', val: selectedStudent.is_active ? 'Active' : 'Inactive', isStatus: true },
                    ].map(item => (
                      <div key={item.label} className="p-3 rounded-xl" style={{ background: 'rgba(99,102,241,0.07)' }}>
                        <p className="text-xs mb-1" style={{ color: 'rgba(165,180,252,0.55)', fontSize: '0.68rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{item.label}</p>
                        {item.isStatus ? (
                          <span className="text-xs font-semibold px-2 py-0.5 rounded-full"
                            style={selectedStudent.is_active
                              ? { background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.35)', color: '#86efac' }
                              : { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5' }}>
                            {item.val}
                          </span>
                        ) : (
                          <p className="text-sm font-semibold text-white">{item.val}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Parent Information */}
                <div className="rounded-2xl p-5" style={glass}>
                  <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                    <span>👨‍👩‍👧</span> Parent Information
                  </h3>
                  <div className="space-y-3">
                    {[
                      { label: 'Parent Name', val: selectedStudent.parent_name || 'N/A' },
                      { label: 'Phone', val: selectedStudent.parent_phone || 'N/A' },
                      { label: 'Email', val: selectedStudent.parent_email || 'N/A' },
                      { label: 'Parent Education', val: selectedStudent.parent_education || 'N/A' },
                      { label: 'Socioeconomic Status', val: selectedStudent.socioeconomic_status || 'N/A' },
                    ].map(item => (
                      <div key={item.label} className="flex justify-between items-center py-2"
                        style={{ borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                        <span className="text-xs" style={{ color: 'rgba(165,180,252,0.55)' }}>{item.label}</span>
                        <span className="text-sm font-semibold text-white">{item.val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* ── Academic Records ── */}
              <div className="rounded-2xl p-5" style={glass}>
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <span>📚</span> Academic Records
                </h3>
                {selectedStudent.academics?.length > 0 ? (
                  <div className="overflow-x-auto rounded-xl" style={{ border: '1px solid rgba(99,102,241,0.15)' }}>
                    <table className="w-full">
                      <thead>
                        <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.08)' }}>
                          {['Semester', 'GPA', 'Math', 'Science', 'English', 'Social', 'Language', 'Failed'].map(h => (
                            <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider"
                              style={{ color: 'rgba(165,180,252,0.7)' }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selectedStudent.academics.map(record => (
                          <tr key={record.id}
                            style={{ borderBottom: '1px solid rgba(99,102,241,0.08)' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.06)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                            <td className="px-4 py-3">
                              <span className="text-xs font-mono px-2 py-1 rounded-lg"
                                style={{ background: 'rgba(99,102,241,0.15)', color: '#a5b4fc' }}>
                                {record.semester}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-sm font-bold" style={{ color: '#a5b4fc' }}>{record.current_gpa || 'N/A'}</span>
                            </td>
                            {['math_score','science_score','english_score','social_score','language_score'].map(f => (
                              <td key={f} className="px-4 py-3">
                                <span className="text-sm" style={{ color: 'rgba(165,180,252,0.8)' }}>{record[f] || '—'}</span>
                              </td>
                            ))}
                            <td className="px-4 py-3">
                              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                                style={record.failed_subjects > 0
                                  ? { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5' }
                                  : { background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.35)', color: '#86efac' }}
                              >
                                {record.failed_subjects || 0}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <span className="text-3xl">📚</span>
                    <p className="text-sm" style={{ color: 'rgba(165,180,252,0.5)' }}>No academic records found</p>
                  </div>
                )}
              </div>

              {/* ── Risk Assessments ── */}
              <div className="rounded-2xl p-5" style={glass}>
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <span>🎯</span> Risk Assessments
                </h3>

                {selectedStudent.predictions?.length > 0 ? (
                  <div className="space-y-4">
                    {/* Latest Prediction Card */}
                    {(() => {
                      const pred = selectedStudent.predictions[0];
                      const rs   = getRiskStyle(pred.risk_label);
                      const probData = [
                        { name: 'Low',  value: pred.probability_low      || 0, color: '#22c55e' },
                        { name: 'Med',  value: pred.probability_medium   || 0, color: '#eab308' },
                        { name: 'High', value: pred.probability_high     || 0, color: '#f97316' },
                        { name: 'Crit', value: pred.probability_critical || 0, color: '#ef4444' },
                      ];
                      return (
                        <div className="p-5 rounded-2xl"
                          style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                          <div className="flex items-center justify-between mb-5">
                            <h4 className="text-sm font-bold text-white">Current Risk Assessment</h4>
                            <span className="text-xs" style={{ color: 'rgba(165,180,252,0.5)' }}>
                              {new Date(pred.prediction_date).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* Left: badge + confidence + bar chart */}
                            <div className="space-y-5">
                              {/* Risk Badge */}
                              <div className="flex justify-center">
                                <span className="px-8 py-3 rounded-2xl text-2xl font-bold"
                                  style={{ background: rs.bg, border: `2px solid ${rs.border}`, color: rs.color }}>
                                  {pred.risk_label}
                                </span>
                              </div>

                              {/* Confidence Bar */}
                              <div>
                                <div className="flex justify-between items-center mb-2">
                                  <p className="text-xs" style={{ color: 'rgba(165,180,252,0.6)' }}>Confidence Score</p>
                                  <p className="text-sm font-bold" style={{ color: '#a5b4fc' }}>{pred.confidence_score}%</p>
                                </div>
                                <div className="w-full h-2.5 rounded-full" style={{ background: 'rgba(99,102,241,0.2)' }}>
                                  <div className="h-2.5 rounded-full transition-all duration-700"
                                    style={{ width: `${pred.confidence_score}%`, background: 'linear-gradient(90deg, #6366f1, #8b5cf6)' }} />
                                </div>
                              </div>

                              {/* Mini Bar Chart */}
                              {pred.probability_low !== undefined && (
                                <div>
                                  <p className="text-xs mb-2" style={{ color: 'rgba(165,180,252,0.6)' }}>Probability Distribution</p>
                                  <ResponsiveContainer width="100%" height={160}>
                                    <BarChart data={probData}>
                                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
                                      <XAxis dataKey="name" stroke="rgba(165,180,252,0.3)" tick={{ fill: 'rgba(165,180,252,0.6)', fontSize: 11 }} />
                                      <YAxis stroke="rgba(99,102,241,0.2)" tick={{ fill: 'rgba(165,180,252,0.6)', fontSize: 11 }} />
                                      <Tooltip formatter={v => `${v}%`}
                                        contentStyle={{ background: 'rgba(15,12,41,0.95)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 12, color: '#fff', fontSize: 12 }} />
                                      <Bar dataKey="value" radius={[6,6,0,0]}>
                                        {probData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                                      </Bar>
                                    </BarChart>
                                  </ResponsiveContainer>
                                </div>
                              )}
                            </div>

                            {/* Right: Pie Chart */}
                            {pred.probability_low !== undefined && (
                              <div className="flex flex-col items-center justify-center">
                                <p className="text-xs mb-3" style={{ color: 'rgba(165,180,252,0.6)' }}>Risk Distribution</p>
                                <ResponsiveContainer width="100%" height={240}>
                                  <PieChart>
                                    <Pie data={[
                                      { name: 'Low',      value: pred.probability_low      || 0, color: '#22c55e' },
                                      { name: 'Medium',   value: pred.probability_medium   || 0, color: '#eab308' },
                                      { name: 'High',     value: pred.probability_high     || 0, color: '#f97316' },
                                      { name: 'Critical', value: pred.probability_critical || 0, color: '#ef4444' },
                                    ]}
                                      cx="50%" cy="50%" outerRadius={90} innerRadius={40}
                                      labelLine={false}
                                      label={({ name, value }) => `${name}: ${value}%`}
                                      dataKey="value">
                                      {[{ color: '#22c55e' }, { color: '#eab308' }, { color: '#f97316' }, { color: '#ef4444' }].map((e, i) => (
                                        <Cell key={i} fill={e.color} />
                                      ))}
                                    </Pie>
                                    <Tooltip formatter={v => `${v}%`}
                                      contentStyle={{ background: 'rgba(15,12,41,0.95)', border: '1px solid rgba(99,102,241,0.4)', borderRadius: 12, color: '#fff', fontSize: 12 }} />
                                  </PieChart>
                                </ResponsiveContainer>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Previous Predictions */}
                    {selectedStudent.predictions.length > 1 && (
                      <details className="rounded-2xl overflow-hidden"
                        style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)' }}>
                        <summary className="px-5 py-3 cursor-pointer text-sm font-semibold text-white"
                          style={{ listStyle: 'none' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          📋 View Previous Predictions ({selectedStudent.predictions.length - 1})
                        </summary>
                        <div className="p-4 space-y-3">
                          {selectedStudent.predictions.slice(1).map(pred => {
                            const rs = getRiskStyle(pred.risk_label);
                            return (
                              <div key={pred.id} className="p-4 rounded-xl"
                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(99,102,241,0.12)' }}>
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-3">
                                    <span className="px-3 py-1 rounded-full text-xs font-semibold"
                                      style={{ background: rs.bg, border: `1px solid ${rs.border}`, color: rs.color }}>
                                      {pred.risk_label}
                                    </span>
                                    <span className="text-xs" style={{ color: 'rgba(165,180,252,0.6)' }}>
                                      Confidence: <span className="font-semibold text-white">{pred.confidence_score}%</span>
                                    </span>
                                  </div>
                                  <span className="text-xs" style={{ color: 'rgba(165,180,252,0.45)' }}>
                                    {new Date(pred.prediction_date).toLocaleDateString()}
                                  </span>
                                </div>
                                {pred.probability_low !== undefined && (
                                  <div className="mt-3 grid grid-cols-4 gap-2">
                                    {[
                                      { label: 'Low', val: pred.probability_low, color: '#86efac' },
                                      { label: 'Med', val: pred.probability_medium, color: '#fde047' },
                                      { label: 'High', val: pred.probability_high, color: '#fdba74' },
                                      { label: 'Crit', val: pred.probability_critical, color: '#fca5a5' },
                                    ].map(p => (
                                      <div key={p.label} className="text-center p-2 rounded-lg"
                                        style={{ background: 'rgba(99,102,241,0.06)' }}>
                                        <p className="text-xs" style={{ color: 'rgba(165,180,252,0.5)', fontSize: '0.65rem' }}>{p.label}</p>
                                        <p className="text-sm font-bold mt-0.5" style={{ color: p.color }}>{p.val}%</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </details>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <span className="text-3xl">🎯</span>
                    <p className="text-sm" style={{ color: 'rgba(165,180,252,0.5)' }}>No risk assessments found</p>
                  </div>
                )}
              </div>

              {/* ── Behavioral Incidents ── */}
              <div className="rounded-2xl p-5" style={glass}>
                <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                  <span>⚠️</span> Behavioral Incidents
                </h3>
                {selectedStudent.incidents?.length > 0 ? (
                  <div className="space-y-3">
                    {selectedStudent.incidents.map(incident => {
                      const sev = incident.severity;
                      const sc = sev === 'Critical' || sev === 'High'
                        ? { bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.35)', dot: '#ef4444' }
                        : sev === 'Medium' || sev === 'Moderate'
                        ? { bg: 'rgba(234,179,8,0.1)',  border: 'rgba(234,179,8,0.35)',  dot: '#eab308' }
                        : { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.25)', dot: '#6366f1' };
                      return (
                        <div key={incident.id} className="p-4 rounded-xl flex gap-4"
                          style={{ background: sc.bg, border: `1px solid ${sc.border}` }}>
                          <div className="w-1 rounded-full flex-shrink-0 mt-1 self-stretch" style={{ background: sc.dot }} />
                          <div className="flex-1">
                            <div className="flex justify-between items-start gap-2">
                              <p className="text-sm font-semibold text-white">{incident.incident_type}</p>
                              <span className="text-xs flex-shrink-0" style={{ color: 'rgba(165,180,252,0.5)' }}>
                                {new Date(incident.incident_date).toLocaleDateString()}
                              </span>
                            </div>
                            <p className="text-xs mt-1" style={{ color: 'rgba(165,180,252,0.7)' }}>{incident.description}</p>
                            {incident.severity && (
                              <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold"
                                style={{ background: sc.bg, border: `1px solid ${sc.border}`, color: sc.dot }}>
                                {incident.severity}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-10 gap-3">
                    <span className="text-3xl">✅</span>
                    <p className="text-sm" style={{ color: 'rgba(165,180,252,0.5)' }}>No incidents recorded</p>
                  </div>
                )}
              </div>

            </div>
          )}
        </div>
      )}

      {/* ============================
          ADD NEW STUDENT TAB
      ============================= */}
      {activeTab === 'add' && (
        <AddStudentForm
          onClose={() => setActiveTab('list')}
          onSuccess={() => { fetchStudents(); setActiveTab('list'); }}
        />
      )}

      {/* ============================
          DELETE CONFIRMATION MODAL
      ============================= */}
      {showDeleteModal && selectedStudent && (
        <div className="fixed inset-0 flex items-center justify-center z-50"
          style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}>
          <div className="rounded-2xl p-6 w-full max-w-md mx-4 shadow-2xl"
            style={{ background: '#1a1835', border: '1px solid rgba(99,102,241,0.3)' }}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)' }}>
                🗑️
              </div>
              <h3 className="text-lg font-bold text-white">Confirm Delete</h3>
            </div>
            <p className="text-sm mb-6" style={{ color: 'rgba(165,180,252,0.7)' }}>
              Are you sure you want to delete{' '}
              <span className="font-semibold text-white">{selectedStudent?.first_name} {selectedStudent?.last_name}</span>?
              {' '}This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}>
                Cancel
              </button>
              <button onClick={handleDeleteStudent}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
                style={{ background: 'rgba(239,68,68,0.2)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.4)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}>
                Delete Student
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;
