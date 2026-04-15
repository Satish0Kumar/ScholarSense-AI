import { useAuth } from '../../utils/AuthContext';
import { useNavigate } from 'react-router-dom';

const Header = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => { logout(); navigate('/login'); };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <header className="h-16 fixed top-0 right-0 left-64 z-10 flex items-center justify-between px-6"
      style={{ background: 'rgba(15,12,41,0.85)', borderBottom: '1px solid rgba(99,102,241,0.2)', backdropFilter: 'blur(20px)' }}>

      <div>
        <p className="text-white text-sm font-semibold">{greeting}, {user?.full_name?.split(' ')[0] || user?.username || 'User'} 👋</p>
        <p className="text-xs" style={{ color: 'rgba(165,180,252,0.6)' }}>
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="flex items-center gap-3">
        {/* role badge */}
        <span className="px-3 py-1 rounded-full text-xs font-semibold capitalize"
          style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', color: '#a5b4fc' }}>
          {user?.role}
        </span>

        {/* avatar */}
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          {user?.full_name?.[0]?.toUpperCase() || user?.username?.[0]?.toUpperCase() || 'U'}
        </div>

        {/* logout */}
        <button onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200"
          style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.3)'}
          onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}>
          <span>⏻</span> Logout
        </button>
      </div>
    </header>
  );
};

export default Header;
