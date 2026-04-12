import { useState, useEffect } from 'react';
import api from '../utils/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const RiskAnalytics = () => {
  const [activeTab, setActiveTab] = useState('predictions');

  const tabs = [
    { id: 'predictions', label: 'Risk Predictions' },
    { id: 'batch', label: 'Batch Analysis' },
    { id: 'analytics', label: 'Analytics' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">Risk & Analytics</h1>
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
          {activeTab === 'predictions' && <PredictionsTab />}
          {activeTab === 'batch' && <BatchTab />}
          {activeTab === 'analytics' && <AnalyticsTab />}
        </div>
      </div>
    </div>
  );
};

// ============================================
// RISK PREDICTIONS TAB
// ============================================
const PredictionsTab = () => {
  const [students, setStudents] = useState([]);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [student, setStudent] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loading, setLoading] = useState(false);
  const [predicting, setPredicting] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await api.get('/students');
      setStudents(response.data.students || response.data);
    } catch (error) {
      console.error('Failed to fetch students:', error);
    }
  };

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

  const handleStudentSelect = async (studentId) => {
    if (!studentId) return;
    setLoading(true);
    try {
      const selectedStudent = students.find(s => s.student_id === studentId);
      if (!selectedStudent) {
        alert('Student not found');
        return;
      }
      
      const response = await api.get(`/students/${selectedStudent.id}`);
      setStudent(response.data);
      // Fetch latest prediction
      try {
        const predResponse = await api.get(`/students/${selectedStudent.id}/predictions/latest`);
        setPrediction(predResponse.data);
      } catch (err) {
        setPrediction(null);
      }
    } catch (error) {
      alert('Failed to load student');
      setStudent(null);
      setPrediction(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = async () => {
    if (!student) return;
    setPredicting(true);
    try {
      const response = await api.post(`/students/${student.id}/predict`);
      setPrediction(response.data);
      alert('Prediction completed successfully!');
    } catch (error) {
      alert('Prediction failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setPredicting(false);
    }
  };

  const getRiskColor = (risk) => {
    switch(risk) {
      case 'Critical': return 'bg-red-100 text-red-800 border-red-300';
      case 'High': return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'Medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Low': return 'bg-green-100 text-green-800 border-green-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
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
            handleStudentSelect(e.target.value);
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
              setStudent(null);
              setPrediction(null);
            }}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
          >
            Clear Filters
          </button>
        )}
      </div>

      {loading && <div className="text-center py-8">Loading student...</div>}

      {!loading && !student && (
        <div className="bg-white rounded-lg shadow p-6">
          <p className="text-center text-gray-500 py-8">
            Please select a student using the filters above to view their risk prediction
          </p>
        </div>
      )}

      {student && (
        <div className="space-y-4">
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4">Student Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-500">Name</p>
                <p className="font-semibold">{student.first_name} {student.last_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Student ID</p>
                <p className="font-semibold">{student.student_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Grade</p>
                <p className="font-semibold">{student.grade}{student.section ? `-${student.section}` : ''}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Age</p>
                <p className="font-semibold">{student.age || 'N/A'}</p>
              </div>
            </div>
          </div>

          {prediction ? (
            <div className="bg-white border-2 rounded-lg p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold">Latest Risk Assessment</h3>
                <button
                  onClick={handlePredict}
                  disabled={predicting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {predicting ? 'Running...' : 'Run New Prediction'}
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: Risk Details */}
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <span className={`px-6 py-3 rounded-lg text-xl font-bold border-2 ${getRiskColor(prediction.risk_label)}`}>
                      {prediction.risk_label}
                    </span>
                    <div>
                      <p className="text-sm text-gray-500">Prediction Date</p>
                      <p className="font-semibold">{new Date(prediction.prediction_date).toLocaleDateString()}</p>
                    </div>
                  </div>
                  
                  {/* Confidence Score */}
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Confidence Score</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-4">
                        <div 
                          className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                          style={{ width: `${prediction.confidence_score}%` }}
                        ></div>
                      </div>
                      <span className="text-xl font-bold text-blue-600">{prediction.confidence_score}%</span>
                    </div>
                  </div>

                  {/* Probability Distribution Bar Chart */}
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-gray-700 mb-3">Risk Probability Distribution</p>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={[
                        { name: 'Low', value: prediction.probability_low || 0, color: '#22c55e' },
                        { name: 'Medium', value: prediction.probability_medium || 0, color: '#eab308' },
                        { name: 'High', value: prediction.probability_high || 0, color: '#f97316' },
                        { name: 'Critical', value: prediction.probability_critical || 0, color: '#ef4444' }
                      ]}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis label={{ value: 'Probability (%)', angle: -90, position: 'insideLeft' }} />
                        <Tooltip formatter={(value) => `${value}%`} />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                          {[
                            { name: 'Low', value: prediction.probability_low || 0, color: '#22c55e' },
                            { name: 'Medium', value: prediction.probability_medium || 0, color: '#eab308' },
                            { name: 'High', value: prediction.probability_high || 0, color: '#f97316' },
                            { name: 'Critical', value: prediction.probability_critical || 0, color: '#ef4444' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Right: Pie Chart */}
                <div className="flex flex-col items-center justify-center">
                  <p className="text-sm font-semibold text-gray-700 mb-3">Risk Distribution</p>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={[
                          { name: 'Low Risk', value: prediction.probability_low || 0, color: '#22c55e' },
                          { name: 'Medium Risk', value: prediction.probability_medium || 0, color: '#eab308' },
                          { name: 'High Risk', value: prediction.probability_high || 0, color: '#f97316' },
                          { name: 'Critical Risk', value: prediction.probability_critical || 0, color: '#ef4444' }
                        ]}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}%`}
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {[
                          { name: 'Low Risk', value: prediction.probability_low || 0, color: '#22c55e' },
                          { name: 'Medium Risk', value: prediction.probability_medium || 0, color: '#eab308' },
                          { name: 'High Risk', value: prediction.probability_high || 0, color: '#f97316' },
                          { name: 'Critical Risk', value: prediction.probability_critical || 0, color: '#ef4444' }
                        ].map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-6 text-center">
              <p className="text-yellow-800 mb-4">No prediction found for this student</p>
              <button
                onClick={handlePredict}
                disabled={predicting}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {predicting ? 'Running Prediction...' : 'Run Prediction'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// BATCH ANALYSIS TAB
// ============================================
const BatchTab = () => {
  const [grade, setGrade] = useState('');
  const [section, setSection] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const response = await api.get('/batch/summary');
      const data = response.data;
      if (data.status === 'success') {
        const summaryData = data.data || {};
        const riskSummary = summaryData.risk_summary || {};
        setSummary({
          total_students: summaryData.total_active || 0,
          low_risk: riskSummary.Low || 0,
          medium_risk: riskSummary.Medium || 0,
          high_risk: riskSummary.High || 0,
          critical_risk: riskSummary.Critical || 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch summary:', error);
    }
  };

  const handleRunBatch = async () => {
    setLoading(true);
    try {
      const response = await api.post('/batch/run', {
        grade: grade ? parseInt(grade) : null,
        section: section || null
      });
      const data = response.data;
      if (data.status === 'success') {
        const batchData = data.data || {};
        const summary = batchData.summary || {};
        const predictions = batchData.results || [];
        setResults({
          total_processed: summary.total || 0,
          successful: summary.success || 0,
          failed: summary.failed || 0,
          duration_seconds: 0,
          predictions: predictions
        });
        fetchSummary();
        alert(`Batch prediction completed! ${summary.success || 0} students processed successfully.`);
      } else {
        alert('Batch prediction failed: ' + (data.message || 'Unknown error'));
      }
    } catch (error) {
      alert('Batch prediction failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const getRiskColor = (risk) => {
    switch(risk) {
      case 'Critical': return 'bg-red-100 text-red-800';
      case 'High': return 'bg-orange-100 text-orange-800';
      case 'Medium': return 'bg-yellow-100 text-yellow-800';
      case 'Low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-300 rounded-lg p-4">
        <p className="text-blue-800">Run risk predictions for multiple students at once. Filter by grade and section or run for all students.</p>
      </div>

      <div className="flex gap-4 items-end">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Grade (Optional)</label>
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Grades</option>
            {[6, 7, 8, 9, 10].map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Section (Optional)</label>
          <select
            value={section}
            onChange={(e) => setSection(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Sections</option>
            {['A', 'B', 'C', 'D'].map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <button
          onClick={handleRunBatch}
          disabled={loading}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Running...' : 'Run Batch Prediction'}
        </button>
      </div>

      {summary && (
        <div>
          <h3 className="text-lg font-semibold mb-3">Current Risk Summary</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white border rounded-lg p-4">
                <p className="text-sm text-gray-500">Total Students</p>
                <p className="text-3xl font-bold">{summary.total_students || 0}</p>
              </div>
              <div className="bg-green-50 border border-green-300 rounded-lg p-4">
                <p className="text-sm text-gray-600">Low Risk</p>
                <p className="text-3xl font-bold text-green-700">{summary.low_risk || 0}</p>
              </div>
              <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4">
                <p className="text-sm text-gray-600">Medium Risk</p>
                <p className="text-3xl font-bold text-yellow-700">{summary.medium_risk || 0}</p>
              </div>
              <div className="bg-red-50 border border-red-300 rounded-lg p-4">
                <p className="text-sm text-gray-600">High/Critical</p>
                <p className="text-3xl font-bold text-red-700">{(summary.high_risk || 0) + (summary.critical_risk || 0)}</p>
              </div>
            </div>
            
            {/* Pie Chart */}
            <div className="bg-white border rounded-lg p-4 flex items-center justify-center">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Low Risk', value: summary.low_risk || 0, color: '#22c55e' },
                      { name: 'Medium Risk', value: summary.medium_risk || 0, color: '#eab308' },
                      { name: 'High Risk', value: summary.high_risk || 0, color: '#f97316' },
                      { name: 'Critical Risk', value: summary.critical_risk || 0, color: '#ef4444' }
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
                      { name: 'Low Risk', value: summary.low_risk || 0, color: '#22c55e' },
                      { name: 'Medium Risk', value: summary.medium_risk || 0, color: '#eab308' },
                      { name: 'High Risk', value: summary.high_risk || 0, color: '#f97316' },
                      { name: 'Critical Risk', value: summary.critical_risk || 0, color: '#ef4444' }
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

      {results && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="text-xl font-bold mb-4">Batch Results</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">Processed</p>
              <p className="text-2xl font-bold">{results.total_processed}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Successful</p>
              <p className="text-2xl font-bold text-green-600">{results.successful}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Failed</p>
              <p className="text-2xl font-bold text-red-600">{results.failed}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Duration</p>
              <p className="text-2xl font-bold">{results.duration_seconds}s</p>
            </div>
          </div>
                  {results.predictions && results.predictions.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border p-3 text-left">Student ID</th>
                    <th className="border p-3 text-left">Name</th>
                    <th className="border p-3 text-left">Grade</th>
                    <th className="border p-3 text-left">Risk Level</th>
                    <th className="border p-3 text-left">Confidence</th>
                    <th className="border p-3 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {results.predictions.map((pred, idx) => (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="border p-3">{pred.student_code}</td>
                      <td className="border p-3">{pred.student_name}</td>
                      <td className="border p-3">{pred.grade}</td>
                      <td className="border p-3">
                        {pred.status === 'success' ? (
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getRiskColor(pred.risk_label)}`}>
                            {pred.risk_label}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-sm">-</span>
                        )}
                      </td>
                      <td className="border p-3 font-semibold">
                        {pred.status === 'success' ? `${pred.confidence_score}%` : '-'}
                      </td>
                      <td className="border p-3">
                        {pred.status === 'success' ? (
                          <span className="px-2 py-1 rounded text-xs bg-green-100 text-green-800">Success</span>
                        ) : pred.status === 'skipped' ? (
                          <span className="px-2 py-1 rounded text-xs bg-yellow-100 text-yellow-800" title={pred.reason}>Skipped</span>
                        ) : (
                          <span className="px-2 py-1 rounded text-xs bg-red-100 text-red-800" title={pred.reason}>Failed</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================
// ANALYTICS TAB
// ============================================
const AnalyticsTab = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await api.get('/analytics/school-overview');
      setAnalytics(response.data.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center py-8">Loading analytics...</div>;
  if (!analytics) return <div className="text-center py-8 text-gray-500">No data available</div>;

  const riskDist = analytics.risk_distribution || {};
  const totalRisk = Object.values(riskDist).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Students</p>
          <p className="text-3xl font-bold">{analytics.total_active}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Average GPA</p>
          <p className="text-3xl font-bold">{analytics.avg_gpa}</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Attendance Rate</p>
          <p className="text-3xl font-bold">{analytics.avg_attendance}%</p>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <p className="text-sm text-gray-500">Total Predictions</p>
          <p className="text-3xl font-bold">{analytics.total_predictions}</p>
        </div>
      </div>

      {/* Risk Distribution */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">Risk Distribution</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar Chart */}
          <div>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={[
                { name: 'Low', value: riskDist.Low || 0, color: '#22c55e' },
                { name: 'Medium', value: riskDist.Medium || 0, color: '#eab308' },
                { name: 'High', value: riskDist.High || 0, color: '#f97316' },
                { name: 'Critical', value: riskDist.Critical || 0, color: '#ef4444' }
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis label={{ value: 'Students', angle: -90, position: 'insideLeft' }} />
                <Tooltip />
                <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                  {[
                    { name: 'Low', value: riskDist.Low || 0, color: '#22c55e' },
                    { name: 'Medium', value: riskDist.Medium || 0, color: '#eab308' },
                    { name: 'High', value: riskDist.High || 0, color: '#f97316' },
                    { name: 'Critical', value: riskDist.Critical || 0, color: '#ef4444' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-300 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">Low</p>
              <p className="text-3xl font-bold text-green-700">{riskDist.Low || 0}</p>
              <p className="text-xs text-gray-500">{totalRisk > 0 ? ((riskDist.Low || 0) / totalRisk * 100).toFixed(1) : 0}%</p>
            </div>
            <div className="bg-yellow-50 border border-yellow-300 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">Medium</p>
              <p className="text-3xl font-bold text-yellow-700">{riskDist.Medium || 0}</p>
              <p className="text-xs text-gray-500">{totalRisk > 0 ? ((riskDist.Medium || 0) / totalRisk * 100).toFixed(1) : 0}%</p>
            </div>
            <div className="bg-orange-50 border border-orange-300 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">High</p>
              <p className="text-3xl font-bold text-orange-700">{riskDist.High || 0}</p>
              <p className="text-xs text-gray-500">{totalRisk > 0 ? ((riskDist.High || 0) / totalRisk * 100).toFixed(1) : 0}%</p>
            </div>
            <div className="bg-red-50 border border-red-300 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600">Critical</p>
              <p className="text-3xl font-bold text-red-700">{riskDist.Critical || 0}</p>
              <p className="text-xs text-gray-500">{totalRisk > 0 ? ((riskDist.Critical || 0) / totalRisk * 100).toFixed(1) : 0}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grade Statistics */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">Grade-wise Statistics</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={analytics.grade_stats || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="grade" label={{ value: 'Grade', position: 'insideBottom', offset: -5 }} />
            <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" label={{ value: 'Students', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" stroke="#10b981" label={{ value: 'Avg GPA', angle: 90, position: 'insideRight' }} />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="total" fill="#3b82f6" name="Total Students" radius={[8, 8, 0, 0]} />
            <Bar yAxisId="right" dataKey="avg_gpa" fill="#10b981" name="Average GPA" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Section Statistics */}
      <div className="bg-white border rounded-lg p-6">
        <h3 className="text-xl font-bold mb-4">Section-wise Performance</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="border p-3 text-left">Grade</th>
                <th className="border p-3 text-left">Section</th>
                <th className="border p-3 text-left">Students</th>
                <th className="border p-3 text-left">Avg GPA</th>
                <th className="border p-3 text-left">At Risk</th>
              </tr>
            </thead>
            <tbody>
              {analytics.section_stats?.map((stat, idx) => (
                <tr key={idx} className="hover:bg-gray-50">
                  <td className="border p-3">{stat.grade}</td>
                  <td className="border p-3 font-semibold">{stat.section}</td>
                  <td className="border p-3">{stat.total}</td>
                  <td className="border p-3">{stat.avg_gpa}</td>
                  <td className="border p-3">
                    <span className={`px-2 py-1 rounded text-sm font-semibold ${
                      stat.at_risk_count > 0 ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                    }`}>
                      {stat.at_risk_count}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default RiskAnalytics;
