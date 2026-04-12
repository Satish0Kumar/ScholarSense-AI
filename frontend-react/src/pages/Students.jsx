import { useState, useEffect } from 'react';
import api from '../utils/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AddStudentForm from '../components/AddStudentForm';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [activeTab, setActiveTab] = useState('list');
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/students');
      setStudents(response.data.students || response.data);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    } finally {
      setLoading(false);
    }
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
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteStudent = async () => {
    try {
      await api.delete(`/students/${selectedStudent.id}`);
      setStudents(students.filter(s => s.id !== selectedStudent.id));
      setShowDeleteModal(false);
      setSelectedStudent(null);
      setActiveTab('list');
    } catch (error) {
      console.error('Failed to delete student:', error);
      alert('Failed to delete student');
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.student_id?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesGrade = !selectedGrade || s.grade?.toString() === selectedGrade;
    const matchesSection = !selectedSection || s.section?.toUpperCase() === selectedSection.toUpperCase();
    const matchesStudentId = !selectedStudentId || s.student_id === selectedStudentId;
    return matchesSearch && matchesGrade && matchesSection && matchesStudentId;
  });

  const grades = [...new Set(students.map(s => s.grade).filter(Boolean))].sort((a, b) => a - b);
  const sections = [...new Set(students.map(s => s.section).filter(Boolean))].sort();
  
  // Filter student IDs based on selected grade and section
  const filteredStudentIds = students
    .filter(s => {
      const matchesGrade = !selectedGrade || s.grade?.toString() === selectedGrade;
      const matchesSection = !selectedSection || s.section?.toUpperCase() === selectedSection.toUpperCase();
      return matchesGrade && matchesSection;
    })
    .map(s => s.student_id)
    .filter(Boolean)
    .sort();

  const getRiskColor = (risk) => {
    switch(risk) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  if (loading && !selectedStudent) return <div className="text-center py-8">Loading...</div>;

  return (
    <div className="space-y-6">
      {/* Header with Tabs */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800 mb-4">Students</h1>
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab('list')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'list'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            📋 Students List
          </button>
          <button
            onClick={() => setActiveTab('add')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'add'
                ? 'border-b-2 border-green-600 text-green-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            ➕ Add New Student
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-6 py-3 font-semibold transition ${
              activeTab === 'profile'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            👤 Student Profile {selectedStudent && `- ${selectedStudent.first_name} ${selectedStudent.last_name}`}
          </button>
        </div>
      </div>

      {/* Students List Tab */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <input
              type="text"
              placeholder="🔍 Search by name or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 min-w-[250px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">All Grades</option>
              {grades.map(grade => (
                <option key={grade} value={grade}>Grade {grade}</option>
              ))}
            </select>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">All Sections</option>
              {sections.map(section => (
                <option key={section} value={section}>Section {section}</option>
              ))}
            </select>
            {(searchTerm || selectedGrade || selectedSection) && (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedGrade('');
                  setSelectedSection('');
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Student ID</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Name</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Grade</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Section</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Risk Level</th>
                  <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-sm text-gray-900">{student.student_id}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      {student.first_name} {student.last_name}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{student.grade}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{student.section || '-'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getRiskColor(student.risk_label)}`}>
                        {student.risk_label || 'N/A'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => fetchStudentDetails(student.id)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                      >
                        View Profile
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredStudents.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No students found
              </div>
            )}
          </div>
        </div>
      )}

      {/* Student Profile Tab */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Filters for Profile Tab */}
          <div className="flex flex-wrap gap-3">
            <select
              value={selectedGrade}
              onChange={(e) => setSelectedGrade(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">All Grades</option>
              {grades.map(grade => (
                <option key={grade} value={grade}>Grade {grade}</option>
              ))}
            </select>
            <select
              value={selectedSection}
              onChange={(e) => setSelectedSection(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">All Sections</option>
              {sections.map(section => (
                <option key={section} value={section}>Section {section}</option>
              ))}
            </select>
            <select
              value={selectedStudentId}
              onChange={(e) => {
                setSelectedStudentId(e.target.value);
                if (e.target.value) {
                  const student = students.find(s => s.student_id === e.target.value);
                  if (student) fetchStudentDetails(student.id);
                }
              }}
              className="flex-1 min-w-[250px] px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option value="">Select Student ID</option>
              {filteredStudentIds.map(id => (
                <option key={id} value={id}>{id}</option>
              ))}
            </select>
            {(selectedGrade || selectedSection || selectedStudentId) && (
              <button
                onClick={() => {
                  setSelectedGrade('');
                  setSelectedSection('');
                  setSelectedStudentId('');
                  setSelectedStudent(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* Show filtered students list or selected profile */}
          {!selectedStudent ? (
            <div className="bg-white rounded-lg shadow p-6">
              <p className="text-center text-gray-500 py-8">
                Please select a student using the filters above to view their profile
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Profile Header Card */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg shadow-lg p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold">{selectedStudent.first_name} {selectedStudent.last_name}</h1>
                    <p className="text-blue-100 mt-1">Student ID: {selectedStudent.student_id}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`inline-block px-4 py-2 rounded-lg border-2 ${getRiskColor(selectedStudent.risk_label || 'N/A')} bg-white`}>
                      <span className="font-semibold">Risk: {selectedStudent.risk_label || 'Not Assessed'}</span>
                    </div>
                    <button
                      onClick={() => setShowDeleteModal(true)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium flex items-center gap-2"
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              </div>

              {/* Basic Information */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">📋 Basic Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Grade & Section</p>
                    <p className="font-semibold">{selectedStudent.grade}{selectedStudent.section ? ` - ${selectedStudent.section}` : ''}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Gender</p>
                    <p className="font-semibold">{selectedStudent.gender || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Age</p>
                    <p className="font-semibold">{selectedStudent.age || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Date of Birth</p>
                    <p className="font-semibold">{selectedStudent.date_of_birth || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Enrollment Date</p>
                    <p className="font-semibold">{selectedStudent.enrollment_date || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Status</p>
                    <p className="font-semibold">
                      <span className={`px-2 py-1 rounded text-sm ${selectedStudent.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {selectedStudent.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Parent Information */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">👨👩👧 Parent Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Parent Name</p>
                    <p className="font-semibold">{selectedStudent.parent_name || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Parent Phone</p>
                    <p className="font-semibold">{selectedStudent.parent_phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Parent Email</p>
                    <p className="font-semibold">{selectedStudent.parent_email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Parent Education</p>
                    <p className="font-semibold">{selectedStudent.parent_education || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Socioeconomic Status</p>
                    <p className="font-semibold">{selectedStudent.socioeconomic_status || 'N/A'}</p>
                  </div>
                </div>
              </div>

              {/* Academic Records */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">📚 Academic Records</h2>
                {selectedStudent.academics?.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="bg-gray-50">
                          <th className="border p-3 text-left">Semester</th>
                          <th className="border p-3 text-left">GPA</th>
                          <th className="border p-3 text-left">Math</th>
                          <th className="border p-3 text-left">Science</th>
                          <th className="border p-3 text-left">English</th>
                          <th className="border p-3 text-left">Social</th>
                          <th className="border p-3 text-left">Language</th>
                          <th className="border p-3 text-left">Failed</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedStudent.academics.map((record) => (
                          <tr key={record.id} className="hover:bg-gray-50">
                            <td className="border p-3">{record.semester}</td>
                            <td className="border p-3 font-semibold">{record.current_gpa || 'N/A'}</td>
                            <td className="border p-3">{record.math_score || '-'}</td>
                            <td className="border p-3">{record.science_score || '-'}</td>
                            <td className="border p-3">{record.english_score || '-'}</td>
                            <td className="border p-3">{record.social_score || '-'}</td>
                            <td className="border p-3">{record.language_score || '-'}</td>
                            <td className="border p-3">
                              <span className={`px-2 py-1 rounded text-sm ${record.failed_subjects > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'}`}>
                                {record.failed_subjects || 0}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No academic records found</p>
                )}
              </div>

              {/* Risk Assessments */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">🎯 Risk Assessments</h2>
                {selectedStudent.predictions?.length > 0 ? (
                  <div className="space-y-4">
                    {/* Current/Latest Prediction - Visual Display */}
                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-lg font-bold text-gray-800">Current Risk Assessment</h3>
                        <span className="text-sm text-gray-500">
                          {new Date(selectedStudent.predictions[0].prediction_date).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Left: Risk Badge and Confidence */}
                        <div className="space-y-4">
                          {/* Large Risk Badge */}
                          <div className="flex items-center justify-center">
                            <div className={`px-8 py-4 rounded-xl text-3xl font-bold border-4 ${getRiskColor(selectedStudent.predictions[0].risk_label)} shadow-lg`}>
                              {selectedStudent.predictions[0].risk_label}
                            </div>
                          </div>

                          {/* Confidence Score */}
                          <div>
                            <p className="text-sm text-gray-600 mb-2 text-center">Confidence Score</p>
                            <div className="flex items-center justify-center gap-2">
                              <div className="w-full bg-gray-200 rounded-full h-4">
                                <div 
                                  className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                                  style={{ width: `${selectedStudent.predictions[0].confidence_score}%` }}
                                ></div>
                              </div>
                              <span className="text-2xl font-bold text-blue-600 min-w-[60px]">{selectedStudent.predictions[0].confidence_score}%</span>
                            </div>
                          </div>

                          {/* Bar Chart */}
                          {selectedStudent.predictions[0].probability_low !== undefined && (
                            <div>
                              <p className="text-sm font-semibold text-gray-700 mb-2 text-center">Probability Distribution</p>
                              <ResponsiveContainer width="100%" height={180}>
                                <BarChart data={[
                                  { name: 'Low', value: selectedStudent.predictions[0].probability_low || 0, color: '#22c55e' },
                                  { name: 'Med', value: selectedStudent.predictions[0].probability_medium || 0, color: '#eab308' },
                                  { name: 'High', value: selectedStudent.predictions[0].probability_high || 0, color: '#f97316' },
                                  { name: 'Crit', value: selectedStudent.predictions[0].probability_critical || 0, color: '#ef4444' }
                                ]}>
                                  <CartesianGrid strokeDasharray="3 3" />
                                  <XAxis dataKey="name" />
                                  <YAxis />
                                  <Tooltip formatter={(value) => `${value}%`} />
                                  <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                                    {[
                                      { name: 'Low', value: selectedStudent.predictions[0].probability_low || 0, color: '#22c55e' },
                                      { name: 'Med', value: selectedStudent.predictions[0].probability_medium || 0, color: '#eab308' },
                                      { name: 'High', value: selectedStudent.predictions[0].probability_high || 0, color: '#f97316' },
                                      { name: 'Crit', value: selectedStudent.predictions[0].probability_critical || 0, color: '#ef4444' }
                                    ].map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Bar>
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          )}
                        </div>

                        {/* Right: Pie Chart */}
                        {selectedStudent.predictions[0].probability_low !== undefined && (
                          <div className="flex flex-col items-center justify-center">
                            <p className="text-sm font-semibold text-gray-700 mb-3">Risk Distribution</p>
                            <ResponsiveContainer width="100%" height={280}>
                              <PieChart>
                                <Pie
                                  data={[
                                    { name: 'Low', value: selectedStudent.predictions[0].probability_low || 0, color: '#22c55e' },
                                    { name: 'Medium', value: selectedStudent.predictions[0].probability_medium || 0, color: '#eab308' },
                                    { name: 'High', value: selectedStudent.predictions[0].probability_high || 0, color: '#f97316' },
                                    { name: 'Critical', value: selectedStudent.predictions[0].probability_critical || 0, color: '#ef4444' }
                                  ]}
                                  cx="50%"
                                  cy="50%"
                                  labelLine={false}
                                  label={({ name, value }) => `${name}: ${value}%`}
                                  outerRadius={90}
                                  fill="#8884d8"
                                  dataKey="value"
                                >
                                  {[
                                    { name: 'Low', value: selectedStudent.predictions[0].probability_low || 0, color: '#22c55e' },
                                    { name: 'Medium', value: selectedStudent.predictions[0].probability_medium || 0, color: '#eab308' },
                                    { name: 'High', value: selectedStudent.predictions[0].probability_high || 0, color: '#f97316' },
                                    { name: 'Critical', value: selectedStudent.predictions[0].probability_critical || 0, color: '#ef4444' }
                                  ].map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                  ))}
                                </Pie>
                                <Tooltip formatter={(value) => `${value}%`} />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Previous Predictions Dropdown */}
                    {selectedStudent.predictions.length > 1 && (
                      <details className="bg-gray-50 border rounded-lg">
                        <summary className="px-4 py-3 cursor-pointer font-semibold text-gray-700 hover:bg-gray-100 rounded-lg">
                          📋 View Previous Predictions ({selectedStudent.predictions.length - 1})
                        </summary>
                        <div className="p-4 space-y-3">
                          {selectedStudent.predictions.slice(1).map((pred) => (
                            <div key={pred.id} className="bg-white border rounded-lg p-4 hover:shadow-md transition">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getRiskColor(pred.risk_label)}`}>
                                    {pred.risk_label}
                                  </span>
                                  <p className="text-sm text-gray-600 mt-2">
                                    Confidence: <span className="font-semibold">{pred.confidence_score}%</span>
                                  </p>
                                </div>
                                <div className="text-right text-sm text-gray-500">
                                  {new Date(pred.prediction_date).toLocaleDateString()}
                                </div>
                              </div>
                              {pred.probability_low !== undefined && (
                                <div className="mt-3 grid grid-cols-4 gap-2 text-xs">
                                  <div className="text-center">
                                    <p className="text-gray-500">Low</p>
                                    <p className="font-semibold">{pred.probability_low}%</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-gray-500">Medium</p>
                                    <p className="font-semibold">{pred.probability_medium}%</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-gray-500">High</p>
                                    <p className="font-semibold">{pred.probability_high}%</p>
                                  </div>
                                  <div className="text-center">
                                    <p className="text-gray-500">Critical</p>
                                    <p className="font-semibold">{pred.probability_critical}%</p>
                                  </div>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No risk assessments found</p>
                )}
              </div>

              {/* Behavioral Incidents */}
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-2">⚠️ Behavioral Incidents</h2>
                {selectedStudent.incidents?.length > 0 ? (
                  <div className="space-y-3">
                    {selectedStudent.incidents.map((incident) => (
                      <div key={incident.id} className="border-l-4 border-orange-500 bg-orange-50 p-4 rounded">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-semibold text-gray-800">{incident.incident_type}</p>
                            <p className="text-sm text-gray-600 mt-1">{incident.description}</p>
                            {incident.severity && (
                              <span className={`inline-block mt-2 px-2 py-1 rounded text-xs font-semibold ${
                                incident.severity === 'High' ? 'bg-red-100 text-red-800' :
                                incident.severity === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {incident.severity}
                              </span>
                            )}
                          </div>
                          <div className="text-right text-sm text-gray-500">
                            {new Date(incident.incident_date).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No incidents recorded</p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Confirm Delete</h3>
            <p className="text-gray-600 mb-6">
              Are you sure you want to delete student <span className="font-semibold">{selectedStudent?.first_name} {selectedStudent?.last_name}</span>?
              This action cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteStudent}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition font-medium"
              >
                Delete Student
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add New Student Tab */}
      {activeTab === 'add' && (
        <AddStudentForm
          onClose={() => setActiveTab('list')}
          onSuccess={() => {
            fetchStudents();
            setActiveTab('list');
          }}
        />
      )}
    </div>
  );
};

export default Students;
