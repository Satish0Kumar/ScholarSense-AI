import { useState } from 'react';
import api from '../utils/api';

const inputStyle = {
  background: 'rgba(99,102,241,0.08)',
  border: '1px solid rgba(99,102,241,0.25)',
  color: '#fff',
};
const inputFocus = (e) => (e.target.style.borderColor = '#6366f1');
const inputBlur  = (e) => (e.target.style.borderColor = 'rgba(99,102,241,0.25)');

const Field = ({ label, required, children }) => (
  <div>
    <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
      style={{ color: 'rgba(165,180,252,0.7)' }}>
      {label} {required && <span style={{ color: '#f87171' }}>*</span>}
    </label>
    {children}
  </div>
);

const inputCls = "w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200 placeholder-indigo-900";

const AddStudentForm = ({ onClose, onSuccess }) => {
  const [activeSection, setActiveSection] = useState('basic');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [formData, setFormData] = useState({
    student_id: '', first_name: '', last_name: '', grade: '', section: '',
    gender: '', date_of_birth: '', parent_name: '', parent_phone: '',
    parent_email: '', socioeconomic_status: 'Medium', parent_education: 'High School',
    current_gpa: '', previous_gpa: '', failed_subjects: '0',
    assignment_submission_rate: '', math_score: '', science_score: '',
    english_score: '', social_score: '', language_score: '', semester: 'Semester 1',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const validateBasicInfo = () => {
    const required = ['student_id', 'first_name', 'last_name', 'grade', 'date_of_birth', 'parent_email'];
    for (let f of required) {
      if (!formData[f]) { setError(`${f.replace(/_/g, ' ')} is required`); return false; }
    }
    if (![6,7,8,9,10].includes(parseInt(formData.grade))) {
      setError('Grade must be between 6 and 10'); return false;
    }
    return true;
  };

  const validateAcademicInfo = () => {
    const required = ['current_gpa','assignment_submission_rate','math_score','science_score','english_score','social_score','language_score'];
    for (let f of required) {
      if (!formData[f]) { setError(`${f.replace(/_/g, ' ')} is required for accurate risk prediction`); return false; }
    }
    if (parseFloat(formData.current_gpa) < 0 || parseFloat(formData.current_gpa) > 10) { setError('GPA must be 0–10'); return false; }
    if (formData.previous_gpa && (parseFloat(formData.previous_gpa) < 0 || parseFloat(formData.previous_gpa) > 10)) { setError('Previous GPA must be 0–10'); return false; }
    if (parseFloat(formData.assignment_submission_rate) < 0 || parseFloat(formData.assignment_submission_rate) > 100) { setError('Submission rate must be 0–100'); return false; }
    for (let s of ['math_score','science_score','english_score','social_score','language_score']) {
      if (parseFloat(formData[s]) < 0 || parseFloat(formData[s]) > 100) { setError(`${s.replace(/_/g,' ')} must be 0–100`); return false; }
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!validateBasicInfo() || !validateAcademicInfo()) return;
    setLoading(true);
    try {
      const studentRes = await api.post('/students', {
        student_id: formData.student_id, first_name: formData.first_name,
        last_name: formData.last_name, grade: parseInt(formData.grade),
        section: formData.section || null, gender: formData.gender || null,
        date_of_birth: formData.date_of_birth, parent_name: formData.parent_name || null,
        parent_phone: formData.parent_phone || null, parent_email: formData.parent_email,
        socioeconomic_status: formData.socioeconomic_status, parent_education: formData.parent_education,
      });
      await api.post('/academics', {
        student_id: studentRes.data.id, semester: formData.semester,
        current_gpa: parseFloat(formData.current_gpa),
        previous_gpa: formData.previous_gpa ? parseFloat(formData.previous_gpa) : null,
        grade_trend: formData.previous_gpa ? parseFloat(formData.current_gpa) - parseFloat(formData.previous_gpa) : 0,
        failed_subjects: parseInt(formData.failed_subjects),
        assignment_submission_rate: parseFloat(formData.assignment_submission_rate),
        math_score: parseFloat(formData.math_score), science_score: parseFloat(formData.science_score),
        english_score: parseFloat(formData.english_score), social_score: parseFloat(formData.social_score),
        language_score: parseFloat(formData.language_score),
      });
      onSuccess(); onClose();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create student');
    } finally {
      setLoading(false);
    }
  };

  const glass = { background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.2)', backdropFilter: 'blur(12px)' };
  const selectStyle = { ...inputStyle, appearance: 'none' };

  return (
    <div className="space-y-5">

      {/* Header */}
      <div className="rounded-2xl p-6 flex items-center gap-4"
        style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.35), rgba(139,92,246,0.25))', border: '1px solid rgba(99,102,241,0.4)' }}>
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.1)' }}>➕</div>
        <div>
          <h2 className="text-xl font-bold text-white">Add New Student</h2>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(165,180,252,0.7)' }}>
            Complete both sections for accurate ML risk prediction
          </p>
        </div>
      </div>

      {/* Section switcher */}
      <div className="flex gap-1 p-1 rounded-2xl" style={glass}>
        {[
          { id: 'basic',    icon: '📋', label: 'Basic Info',    step: '1' },
          { id: 'academic', icon: '📚', label: 'Academic Info', step: '2' },
        ].map(s => (
          <button key={s.id} type="button" onClick={() => setActiveSection(s.id)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
            style={activeSection === s.id
              ? { background: 'linear-gradient(135deg, rgba(99,102,241,0.5), rgba(139,92,246,0.4))', color: '#fff', border: '1px solid rgba(99,102,241,0.5)' }
              : { color: 'rgba(165,180,252,0.55)', border: '1px solid transparent' }
            }>
            <span className="w-5 h-5 rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0"
              style={{ background: activeSection === s.id ? 'rgba(255,255,255,0.2)' : 'rgba(99,102,241,0.2)', color: activeSection === s.id ? '#fff' : '#a5b4fc' }}>
              {s.step}
            </span>
            <span>{s.icon} {s.label}</span>
          </button>
        ))}
      </div>

      {/* Form card */}
      <div className="rounded-2xl p-6" style={glass}>
        {error && (
          <div className="flex items-center gap-2 mb-5 px-4 py-3 rounded-xl text-sm"
            style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>

          {/* ── BASIC INFO ── */}
          {activeSection === 'basic' && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                <Field label="Student ID" required>
                  <input type="text" name="student_id" value={formData.student_id} onChange={handleChange}
                    placeholder="e.g. STU2024001" className={inputCls} style={inputStyle}
                    onFocus={inputFocus} onBlur={inputBlur} required />
                </Field>

                <Field label="First Name" required>
                  <input type="text" name="first_name" value={formData.first_name} onChange={handleChange}
                    className={inputCls} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} required />
                </Field>

                <Field label="Last Name" required>
                  <input type="text" name="last_name" value={formData.last_name} onChange={handleChange}
                    className={inputCls} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} required />
                </Field>

                <Field label="Grade" required>
                  <select name="grade" value={formData.grade} onChange={handleChange}
                    className={inputCls} style={selectStyle} onFocus={inputFocus} onBlur={inputBlur} required>
                    <option value="" style={{ background: '#1e1b4b' }}>Select Grade</option>
                    {[6,7,8,9,10].map(g => <option key={g} value={g} style={{ background: '#1e1b4b' }}>Grade {g}</option>)}
                  </select>
                </Field>

                <Field label="Section">
                  <input type="text" name="section" value={formData.section} onChange={handleChange}
                    placeholder="e.g. A, B, C" maxLength="10" className={inputCls} style={inputStyle}
                    onFocus={inputFocus} onBlur={inputBlur} />
                </Field>

                <Field label="Gender">
                  <select name="gender" value={formData.gender} onChange={handleChange}
                    className={inputCls} style={selectStyle} onFocus={inputFocus} onBlur={inputBlur}>
                    <option value="" style={{ background: '#1e1b4b' }}>Select Gender</option>
                    {['Male','Female','Other'].map(g => <option key={g} value={g} style={{ background: '#1e1b4b' }}>{g}</option>)}
                  </select>
                </Field>

                <Field label="Date of Birth" required>
                  <input type="date" name="date_of_birth" value={formData.date_of_birth} onChange={handleChange}
                    className={inputCls} style={{ ...inputStyle, colorScheme: 'dark' }}
                    onFocus={inputFocus} onBlur={inputBlur} required />
                </Field>

                <Field label="Parent Name">
                  <input type="text" name="parent_name" value={formData.parent_name} onChange={handleChange}
                    className={inputCls} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                </Field>

                <Field label="Parent Phone">
                  <input type="tel" name="parent_phone" value={formData.parent_phone} onChange={handleChange}
                    placeholder="+1234567890" className={inputCls} style={inputStyle}
                    onFocus={inputFocus} onBlur={inputBlur} />
                </Field>

                <Field label="Parent Email" required>
                  <input type="email" name="parent_email" value={formData.parent_email} onChange={handleChange}
                    className={inputCls} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} required />
                </Field>

                <Field label="Socioeconomic Status" required>
                  <select name="socioeconomic_status" value={formData.socioeconomic_status} onChange={handleChange}
                    className={inputCls} style={selectStyle} onFocus={inputFocus} onBlur={inputBlur} required>
                    {['Low','Medium','High'].map(v => <option key={v} value={v} style={{ background: '#1e1b4b' }}>{v}</option>)}
                  </select>
                </Field>

                <Field label="Parent Education" required>
                  <select name="parent_education" value={formData.parent_education} onChange={handleChange}
                    className={inputCls} style={selectStyle} onFocus={inputFocus} onBlur={inputBlur} required>
                    {['Elementary','High School','Bachelor','Master','PhD'].map(v => (
                      <option key={v} value={v} style={{ background: '#1e1b4b' }}>{v}</option>
                    ))}
                  </select>
                </Field>
              </div>

              <div className="flex justify-end pt-2">
                <button type="button"
                  onClick={() => { if (validateBasicInfo()) setActiveSection('academic'); }}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  Next: Academic Info →
                </button>
              </div>
            </div>
          )}

          {/* ── ACADEMIC INFO ── */}
          {activeSection === 'academic' && (
            <div className="space-y-5">

              {/* Info banner */}
              <div className="flex items-start gap-3 px-4 py-3 rounded-xl"
                style={{ background: 'rgba(234,179,8,0.1)', border: '1px solid rgba(234,179,8,0.3)' }}>
                <span className="text-lg flex-shrink-0">⚠️</span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#fde047' }}>Academic data required for ML prediction</p>
                  <p className="text-xs mt-0.5" style={{ color: 'rgba(253,224,71,0.7)' }}>
                    All starred fields must be filled to enable accurate dropout risk assessment
                  </p>
                </div>
              </div>

              {/* Semester */}
              <Field label="Semester" required>
                <select name="semester" value={formData.semester} onChange={handleChange}
                  className={inputCls} style={{ ...selectStyle, maxWidth: '260px' }}
                  onFocus={inputFocus} onBlur={inputBlur} required>
                  <option value="Semester 1" style={{ background: '#1e1b4b' }}>Semester 1</option>
                  <option value="Semester 2" style={{ background: '#1e1b4b' }}>Semester 2</option>
                </select>
              </Field>

              {/* GPA + submission */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Field label="Current GPA (0–10)" required>
                  <input type="number" name="current_gpa" value={formData.current_gpa} onChange={handleChange}
                    step="0.01" min="0" max="10" placeholder="e.g. 7.5"
                    className={inputCls} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} required />
                </Field>

                <Field label="Previous GPA (0–10)">
                  <input type="number" name="previous_gpa" value={formData.previous_gpa} onChange={handleChange}
                    step="0.01" min="0" max="10" placeholder="Leave empty if first semester"
                    className={inputCls} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} />
                </Field>

                <Field label="Failed Subjects" required>
                  <input type="number" name="failed_subjects" value={formData.failed_subjects} onChange={handleChange}
                    min="0" max="5" className={inputCls} style={inputStyle}
                    onFocus={inputFocus} onBlur={inputBlur} required />
                </Field>

                <Field label="Assignment Submission Rate (%)" required>
                  <input type="number" name="assignment_submission_rate" value={formData.assignment_submission_rate}
                    onChange={handleChange} step="0.01" min="0" max="100" placeholder="e.g. 85.5"
                    className={inputCls} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} required />
                </Field>
              </div>

              {/* Subject scores */}
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider mb-3"
                  style={{ color: 'rgba(165,180,252,0.5)', borderBottom: '1px solid rgba(99,102,241,0.15)', paddingBottom: '8px' }}>
                  Subject Scores (0–100)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    { name: 'math_score',    label: 'Math Score' },
                    { name: 'science_score', label: 'Science Score' },
                    { name: 'english_score', label: 'English Score' },
                    { name: 'social_score',  label: 'Social Studies Score' },
                    { name: 'language_score',label: 'Language Score' },
                  ].map(f => (
                    <Field key={f.name} label={f.label} required>
                      <input type="number" name={f.name} value={formData[f.name]} onChange={handleChange}
                        step="0.01" min="0" max="100"
                        className={inputCls} style={inputStyle} onFocus={inputFocus} onBlur={inputBlur} required />
                    </Field>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-between items-center pt-2">
                <button type="button" onClick={() => setActiveSection('basic')}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
                  style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(99,102,241,0.1)'}>
                  ← Back
                </button>

                <button type="submit" disabled={loading}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ background: loading ? 'rgba(34,197,94,0.4)' : 'linear-gradient(135deg, #22c55e, #16a34a)' }}
                  onMouseEnter={e => { if (!loading) e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  {loading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Creating...
                    </span>
                  ) : '✓ Create Student'}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default AddStudentForm;
