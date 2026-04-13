import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/dashboard',     label: 'Dashboard',      icon: '📊', section: 'Overview' },
    { path: '/students',      label: 'Students',       icon: '👨🎓', section: 'Management' },
    { path: '/academics',     label: 'Academics',      icon: '📚', section: 'Management' },
    { path: '/risk-analytics',label: 'Risk & Analytics',icon: '🤖', section: 'Intelligence' },
    { path: '/alerts',        label: 'Alerts',         icon: '📬', section: 'Intelligence' },
  ];

  if (user?.role === 'admin') {
    navItems.push({ path: '/users', label: 'User Management', icon: '⚙️', section: 'Admin' });
  }

  let currentSection = '';

  return (
    <div className="w-64 h-screen fixed left-0 top-0 overflow-y-auto flex flex-col"
      style={{ background: 'rgba(15,12,41,0.95)', borderRight: '1px solid rgba(99,102,241,0.2)', backdropFilter: 'blur(20px)' }}>

      {/* logo */}
      <div className="p-6 pb-4" style={{ borderBottom: '1px solid rgba(99,102,241,0.15)' }}>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-lg font-bold text-white flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>S</div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">ScholarSense</h1>
            <p className="text-xs" style={{ color: 'rgba(165,180,252,0.7)' }}>AI Academic Intelligence</p>
          </div>
        </div>
      </div>

      {/* user pill */}
      <div className="mx-4 mt-4 mb-2 px-3 py-2 rounded-xl flex items-center gap-3"
        style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)' }}>
        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}>
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="min-w-0">
          <p className="text-white text-xs font-semibold truncate">{user?.name || 'User'}</p>
          <p className="text-xs capitalize" style={{ color: 'rgba(165,180,252,0.7)' }}>{user?.role}</p>
        </div>
      </div>

      {/* nav */}
      <nav className="flex-1 px-3 py-2 mt-2">
        {navItems.map((item) => {
          const showSection = item.section !== currentSection;
          currentSection = item.section;
          const active = isActive(item.path);
          return (
            <div key={item.path}>
              {showSection && (
                <p className="px-3 pt-4 pb-1 text-xs font-semibold uppercase tracking-widest"
                  style={{ color: 'rgba(99,102,241,0.6)' }}>
                  {item.section}
                </p>
              )}
              <Link to={item.path}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl mb-0.5 transition-all duration-200 group"
                style={{
                  background: active ? 'linear-gradient(135deg, rgba(99,102,241,0.3), rgba(139,92,246,0.2))' : 'transparent',
                  border: active ? '1px solid rgba(99,102,241,0.4)' : '1px solid transparent',
                  color: active ? '#fff' : 'rgba(165,180,252,0.8)',
                }}>
                <span className="text-lg w-6 text-center">{item.icon}</span>
                <span className="text-sm font-medium">{item.label}</span>
                {active && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />}
              </Link>
            </div>
          );
        })}
      </nav>

      <div className="p-4 text-center" style={{ borderTop: '1px solid rgba(99,102,241,0.15)' }}>
        <p className="text-xs" style={{ color: 'rgba(99,102,241,0.5)' }}>© 2026 ScholarSense</p>
      </div>
    </div>
  );
};

export default Sidebar;
