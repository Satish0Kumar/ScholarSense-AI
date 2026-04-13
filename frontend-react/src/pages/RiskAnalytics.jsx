import { useState, useEffect } from 'react';
import api from '../utils/api';
import {
  PieChart, Pie, Cell,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer
} from 'recharts';

/* ─────────────────────────────────────────
   Shared design tokens  (dark-glass theme)
───────────────────────────────────────── */
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
  fontSize: '0.68rem',
  fontWeight: 600,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'rgba(165,180,252,0.7)',
  marginBottom: '0.35rem',
};

/* ─── Reusable micro-components ─── */
const Spinner = ({ text = 'Loading...' }) => (
  <div className="flex items-center justify-center py-16 gap-3">
    <svg className="animate-spin w-7 h-7 text-indigo-400" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
    </svg>
    <p className="text-indigo-300 text-sm">{text}</p>
  </div>
);

const EmptyState = ({ icon, message }) => (
  <div className="flex flex-col items-center justify-center py-14 gap-3">
    <span className="text-4xl">{icon}</span>
    <p className="text-sm" style={{ color: 'rgba(165,180,252,0.5)' }}>{message}</p>
  </div>
);

const StyledSelect = ({ label, value, onChange, children, className = '' }) => (
  <div className={className}>
    {label && <label style={labelStyle}>{label}</label>}
    <select value={value} onChange={onChange}
      className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
      style={inputStyle}>
      {children}
    </select>
  </div>
);

const chartTooltipStyle = {
  background: 'rgba(15,12,41,0.95)',
  border: '1px solid rgba(99,102,241,0.4)',
  borderRadius: 12,
  color: '#fff',
  fontSize: 12,
};

const getRiskStyle = risk => ({
  Critical: { bg:'rgba(239,68,68,0.15)',  border:'rgba(239,68,68,0.4)',  color:'#fca5a5' },
  High:     { bg:'rgba(249,115,22,0.15)', border:'rgba(249,115,22,0.4)', color:'#fdba74' },
  Medium:   { bg:'rgba(234,179,8,0.15)',  border:'rgba(234,179,8,0.4)',  color:'#fde047' },
  Low:      { bg:'rgba(34,197,94,0.15)',  border:'rgba(34,197,94,0.4)',  color:'#86efac' },
}[risk] || { bg:'rgba(99,102,241,0.1)', border:'rgba(99,102,241,0.3)', color:'#a5b4fc' });

/* ═══════════════════════════════════════════
   ROOT COMPONENT
═══════════════════════════════════════════ */
const RiskAnalytics = () => {
  const [activeTab, setActiveTab] = useState('predictions');

  const tabs = [
    { id: 'predictions', icon: '🎯', label: 'Risk Predictions' },
    { id: 'batch',       icon: '⚡', label: 'Batch Analysis' },
    { id: 'analytics',   icon: '📊', label: 'Analytics' },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Risk &amp; Analytics</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(165,180,252,0.6)' }}>
            Predict, analyse and monitor student risk levels
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-1 p-1 rounded-2xl" style={glass}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            style={activeTab === tab.id
              ? { background:'linear-gradient(135deg,rgba(99,102,241,0.5),rgba(139,92,246,0.4))', color:'#fff', border:'1px solid rgba(99,102,241,0.5)' }
              : { color:'rgba(165,180,252,0.6)', border:'1px solid transparent' }
            }>
            <span>{tab.icon}</span>
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tab Body */}
      <div className="rounded-2xl p-6" style={glass}>
        {activeTab === 'predictions' && <PredictionsTab />}
        {activeTab === 'batch'       && <BatchTab />}
        {activeTab === 'analytics'   && <AnalyticsTab />}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════
   RISK PREDICTIONS TAB
