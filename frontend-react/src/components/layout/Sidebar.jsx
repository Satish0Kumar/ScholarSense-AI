import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../utils/AuthContext';

const Sidebar = () => {
  const location = useLocation();
  const { user } = useAuth();

  const isActive = (path) => location.pathname === path;

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊', section: 'Overview' },
    { path: '/students', label: 'Students', icon: '👨🎓', section: 'Students' },
    { path: '/academics', label: 'Academics', icon: '📚', section: 'Academics' },
    { path: '/risk-analytics', label: 'Risk & Analytics', icon: '🤖', section: 'Risk & Analytics' },
    { path: '/alerts', label: 'Alerts', icon: '📬', section: 'Communication' },
  ];

  if (user?.role === 'admin') {
    navItems.push({ path: '/users', label: 'User Management', icon: '⚙️', section: 'Admin' });
  }

  let currentSection = '';

  return (
    <div className="w-64 bg-gray-900 text-white h-screen fixed left-0 top-0 overflow-y-auto">
      <div className="p-6">
        <h1 className="text-2xl font-bold">ScholarSense</h1>
        <p className="text-sm text-gray-400">AI Academic Intelligence</p>
      </div>
      <nav className="mt-6">
        {navItems.map((item) => {
          const showSection = item.section !== currentSection;
          currentSection = item.section;
          return (
            <div key={item.path}>
              {showSection && (
                <div className="px-6 py-2 text-xs text-gray-500 uppercase font-semibold">
                  {item.section}
                </div>
              )}
              <Link
                to={item.path}
                className={`flex items-center px-6 py-3 hover:bg-gray-800 transition ${
                  isActive(item.path) ? 'bg-gray-800 border-l-4 border-blue-500' : ''
                }`}
              >
                <span className="mr-3 text-xl">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            </div>
          );
        })}
      </nav>
    </div>
  );
};

export default Sidebar;
