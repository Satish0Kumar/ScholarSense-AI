import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';

const glass = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(99,102,241,0.2)',
  backdropFilter: 'blur(12px)',
};

const StatCard = ({ icon, label, value, gradient, accent }) => (
  <div className="rounded-2xl p-5 flex items-center gap-4 transition-all duration-200 hover:-translate-y-1 cursor-default"
    style={{ background: gradient, border: `1px solid ${accent}` }}>
    <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
      style={{ background: 'rgba(0,0,0,0.2)' }}>{icon}</div>
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgba(255,255,255,0.6)' }}>{label}</p>
      <p className="text-3xl font-bold text-white mt-0.5">{value}</p>
    </div>
  </div>
);

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="px-3 py-2 rounded-xl text-sm text-white" style={{ background: 'rgba(15,12,41,0.95)', border: '1px solid rgba(99,102,241,0.4)' }}>
      <p className="font-semibold">{payload[0].name}</p>
      <p style={{ color: payload[0].fill }}>{payload[0].value}</p>
    </div>
  );
};

const getRiskStyle = (risk) => {
  const map = {
    Critical: { bg: 'rgba(239,68,68,0.15)', border: 'rgba(239,68,68,0.4)', color: '#fca5a5' },
    High:     { bg: 'rgba(249,115,22,0.15)', border: 'rgba(249,115,22,0.4)', color: '#fdba74' },
    Medium:   { bg: 'rgba(234,179,8,0.15)',  border: 'rgba(234,179,8,0.4)',  color: '#fde047' },
    Low:      { bg: 'rgba(34,197,94,0.15)',  border: 'rgba(34,197,94,0.4)',  color: '#86efac' },
  };
  return map[risk] || { bg: 'rgba(99,102,241,0.1)', border: 'rgba(99,102,241,0.3)', color: '#a5b4fc' };
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [recentActivity, setRecentActivity] = useState({ predictions: [], incidents: [], communications: [] });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => { fetchDashboardData(); }, []);

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
      const highRiskStudents = (predictionsRes.data || []).map(item => ({
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
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <svg className="animate-spin w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <p className="text-indigo-300 text-sm">Loading dashboard...</p>
      </div>
    </div>
  );

  const riskDist = analytics?.risk_distribution || {};
  const totalRisk = Object.values(riskDist).reduce((a, b) => a + b, 0);
  const pieData = [
    { name: 'Low',      value: riskDist.Low      || 0, color: '#22c55e' },
    { name: 'Medium',   value: riskDist.Medium    || 0, color: '#eab308' },
    { name: 'High',     value: riskDist.High      || 0, color: '#f97316' },
    { name: 'Critical', value: riskDist.Critical  || 0, color: '#ef4444' },
  ];

  const riskCards = [
    { label: 'Low Risk',      key: 'Low',      grad: 'rgba(34,197,94,0.12)',   acc: 'rgba(34,197,94,0.3)',   val: riskDist.Low      || 0 },
    { label: 'Medium Risk',   key: 'Medium',   grad: 'rgba(234,179,8,0.12)',   acc: 'rgba(234,179,8,0.3)',   val: riskDist.Medium   || 0 },
    { label: 'High Risk',     key: 'High',     grad: 'rgba(249,115,22,0.12)',  acc: 'rgba(249,115,22,0.3)',  val: riskDist.High     || 0 },
    { label: 'Critical Risk', key: 'Critical', grad: 'rgba(239,68,68,0.12)',   acc: 'rgba(239,68,68,0.3)',   val: riskDist.Critical || 0 },
  ];

  const quickActions = [
    { icon: '👥', label: 'View Students',   path: '/students',      grad: 'rgba(99,102,241,0.15)',  acc: 'rgba(99,102,241,0.3)'  },
    { icon: '📚', label: 'Academics',       path: '/academics',     grad: 'rgba(34,197,94,0.12)',   acc: 'rgba(34,197,94,0.3)'   },
    { icon: '🎯', label: 'Run Predictions', path: '/risk-analytics',grad: 'rgba(139,92,246,0.15)',  acc: 'rgba(139,92,246,0.3)'  },
    { icon: '📬', label: 'Send Alerts',     path: '/alerts',        grad: 'rgba(249,115,22,0.12)',  acc: 'rgba(249,115,22,0.3)'  },
  ];

  return (
    <div className="space-y-6">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(165,180,252,0.6)' }}>
            AI-Powered Academic Intelligence Overview
          </p>
        </div>
        <button onClick={fetchDashboardData}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-indigo-300 hover:text-white transition-all duration-200"
          style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.3)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.15)'}>
          🔄 Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <StatCard icon="👨‍🎓" label="Total Students"   value={stats?.total || 0}
          gradient="linear-gradient(135deg, rgba(99,102,241,0.3), rgba(99,102,241,0.1))"
          accent="rgba(99,102,241,0.4)" />
        <StatCard icon="⚠️"  label="High Risk"        value={stats?.highRisk || 0}
          gradient="linear-gradient(135deg, rgba(239,68,68,0.3), rgba(239,68,68,0.1))"
          accent="rgba(239,68,68,0.4)" />
        <StatCard icon="📊"  label="Average GPA"      value={stats?.avgGpa || '0.0'}
          gradient="linear-gradient(135deg, rgba(34,197,94,0.3), rgba(34,197,94,0.1))"
          accent="rgba(34,197,94,0.4)" />
        <StatCard icon="✅"  label="Attendance Rate"  value={`${stats?.attendanceRate || 0}%`}
          gradient="linear-gradient(135deg, rgba(6,182,212,0.3), rgba(6,182,212,0.1))"
          accent="rgba(6,182,212,0.4)" />
      </div>

      {/* Risk Distribution */}
      <div className="rounded-2xl p-6" style={glass}>
        <h2 className="text-lg font-bold text-white mb-5">Risk Distribution</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100}
                dataKey="value" paddingAngle={3}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(v) => <span style={{ color: 'rgba(165,180,252,0.8)', fontSize: 12 }}>{v}</span>} />
            </PieChart>
          </ResponsiveContainer>

          <div className="grid grid-cols-2 gap-3 content-center">
            {riskCards.map(r => (
              <div key={r.key} className="rounded-xl p-4 text-center"
                style={{ background: r.grad, border: `1px solid ${r.acc}` }}>
                <p className="text-xs text-indigo-300 mb-1">{r.label}</p>
                <p className="text-3xl font-bold text-white">{r.val}</p>
                <p className="text-xs mt-1" style={{ color: 'rgba(165,180,252,0.5)' }}>
                  {totalRisk > 0 ? ((r.val / totalRisk) * 100).toFixed(1) : 0}%
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Grade-wise Bar Chart */}
      {analytics?.grade_stats?.length > 0 && (
        <div className="rounded-2xl p-6" style={glass}>
          <h2 className="text-lg font-bold text-white mb-5">Grade-wise Performance</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={analytics.grade_stats}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.15)" />
              <XAxis dataKey="grade" stroke="rgba(165,180,252,0.5)" tick={{ fill: 'rgba(165,180,252,0.7)', fontSize: 12 }} />
              <YAxis yAxisId="left"  stroke="rgba(99,102,241,0.4)"  tick={{ fill: 'rgba(165,180,252,0.7)', fontSize: 12 }} />
              <YAxis yAxisId="right" orientation="right" stroke="rgba(34,197,94,0.4)" tick={{ fill: 'rgba(165,180,252,0.7)', fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend formatter={(v) => <span style={{ color: 'rgba(165,180,252,0.8)', fontSize: 12 }}>{v}</span>} />
              <Bar yAxisId="left"  dataKey="total"   name="Total Students" fill="#6366f1" radius={[4,4,0,0]} />
              <Bar yAxisId="right" dataKey="avg_gpa" name="Average GPA"    fill="#22c55e" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Activity panels */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* High Risk */}
        <div className="rounded-2xl p-5" style={glass}>
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <span>⚠️</span> High Risk Students
          </h3>
          {recentActivity.predictions.length > 0 ? (
            <div className="space-y-2">
              {recentActivity.predictions.map((s, i) => {
                const rs = getRiskStyle(s.risk_label);
                return (
                  <div key={i} className="flex items-center gap-3 p-2 rounded-xl"
                    style={{ borderLeft: `3px solid ${rs.color}`, background: rs.bg }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-semibold truncate">{s.first_name} {s.last_name}</p>
                      <p className="text-xs mt-0.5" style={{ color: 'rgba(165,180,252,0.6)' }}>Grade {s.grade}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                      style={{ background: rs.bg, border: `1px solid ${rs.border}`, color: rs.color }}>
                      {s.risk_label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : <p className="text-xs" style={{ color: 'rgba(165,180,252,0.5)' }}>No high-risk students</p>}
        </div>

        {/* Incidents */}
        <div className="rounded-2xl p-5" style={glass}>
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <span>📋</span> Recent Incidents
          </h3>
          {recentActivity.incidents.length > 0 ? (
            <div className="space-y-2">
              {recentActivity.incidents.slice(0, 5).map((inc) => (
                <div key={inc.id} className="p-2 rounded-xl"
                  style={{ borderLeft: '3px solid rgba(249,115,22,0.7)', background: 'rgba(249,115,22,0.08)' }}>
                  <p className="text-white text-xs font-semibold">{inc.incident_type}</p>
                  <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'rgba(165,180,252,0.6)' }}>{inc.description}</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(165,180,252,0.4)' }}>
                    {new Date(inc.incident_date).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : <p className="text-xs" style={{ color: 'rgba(165,180,252,0.5)' }}>No recent incidents</p>}
        </div>

        {/* Communications */}
        <div className="rounded-2xl p-5" style={glass}>
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <span>📧</span> Recent Communications
          </h3>
          {recentActivity.communications.length > 0 ? (
            <div className="space-y-2">
              {recentActivity.communications.slice(0, 5).map((c) => (
                <div key={c.id} className="p-2 rounded-xl"
                  style={{ borderLeft: '3px solid rgba(99,102,241,0.7)', background: 'rgba(99,102,241,0.08)' }}>
                  <p className="text-white text-xs font-semibold">{c.communication_type}</p>
                  <p className="text-xs mt-0.5 line-clamp-1" style={{ color: 'rgba(165,180,252,0.6)' }}>{c.subject}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-1.5 py-0.5 rounded-full"
                      style={{
                        background: c.status === 'sent' ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)',
                        color: c.status === 'sent' ? '#86efac' : '#fca5a5',
                        border: `1px solid ${c.status === 'sent' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`
                      }}>
                      {c.status}
                    </span>
                    <span className="text-xs" style={{ color: 'rgba(165,180,252,0.4)' }}>
                      {new Date(c.sent_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="text-xs" style={{ color: 'rgba(165,180,252,0.5)' }}>No recent communications</p>}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="rounded-2xl p-6" style={glass}>
        <h2 className="text-lg font-bold text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {quickActions.map(a => (
            <button key={a.path} onClick={() => navigate(a.path)}
              className="rounded-xl p-4 text-center transition-all duration-200 hover:-translate-y-1"
              style={{ background: a.grad, border: `1px solid ${a.acc}` }}
              onMouseEnter={e => e.currentTarget.style.background = a.acc.replace('0.3', '0.25')}
              onMouseLeave={e => e.currentTarget.style.background = a.grad}>
              <div className="text-3xl mb-2">{a.icon}</div>
              <p className="text-sm font-semibold text-white">{a.label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
