import { useState, useEffect } from 'react';
import api from '../utils/api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recentActivity, setRecentActivity] = useState({
    predictions: [],
    incidents: [],
    communications: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [studentsRes, analyticsRes, predictionsRes, incidentsRes, commsRes] = await Promise.all([
        api.get('/students'),
        api.get('/analytics/school-overview'),
        api.get('/predictions/high-risk').catch(() => ({ data: [] })),
        api.get('/incidents?limit=5').catch(() => ({ data: { incidents: [] } })),
        api.get('/communications/history?limit=5').catch(() => ({ data: { communications: [] } }))
      ]);

      const students = studentsRes.data.students || studentsRes.data || [];
      const analyticsData = analyticsRes.data.data || {};
      const highRiskData = predictionsRes.data || [];
      const highRiskStudents = highRiskData.map(item => ({
        ...item.student,
        risk_label: item.prediction?.risk_label,
        confidence_score: item.prediction?.confidence_score
      }));

      setStats({
        total: analyticsData.total_active || students.length,
        highRisk: students.filter(s => s.risk_label === 'High' || s.risk_label === 'Critical').length,
        avgGpa: analyticsData.avg_gpa || 0,
        attendanceRate: analyticsData.avg_attendance || 0
      });

      setAnalytics(analyticsData);

      setRecentActivity({
        predictions: highRiskStudents.slice(0, 5),
        incidents: incidentsRes.data.incidents || incidentsRes.data || [],
        communications: commsRes.data.communications || commsRes.data || []
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
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

  if (loading) return <div className="text-center py-8">Loading dashboard...</div>;

  const riskDist = analytics?.risk_distribution || {};
  const totalRisk = Object.values(riskDist).reduce((a, b) => a + b, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600">Welcome to ScholarSense - AI-Powered Academic Intelligence System</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Total Students</h3>
              <p className="text-3xl font-bold mt-2">{stats?.total || 0}</p>
            </div>
            <div className="text-4xl">👨‍🎓</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">High Risk Students</h3>
              <p className="text-3xl font-bold mt-2 text-red-600">{stats?.highRisk || 0}</p>
            </div>
            <div className="text-4xl">⚠️</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Average GPA</h3>
              <p className="text-3xl font-bold mt-2">{stats?.avgGpa || '0.0'}</p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-gray-500 text-sm font-medium">Attendance Rate</h3>
              <p className="text-3xl font-bold mt-2 text-green-600">{stats?.attendanceRate || 0}%</p>
            </div>
            <div className="text-4xl">✅</div>
          </div>
        </div>
      </div>

      {/* Risk Distribution with Pie Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-bold mb-4">Risk Distribution</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <div className="flex justify-center items-center">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Low Risk', value: riskDist.Low || 0, color: '#22c55e' },
                    { name: 'Medium Risk', value: riskDist.Medium || 0, color: '#eab308' },
                    { name: 'High Risk', value: riskDist.High || 0, color: '#f97316' },
                    { name: 'Critical Risk', value: riskDist.Critical || 0, color: '#ef4444' }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[
                    { name: 'Low Risk', value: riskDist.Low || 0, color: '#22c55e' },
                    { name: 'Medium Risk', value: riskDist.Medium || 0, color: '#eab308' },
                    { name: 'High Risk', value: riskDist.High || 0, color: '#f97316' },
                    { name: 'Critical Risk', value: riskDist.Critical || 0, color: '#ef4444' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Low Risk</p>
              <p className="text-3xl font-bold text-green-700">{riskDist.Low || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                {totalRisk > 0 ? ((riskDist.Low || 0) / totalRisk * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Medium Risk</p>
              <p className="text-3xl font-bold text-yellow-700">{riskDist.Medium || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                {totalRisk > 0 ? ((riskDist.Medium || 0) / totalRisk * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="bg-orange-50 border-2 border-orange-300 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">High Risk</p>
              <p className="text-3xl font-bold text-orange-700">{riskDist.High || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                {totalRisk > 0 ? ((riskDist.High || 0) / totalRisk * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 text-center">
              <p className="text-sm text-gray-600 mb-1">Critical Risk</p>
              <p className="text-3xl font-bold text-red-700">{riskDist.Critical || 0}</p>
              <p className="text-xs text-gray-500 mt-1">
                {totalRisk > 0 ? ((riskDist.Critical || 0) / totalRisk * 100).toFixed(1) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Grade Statistics with Bar Chart */}
      {analytics?.grade_stats && analytics.grade_stats.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4">Grade-wise Performance</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analytics.grade_stats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="grade" label={{ value: 'Grade', position: 'insideBottom', offset: -5 }} />
              <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" label={{ value: 'Students', angle: -90, position: 'insideLeft' }} />
              <YAxis yAxisId="right" orientation="right" stroke="#10b981" label={{ value: 'Avg GPA', angle: 90, position: 'insideRight' }} />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="total" fill="#3b82f6" name="Total Students" />
              <Bar yAxisId="right" dataKey="avg_gpa" fill="#10b981" name="Average GPA" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* High Risk Students */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>⚠️</span> High Risk Students
          </h2>
          {recentActivity.predictions.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.predictions.slice(0, 5).map((student, idx) => (
                <div key={idx} className="border-l-4 border-red-500 pl-3 py-2">
                  <p className="font-semibold text-sm">{student.first_name} {student.last_name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${getRiskColor(student.risk_label)}`}>
                      {student.risk_label}
                    </span>
                    <span className="text-xs text-gray-500">Grade {student.grade}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No high-risk students</p>
          )}
        </div>

        {/* Recent Incidents */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>📋</span> Recent Incidents
          </h2>
          {recentActivity.incidents.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.incidents.slice(0, 5).map((incident) => (
                <div key={incident.id} className="border-l-4 border-orange-500 pl-3 py-2">
                  <p className="font-semibold text-sm">{incident.incident_type}</p>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{incident.description}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(incident.incident_date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No recent incidents</p>
          )}
        </div>

        {/* Recent Communications */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span>📧</span> Recent Communications
          </h2>
          {recentActivity.communications.length > 0 ? (
            <div className="space-y-3">
              {recentActivity.communications.slice(0, 5).map((comm) => (
                <div key={comm.id} className="border-l-4 border-blue-500 pl-3 py-2">
                  <p className="font-semibold text-sm">{comm.communication_type}</p>
                  <p className="text-xs text-gray-600 mt-1 line-clamp-2">{comm.subject}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      comm.status === 'sent' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {comm.status}
                    </span>
                    <span className="text-xs text-gray-500">
                      {new Date(comm.sent_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-gray-500">No recent communications</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-xl font-bold mb-4 text-gray-800">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={() => window.location.href = '/students'}
            className="bg-blue-50 hover:bg-blue-100 border-2 border-blue-200 rounded-lg p-4 text-center transition"
          >
            <div className="text-3xl mb-2">👥</div>
            <p className="font-semibold text-gray-800">View Students</p>
          </button>
          <button
            onClick={() => window.location.href = '/academics'}
            className="bg-green-50 hover:bg-green-100 border-2 border-green-200 rounded-lg p-4 text-center transition"
          >
            <div className="text-3xl mb-2">📚</div>
            <p className="font-semibold text-gray-800">Mark Attendance</p>
          </button>
          <button
            onClick={() => window.location.href = '/risk-analytics'}
            className="bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 rounded-lg p-4 text-center transition"
          >
            <div className="text-3xl mb-2">🎯</div>
            <p className="font-semibold text-gray-800">Run Predictions</p>
          </button>
          <button
            onClick={() => window.location.href = '/alerts'}
            className="bg-orange-50 hover:bg-orange-100 border-2 border-orange-200 rounded-lg p-4 text-center transition"
          >
            <div className="text-3xl mb-2">📬</div>
            <p className="font-semibold text-gray-800">Send Alerts</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
