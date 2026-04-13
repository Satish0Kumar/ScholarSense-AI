import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext';

/* ── tiny floating orb component ── */
const Orb = ({ style }) => (
  <div className="absolute rounded-full opacity-20 animate-pulse pointer-events-none" style={style} />
);

const Login = () => {
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [digits, setDigits]     = useState(['', '', '', '', '', '']);
  const [userId, setUserId]     = useState(null);
  const [showOtp, setShowOtp]   = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  const digitRefs = useRef([]);
  const { login, verifyOtp } = useAuth();
  const navigate = useNavigate();

  /* countdown timer for resend */
  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  /* auto-focus first digit box when OTP step appears */
  useEffect(() => {
    if (showOtp) {
      setResendTimer(30);
      setTimeout(() => digitRefs.current[0]?.focus(), 100);
    }
  }, [showOtp]);

  /* ── OTP digit handlers ── */
  const handleDigit = (i, val) => {
    if (!/^\d?$/.test(val)) return;
    const next = [...digits];
    next[i] = val;
    setDigits(next);
    if (val && i < 5) digitRefs.current[i + 1]?.focus();
  };

  const handleDigitKey = (i, e) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) {
      digitRefs.current[i - 1]?.focus();
    }
  };

  const handleDigitPaste = (e) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) {
      setDigits(pasted.split(''));
      digitRefs.current[5]?.focus();
    }
  };

  /* ── submit handlers ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.status === 'otp_sent') {
        setUserId(result.user_id);
        setShowOtp(true);
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    const otp = digits.join('');
    if (otp.length < 6) { setError('Please enter all 6 digits'); return; }
    setError('');
    setLoading(true);
    try {
      await verifyOtp(userId, otp);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid or expired OTP');
      setDigits(['', '', '', '', '', '']);
      setTimeout(() => digitRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setShowOtp(false);
    setDigits(['', '', '', '', '', '']);
    setError('');
  };

  /* ── quick-fill demo credentials ── */
  const fillDemo = (role) => {
    if (role === 'admin') { setEmail('admin@scholarsense.com'); setPassword('admin123'); }
    else { setEmail('teacher@scholarsense.com'); setPassword('teacher123'); }
  };

  /* ── orb config ── */
  const orbs = [
    { width: 320, height: 320, background: '#6366f1', top: '-80px', left: '-80px' },
    { width: 200, height: 200, background: '#8b5cf6', bottom: '60px', left: '40px' },
    { width: 160, height: 160, background: '#06b6d4', top: '40%', left: '30%' },
    { width: 260, height: 260, background: '#3b82f6', bottom: '-60px', right: '-60px' },
    { width: 120, height: 120, background: '#a78bfa', top: '20px', right: '80px' },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>

      {/* floating orbs */}
      {orbs.map((o, i) => <Orb key={i} style={o} />)}

      {/* grid overlay */}
      <div className="absolute inset-0 opacity-5 pointer-events-none"
        style={{ backgroundImage: 'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)', backgroundSize: '40px 40px' }} />

      {/* card */}
      <div className="relative z-10 w-full max-w-4xl flex rounded-3xl overflow-hidden shadow-2xl"
        style={{ backdropFilter: 'blur(20px)', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)' }}>

        {/* ── LEFT PANEL ── */}
        <div className="hidden md:flex flex-col justify-between w-5/12 p-10 relative overflow-hidden"
          style={{ background: 'linear-gradient(160deg, rgba(99,102,241,0.6) 0%, rgba(139,92,246,0.4) 100%)' }}>

          <div className="absolute inset-0 opacity-10"
            style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, #fff 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl font-bold text-white"
                style={{ background: 'rgba(255,255,255,0.2)' }}>S</div>
              <span className="text-white text-xl font-bold tracking-wide">ScholarSense</span>
            </div>
            <p className="text-indigo-200 text-sm">AI-Powered Academic Intelligence</p>
          </div>

          <div className="relative z-10 space-y-6">
            {[
              { icon: '🎯', title: 'Risk Prediction', desc: 'ML-based dropout risk assessment' },
              { icon: '📊', title: 'Academic Tracking', desc: 'Monitor GPA & performance trends' },
              { icon: '🔔', title: 'Smart Alerts', desc: 'Proactive intervention system' },
            ].map(f => (
              <div key={f.title} className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center text-lg flex-shrink-0"
                  style={{ background: 'rgba(255,255,255,0.15)' }}>{f.icon}</div>
                <div>
                  <p className="text-white text-sm font-semibold">{f.title}</p>
                  <p className="text-indigo-200 text-xs">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="relative z-10 text-indigo-300 text-xs">© 2026 ScholarSense · Final Year Project</p>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="flex-1 p-8 md:p-10 flex flex-col justify-center"
          style={{ background: 'rgba(15,12,41,0.7)' }}>

          {/* step indicator */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${!showOtp ? 'bg-indigo-500 text-white' : 'bg-indigo-900 text-indigo-400'}`}>1</div>
            <div className={`flex-1 h-0.5 transition-all duration-500 ${showOtp ? 'bg-indigo-500' : 'bg-indigo-900'}`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${showOtp ? 'bg-indigo-500 text-white' : 'bg-indigo-900 text-indigo-400'}`}>2</div>
          </div>

          {!showOtp ? (
            /* ── LOGIN FORM ── */
            <div>
              <h2 className="text-2xl font-bold text-white mb-1">Welcome back 👋</h2>
              <p className="text-indigo-300 text-sm mb-7">Sign in to your account to continue</p>

              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-5 text-sm">
                  <span>⚠️</span> {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* email */}
                <div>
                  <label className="block text-xs font-semibold text-indigo-300 mb-2 uppercase tracking-wider">Email Address</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400">✉️</span>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                      placeholder="you@scholarsense.com"
                      className="w-full pl-10 pr-4 py-3 rounded-xl text-white text-sm outline-none transition-all duration-200"
                      style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)' }}
                      onFocus={e => e.target.style.borderColor = '#6366f1'}
                      onBlur={e => e.target.style.borderColor = 'rgba(99,102,241,0.3)'} />
                  </div>
                </div>

                {/* password */}
                <div>
                  <label className="block text-xs font-semibold text-indigo-300 mb-2 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-indigo-400">🔒</span>
                    <input type={showPwd ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required
                      placeholder="••••••••"
                      className="w-full pl-10 pr-12 py-3 rounded-xl text-white text-sm outline-none transition-all duration-200"
                      style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)' }}
                      onFocus={e => e.target.style.borderColor = '#6366f1'}
                      onBlur={e => e.target.style.borderColor = 'rgba(99,102,241,0.3)'} />
                    <button type="button" onClick={() => setShowPwd(p => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-400 hover:text-white transition-colors text-sm">
                      {showPwd ? '🙈' : '👁️'}
                    </button>
                  </div>
                </div>

                {/* submit */}
                <button type="submit" disabled={loading}
                  className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
                  style={{ background: loading ? 'rgba(99,102,241,0.5)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                  onMouseEnter={e => { if (!loading) e.target.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => e.target.style.transform = 'translateY(0)'}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Signing in...
                    </span>
                  ) : 'Sign In →'}
                </button>
              </form>

              {/* demo accounts */}
              <div className="mt-7 pt-6" style={{ borderTop: '1px solid rgba(99,102,241,0.2)' }}>
                <p className="text-xs text-indigo-400 text-center mb-3 uppercase tracking-wider">Quick Demo Access</p>
                <div className="flex gap-3">
                  {[{ role: 'admin', label: '🛡️ Admin' }, { role: 'teacher', label: '👩🏫 Teacher' }].map(d => (
                    <button key={d.role} onClick={() => fillDemo(d.role)}
                      className="flex-1 py-2 rounded-lg text-xs font-medium text-indigo-300 hover:text-white transition-all duration-200"
                      style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}
                      onMouseEnter={e => e.target.style.background = 'rgba(99,102,241,0.25)'}
                      onMouseLeave={e => e.target.style.background = 'rgba(99,102,241,0.1)'}>
                      {d.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

          ) : (
            /* ── OTP FORM ── */
            <div>
              <button onClick={handleBack} className="flex items-center gap-1 text-indigo-400 hover:text-white text-sm mb-6 transition-colors">
                ← Back
              </button>

              <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-5"
                style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.3))', border: '1px solid rgba(99,102,241,0.4)' }}>
                📧
              </div>

              <h2 className="text-2xl font-bold text-white mb-1">Check your email</h2>
              <p className="text-indigo-300 text-sm mb-1">We sent a 6-digit code to</p>
              <p className="text-indigo-100 text-sm font-semibold mb-7">{email}</p>

              {error && (
                <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-5 text-sm">
                  <span>⚠️</span> {error}
                </div>
              )}

              <form onSubmit={handleOtpSubmit}>
                {/* 6 digit boxes */}
                <div className="flex gap-3 justify-center mb-6" onPaste={handleDigitPaste}>
                  {digits.map((d, i) => (
                    <input key={i} ref={el => digitRefs.current[i] = el}
                      type="text" inputMode="numeric" maxLength={1} value={d}
                      onChange={e => handleDigit(i, e.target.value)}
                      onKeyDown={e => handleDigitKey(i, e)}
                      className="w-12 h-14 text-center text-xl font-bold text-white rounded-xl outline-none transition-all duration-200"
                      style={{
                        background: d ? 'rgba(99,102,241,0.3)' : 'rgba(99,102,241,0.08)',
                        border: d ? '2px solid #6366f1' : '2px solid rgba(99,102,241,0.25)',
                        caretColor: '#6366f1'
                      }}
                      onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                      onBlur={e => e.target.style.borderColor = d ? '#6366f1' : 'rgba(99,102,241,0.25)'} />
                  ))}
                </div>

                {/* progress dots */}
                <div className="flex justify-center gap-1.5 mb-6">
                  {digits.map((d, i) => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full transition-all duration-200"
                      style={{ background: d ? '#6366f1' : 'rgba(99,102,241,0.2)' }} />
                  ))}
                </div>

                <button type="submit" disabled={loading || digits.join('').length < 6}
                  className="w-full py-3 rounded-xl font-semibold text-white text-sm transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
                  onMouseEnter={e => { if (!loading) e.target.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => e.target.style.transform = 'translateY(0)'}>
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      Verifying...
                    </span>
                  ) : 'Verify & Continue →'}
                </button>
              </form>

              {/* resend */}
              <p className="text-center text-sm text-indigo-400 mt-5">
                Didn't receive it?{' '}
                {resendTimer > 0 ? (
                  <span className="text-indigo-300">Resend in {resendTimer}s</span>
                ) : (
                  <button onClick={() => { handleSubmit({ preventDefault: () => {} }); }}
                    className="text-indigo-300 hover:text-white underline transition-colors">
                    Resend OTP
                  </button>
                )}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