═══════════════════════════════════════════ */
const PredictionsTab = () => {
  const [students, setStudents]           = useState([]);
  const [selectedGrade, setSelectedGrade] = useState('');
  const [selectedSection, setSelectedSection] = useState('');
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [student, setStudent]             = useState(null);
  const [prediction, setPrediction]       = useState(null);
  const [loading, setLoading]             = useState(false);
  const [predicting, setPredicting]       = useState(false);

  useEffect(() => { fetchStudents(); }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get('/students');
      setStudents(res.data.students || res.data);
    } catch (err) { console.error(err); }
  };

  const grades   = [...new Set(students.map(s => s.grade).filter(Boolean))].sort((a,b) => a - b);
  const sections = [...new Set(students.map(s => s.section).filter(Boolean))].sort();

  const filteredStudentIds = students
    .filter(s => {
      const mg = !selectedGrade   || s.grade?.toString()  === selectedGrade;
      const ms = !selectedSection || s.section?.toUpperCase() === selectedSection.toUpperCase();
      return mg && ms;
    })
    .map(s => s.student_id).filter(Boolean).sort();

  const handleStudentSelect = async studentId => {
    if (!studentId) return;
    setLoading(true);
    try {
      const found = students.find(s => s.student_id === studentId);
      if (!found) { alert('Student not found'); return; }
      const res = await api.get(`/students/${found.id}`);
      setStudent(res.data);
      try {
        const predRes = await api.get(`/students/${found.id}/predictions/latest`);
        setPrediction(predRes.data);
      } catch { setPrediction(null); }
    } catch { alert('Failed to load student'); setStudent(null); setPrediction(null); }
    finally { setLoading(false); }
  };

  const handlePredict = async () => {
    if (!student) return;
    setPredicting(true);
    try {
      const res = await api.post(`/students/${student.id}/predict`);
      setPrediction(res.data);
      alert('Prediction completed successfully!');
    } catch (err) {
      alert('Prediction failed: ' + (err.response?.data?.error || err.message));
    } finally { setPredicting(false); }
  };

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <StyledSelect value={selectedGrade} onChange={e => setSelectedGrade(e.target.value)} className="w-36">
          <option value="" style={{background:'#1e1b4b'}}>All Grades</option>
          {grades.map(g => <option key={g} value={g} style={{background:'#1e1b4b'}}>Grade {g}</option>)}
        </StyledSelect>
        <StyledSelect value={selectedSection} onChange={e => setSelectedSection(e.target.value)} className="w-36">
          <option value="" style={{background:'#1e1b4b'}}>All Sections</option>
          {sections.map(s => <option key={s} value={s} style={{background:'#1e1b4b'}}>Section {s}</option>)}
        </StyledSelect>
        <StyledSelect value={selectedStudentId}
          onChange={e => { setSelectedStudentId(e.target.value); handleStudentSelect(e.target.value); }}
          className="flex-1 min-w-[240px]">
          <option value="" style={{background:'#1e1b4b'}}>Select Student ID</option>
          {filteredStudentIds.map(id => <option key={id} value={id} style={{background:'#1e1b4b'}}>{id}</option>)}
        </StyledSelect>
        {(selectedGrade || selectedSection || selectedStudentId) && (
          <button
            onClick={() => { setSelectedGrade(''); setSelectedSection(''); setSelectedStudentId(''); setStudent(null); setPrediction(null); }}
            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
            style={{ background:'rgba(239,68,68,0.12)', border:'1px solid rgba(239,68,68,0.3)', color:'#fca5a5' }}
            onMouseEnter={e => e.currentTarget.style.background='rgba(239,68,68,0.25)'}
            onMouseLeave={e => e.currentTarget.style.background='rgba(239,68,68,0.12)'}>
            ✕ Clear
          </button>
        )}
      </div>

      {loading && <Spinner text="Loading student..." />}

      {!loading && !student && (
        <EmptyState icon="🎯" message="Select a student using the filters above to view their risk prediction" />
      )}

      {student && (
        <div className="space-y-5">
          {/* Student Info Card */}
          <div className="p-5 rounded-2xl"
            style={{ background:'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.15))', border:'1px solid rgba(99,102,241,0.35)' }}>
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">👤 Student Information</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label:'Name',    val:`${student.first_name} ${student.last_name}` },
                { label:'ID',      val: student.student_id },
                { label:'Grade',   val:`${student.grade}${student.section ? `-${student.section}` : ''}` },
                { label:'Age',     val: student.age || 'N/A' },
              ].map(item => (
                <div key={item.label} className="p-3 rounded-xl" style={{ background:'rgba(255,255,255,0.06)' }}>
                  <p style={{ ...labelStyle, marginBottom:'0.25rem' }}>{item.label}</p>
                  <p className="text-sm font-semibold text-white">{item.val}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Prediction Card */}
          {prediction ? (
            <div className="p-5 rounded-2xl space-y-5" style={glass}>
              <div className="flex items-center justify-between flex-wrap gap-3">
                <h3 className="text-sm font-bold text-white">📈 Latest Risk Assessment
                  <span className="ml-3 text-xs font-normal" style={{ color:'rgba(165,180,252,0.5)' }}>
                    {new Date(prediction.prediction_date).toLocaleDateString()}
                  </span>
                </h3>
                <button onClick={handlePredict} disabled={predicting}
                  className="px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-50"
                  style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', color:'#fff' }}
                  onMouseEnter={e => { if (!predicting) e.currentTarget.style.opacity='0.85'; }}
                  onMouseLeave={e => e.currentTarget.style.opacity='1'}>
                  {predicting ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                      </svg> Running...
                    </span>
                  ) : '🔄 Run New Prediction'}
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left */}
                <div className="space-y-4">
                  {/* Risk badge */}
                  <div className="flex justify-center">
                    {(() => { const rs = getRiskStyle(prediction.risk_label); return (
                      <span className="px-10 py-3 rounded-2xl text-2xl font-bold"
                        style={{ background:rs.bg, border:`2px solid ${rs.border}`, color:rs.color }}>
                        {prediction.risk_label}
                      </span>
                    ); })()}
                  </div>

                  {/* Confidence bar */}
                  <div>
                    <div className="flex justify-between mb-1.5">
                      <p className="text-xs" style={{ color:'rgba(165,180,252,0.6)' }}>Confidence Score</p>
                      <p className="text-sm font-bold" style={{ color:'#a5b4fc' }}>{prediction.confidence_score}%</p>
                    </div>
                    <div className="w-full h-2.5 rounded-full" style={{ background:'rgba(99,102,241,0.2)' }}>
                      <div className="h-2.5 rounded-full transition-all duration-700"
                        style={{ width:`${prediction.confidence_score}%`, background:'linear-gradient(90deg,#6366f1,#8b5cf6)' }} />
                    </div>
                  </div>

                  {/* Bar chart */}
                  {prediction.probability_low !== undefined && (
                    <div>
                      <p className="text-xs mb-2" style={{ color:'rgba(165,180,252,0.6)' }}>Probability Distribution</p>
                      <ResponsiveContainer width="100%" height={170}>
                        <BarChart data={[
                          { name:'Low',      value: prediction.probability_low      || 0, color:'#22c55e' },
                          { name:'Medium',   value: prediction.probability_medium   || 0, color:'#eab308' },
                          { name:'High',     value: prediction.probability_high     || 0, color:'#f97316' },
                          { name:'Critical', value: prediction.probability_critical || 0, color:'#ef4444' },
                        ]}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
                          <XAxis dataKey="name" stroke="rgba(99,102,241,0.2)" tick={{ fill:'rgba(165,180,252,0.6)', fontSize:11 }} />
                          <YAxis stroke="rgba(99,102,241,0.2)" tick={{ fill:'rgba(165,180,252,0.6)', fontSize:11 }} />
                          <Tooltip formatter={v => `${v}%`} contentStyle={chartTooltipStyle} />
                          <Bar dataKey="value" radius={[6,6,0,0]}>
                            {['#22c55e','#eab308','#f97316','#ef4444'].map((c,i) => <Cell key={i} fill={c} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Right — Pie */}
                {prediction.probability_low !== undefined && (
                  <div className="flex flex-col items-center justify-center">
                    <p className="text-xs mb-2" style={{ color:'rgba(165,180,252,0.6)' }}>Risk Distribution</p>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={[
                            { name:'Low Risk',      value: prediction.probability_low      || 0 },
                            { name:'Medium Risk',   value: prediction.probability_medium   || 0 },
                            { name:'High Risk',     value: prediction.probability_high     || 0 },
                            { name:'Critical Risk', value: prediction.probability_critical || 0 },
                          ]}
                          cx="50%" cy="50%" outerRadius={95} innerRadius={40}
                          labelLine={false}
                          label={({ name, value }) => value > 0 ? `${name.split(' ')[0]}: ${value}%` : ''}
                          dataKey="value">
                          {['#22c55e','#eab308','#f97316','#ef4444'].map((c,i) => <Cell key={i} fill={c} />)}
                        </Pie>
                        <Tooltip formatter={v => `${v}%`} contentStyle={chartTooltipStyle} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-5 p-10 rounded-2xl"
              style={{ background:'rgba(234,179,8,0.07)', border:'1px solid rgba(234,179,8,0.3)' }}>
              <span className="text-4xl">⚠️</span>
              <p className="text-sm" style={{ color:'rgba(253,224,71,0.85)' }}>No prediction found for this student</p>
              <button onClick={handlePredict} disabled={predicting}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50"
                style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                {predicting ? 'Running Prediction...' : '🎯 Run Prediction'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════
   BATCH ANALYSIS TAB
═══════════════════════════════════════════ */
const BatchTab = () => {
  const [grade, setGrade]     = useState('');
  const [section, setSection] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState(null);

  useEffect(() => { fetchSummary(); }, []);

  const fetchSummary = async () => {
    try {
      const res  = await api.get('/batch/summary');
      const d    = res.data;
      if (d.status === 'success') {
        const sd = d.data || {};
        const rs = sd.risk_summary || {};
        setSummary({
          total_students: sd.total_active || 0,
          low_risk:       rs.Low      || 0,
          medium_risk:    rs.Medium   || 0,
          high_risk:      rs.High     || 0,
          critical_risk:  rs.Critical || 0,
        });
      }
    } catch (err) { console.error(err); }
  };

  const handleRunBatch = async () => {
    setLoading(true);
    try {
      const res = await api.post('/batch/run', {
        grade: grade ? parseInt(grade) : null,
        section: section || null,
      });
      const d = res.data;
      if (d.status === 'success') {
        const bd = d.data || {};
        const sm = bd.summary || {};
        setResults({
          total_processed: sm.total   || 0,
          successful:      sm.success || 0,
          failed:          sm.failed  || 0,
          predictions:     bd.results || [],
        });
        fetchSummary();
        alert(`Batch completed! ${sm.success || 0} students processed.`);
      } else {
        alert('Batch failed: ' + (d.message || 'Unknown error'));
      }
    } catch (err) {
      alert('Batch failed: ' + (err.response?.data?.error || err.message));
    } finally { setLoading(false); }
  };

  const pieData = summary ? [
    { name:'Low',      value: summary.low_risk,      color:'#22c55e' },
    { name:'Medium',   value: summary.medium_risk,   color:'#eab308' },
    { name:'High',     value: summary.high_risk,     color:'#f97316' },
    { name:'Critical', value: summary.critical_risk, color:'#ef4444' },
  ] : [];

  return (
    <div className="space-y-5">
      {/* Info Banner */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl"
        style={{ background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.25)' }}>
        <span className="text-lg">⚡</span>
        <p className="text-sm" style={{ color:'rgba(165,180,252,0.85)' }}>
          Run risk predictions for multiple students at once. Filter by grade &amp; section or run for all students.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap gap-3 items-end">
        <StyledSelect label="Grade (optional)" value={grade} onChange={e => setGrade(e.target.value)} className="w-44">
          <option value="" style={{background:'#1e1b4b'}}>All Grades</option>
          {[6,7,8,9,10].map(g => <option key={g} value={g} style={{background:'#1e1b4b'}}>{g}</option>)}
        </StyledSelect>
        <StyledSelect label="Section (optional)" value={section} onChange={e => setSection(e.target.value)} className="w-44">
          <option value="" style={{background:'#1e1b4b'}}>All Sections</option>
          {['A','B','C','D'].map(s => <option key={s} value={s} style={{background:'#1e1b4b'}}>{s}</option>)}
        </StyledSelect>
        <div className="mt-auto">
          <button onClick={handleRunBatch} disabled={loading}
            className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50"
            style={{ background: loading ? 'rgba(99,102,241,0.4)' : 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg> Running...
              </span>
            ) : '⚡ Run Batch Prediction'}
          </button>
        </div>
      </div>

      {/* Current Risk Summary */}
      {summary && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white">Current Risk Summary</h3>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* KPI tiles */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label:'Total Students', val: summary.total_students, bg:'rgba(99,102,241,0.15)', border:'rgba(99,102,241,0.35)', color:'#a5b4fc' },
                { label:'Low Risk',       val: summary.low_risk,       bg:'rgba(34,197,94,0.12)',  border:'rgba(34,197,94,0.3)',   color:'#86efac' },
                { label:'Medium Risk',    val: summary.medium_risk,    bg:'rgba(234,179,8,0.12)',  border:'rgba(234,179,8,0.3)',   color:'#fde047' },
                { label:'High / Critical',val:(summary.high_risk||0)+(summary.critical_risk||0), bg:'rgba(239,68,68,0.12)', border:'rgba(239,68,68,0.3)', color:'#fca5a5' },
              ].map(k => (
                <div key={k.label} className="p-4 rounded-2xl"
                  style={{ background:k.bg, border:`1px solid ${k.border}` }}>
                  <p style={{ ...labelStyle, color: k.color, opacity:.7 }}>{k.label}</p>
                  <p className="text-3xl font-bold mt-1" style={{ color:k.color }}>{k.val}</p>
                </div>
              ))}
            </div>

            {/* Pie chart */}
            <div className="flex items-center justify-center rounded-2xl p-4" style={glass}>
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" outerRadius={90} innerRadius={36}
                    labelLine={false} label={({ name, value }) => value > 0 ? `${name}: ${value}` : ''}
                    dataKey="value">
                    {pieData.map((e,i) => <Cell key={i} fill={e.color} />)}
                  </Pie>
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Legend iconType="circle" iconSize={10}
                    formatter={val => <span style={{ color:'rgba(165,180,252,0.8)', fontSize:12 }}>{val}</span>} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {/* Batch Results */}
      {results && (
        <div className="space-y-4">
          <h3 className="text-sm font-bold text-white">Batch Results</h3>
          {/* Result KPIs */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label:'Processed', val: results.total_processed, color:'#a5b4fc' },
              { label:'Successful',val: results.successful,      color:'#86efac' },
              { label:'Failed',    val: results.failed,          color:'#fca5a5' },
            ].map(k => (
              <div key={k.label} className="p-4 rounded-2xl text-center" style={glass}>
                <p style={labelStyle}>{k.label}</p>
                <p className="text-3xl font-bold mt-1" style={{ color:k.color }}>{k.val}</p>
              </div>
            ))}
          </div>

          {results.predictions?.length > 0 && (
            <div className="rounded-2xl overflow-hidden" style={{ border:'1px solid rgba(99,102,241,0.15)' }}>
              <table className="w-full">
                <thead>
                  <tr style={{ borderBottom:'1px solid rgba(99,102,241,0.2)', background:'rgba(99,102,241,0.08)' }}>
                    {['Student ID','Name','Grade','Risk Level','Confidence','Status'].map(h => (
                      <th key={h} className="px-4 py-3.5 text-left text-xs font-semibold uppercase tracking-wider"
                        style={{ color:'rgba(165,180,252,0.7)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {results.predictions.map((pred, idx) => {
                    const rs = getRiskStyle(pred.risk_label);
                    return (
                      <tr key={idx}
                        style={{ borderBottom:'1px solid rgba(99,102,241,0.08)' }}
                        onMouseEnter={e => e.currentTarget.style.background='rgba(99,102,241,0.06)'}
                        onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                        <td className="px-4 py-3.5">
                          <span className="text-xs font-mono px-2 py-1 rounded-lg"
                            style={{ background:'rgba(99,102,241,0.15)', color:'#a5b4fc' }}>
                            {pred.student_code}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-sm font-semibold text-white">{pred.student_name}</td>
                        <td className="px-4 py-3.5 text-sm" style={{ color:'rgba(165,180,252,0.7)' }}>{pred.grade}</td>
                        <td className="px-4 py-3.5">
                          {pred.status === 'success' ? (
                            <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                              style={{ background:rs.bg, border:`1px solid ${rs.border}`, color:rs.color }}>
                              {pred.risk_label}
                            </span>
                          ) : <span style={{ color:'rgba(165,180,252,0.35)' }}>—</span>}
                        </td>
                        <td className="px-4 py-3.5 text-sm font-semibold" style={{ color:'#a5b4fc' }}>
                          {pred.status === 'success' ? `${pred.confidence_score}%` : '—'}
                        </td>
                        <td className="px-4 py-3.5">
                          {pred.status === 'success' ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                              style={{ background:'rgba(34,197,94,0.15)', border:'1px solid rgba(34,197,94,0.35)', color:'#86efac' }}>Success</span>
                          ) : pred.status === 'skipped' ? (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                              style={{ background:'rgba(234,179,8,0.15)', border:'1px solid rgba(234,179,8,0.35)', color:'#fde047' }}>Skipped</span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                              style={{ background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.35)', color:'#fca5a5' }}>Failed</span>
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
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════
   ANALYTICS TAB
═══════════════════════════════════════════ */
const AnalyticsTab = () => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading]     = useState(true);

  useEffect(() => { fetchAnalytics(); }, []);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await api.get('/analytics/school-overview');
      setAnalytics(res.data.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  if (loading) return <Spinner text="Loading analytics..." />;
  if (!analytics) return <EmptyState icon="📊" message="No analytics data available" />;

  const riskDist = analytics.risk_distribution || {};
  const total    = Object.values(riskDist).reduce((a,b) => a + b, 0);

  const riskCards = [
    { label:'Low',      val: riskDist.Low      || 0, bg:'rgba(34,197,94,0.12)',  border:'rgba(34,197,94,0.3)',   color:'#86efac' },
    { label:'Medium',   val: riskDist.Medium   || 0, bg:'rgba(234,179,8,0.12)',  border:'rgba(234,179,8,0.3)',   color:'#fde047' },
    { label:'High',     val: riskDist.High     || 0, bg:'rgba(249,115,22,0.12)', border:'rgba(249,115,22,0.3)',  color:'#fdba74' },
    { label:'Critical', val: riskDist.Critical || 0, bg:'rgba(239,68,68,0.12)',  border:'rgba(239,68,68,0.3)',   color:'#fca5a5' },
  ];

  return (
    <div className="space-y-6">
      {/* ── Overview KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label:'Total Students',   val: analytics.total_active,      icon:'👥', color:'#a5b4fc' },
          { label:'Average GPA',      val: analytics.avg_gpa,           icon:'📚', color:'#86efac' },
          { label:'Attendance Rate',  val:`${analytics.avg_attendance}%`,icon:'📅', color:'#fde047' },
          { label:'Total Predictions',val: analytics.total_predictions,  icon:'🎯', color:'#fdba74' },
        ].map(k => (
          <div key={k.label} className="p-5 rounded-2xl" style={glass}>
            <div className="flex items-center gap-2 mb-2">
              <span>{k.icon}</span>
              <p style={labelStyle}>{k.label}</p>
            </div>
            <p className="text-3xl font-bold" style={{ color:k.color }}>{k.val}</p>
          </div>
        ))}
      </div>

      {/* ── Risk Distribution ── */}
      <div className="rounded-2xl p-5" style={glass}>
        <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2">⚖️ Risk Distribution</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Bar chart */}
          <div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={riskCards}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
                <XAxis dataKey="label" stroke="rgba(99,102,241,0.2)" tick={{ fill:'rgba(165,180,252,0.6)', fontSize:12 }} />
                <YAxis stroke="rgba(99,102,241,0.2)" tick={{ fill:'rgba(165,180,252,0.6)', fontSize:12 }}
                  label={{ value:'Students', angle:-90, position:'insideLeft', fill:'rgba(165,180,252,0.5)', fontSize:11 }} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="val" radius={[8,8,0,0]}>
                  {riskCards.map((e,i) => <Cell key={i} fill={e.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-2 gap-3">
            {riskCards.map(k => (
              <div key={k.label} className="p-4 rounded-2xl text-center"
                style={{ background:k.bg, border:`1px solid ${k.border}` }}>
                <p style={{ ...labelStyle, color:k.color, opacity:.8 }}>{k.label}</p>
                <p className="text-3xl font-bold mt-1" style={{ color:k.color }}>{k.val}</p>
                <p className="text-xs mt-1" style={{ color:'rgba(165,180,252,0.45)' }}>
                  {total > 0 ? ((k.val / total) * 100).toFixed(1) : 0}%
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Grade-wise Statistics ── */}
      <div className="rounded-2xl p-5" style={glass}>
        <h3 className="text-sm font-bold text-white mb-5 flex items-center gap-2">📊 Grade-wise Statistics</h3>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={analytics.grade_stats || []}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
            <XAxis dataKey="grade" stroke="rgba(99,102,241,0.2)"
              tick={{ fill:'rgba(165,180,252,0.6)', fontSize:12 }}
              label={{ value:'Grade', position:'insideBottom', offset:-5, fill:'rgba(165,180,252,0.5)', fontSize:11 }} />
            <YAxis yAxisId="left"  orientation="left"  stroke="rgba(99,102,241,0.2)"
              tick={{ fill:'rgba(165,180,252,0.6)', fontSize:11 }}
              label={{ value:'Students', angle:-90, position:'insideLeft', fill:'rgba(165,180,252,0.5)', fontSize:11 }} />
            <YAxis yAxisId="right" orientation="right" stroke="rgba(99,102,241,0.2)"
              tick={{ fill:'rgba(165,180,252,0.6)', fontSize:11 }}
              label={{ value:'Avg GPA', angle:90, position:'insideRight', fill:'rgba(165,180,252,0.5)', fontSize:11 }} />
            <Tooltip contentStyle={chartTooltipStyle} />
            <Legend iconType="circle" iconSize={10}
              formatter={val => <span style={{ color:'rgba(165,180,252,0.8)', fontSize:12 }}>{val}</span>} />
            <Bar yAxisId="left"  dataKey="total"   fill="#6366f1" name="Total Students" radius={[6,6,0,0]} />
            <Bar yAxisId="right" dataKey="avg_gpa" fill="#22c55e" name="Average GPA"    radius={[6,6,0,0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Section-wise Performance ── */}
      <div className="rounded-2xl p-5" style={glass}>
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">📋 Section-wise Performance</h3>
        <div className="overflow-x-auto rounded-xl" style={{ border:'1px solid rgba(99,102,241,0.15)' }}>
          <table className="w-full">
            <thead>
              <tr style={{ borderBottom:'1px solid rgba(99,102,241,0.2)', background:'rgba(99,102,241,0.08)' }}>
                {['Grade','Section','Students','Avg GPA','At Risk'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider"
                    style={{ color:'rgba(165,180,252,0.7)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {analytics.section_stats?.map((stat, idx) => (
                <tr key={idx}
                  style={{ borderBottom:'1px solid rgba(99,102,241,0.08)' }}
                  onMouseEnter={e => e.currentTarget.style.background='rgba(99,102,241,0.06)'}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  <td className="px-5 py-3.5 text-sm" style={{ color:'rgba(165,180,252,0.8)' }}>{stat.grade}</td>
                  <td className="px-5 py-3.5">
                    <span className="text-xs font-mono px-2 py-1 rounded-lg font-semibold"
                      style={{ background:'rgba(99,102,241,0.15)', color:'#a5b4fc' }}>
                      {stat.section}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-sm font-semibold text-white">{stat.total}</td>
                  <td className="px-5 py-3.5 text-sm font-semibold" style={{ color:'#86efac' }}>{stat.avg_gpa}</td>
                  <td className="px-5 py-3.5">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                      style={stat.at_risk_count > 0
                        ? { background:'rgba(239,68,68,0.15)', border:'1px solid rgba(239,68,68,0.35)', color:'#fca5a5' }
                        : { background:'rgba(34,197,94,0.15)',  border:'1px solid rgba(34,197,94,0.35)',  color:'#86efac' }
                      }>
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
