import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="min-h-screen flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)' }}>
      <div className="text-center space-y-6 p-8">
        <div className="text-9xl font-bold" style={{ color: 'rgba(99,102,241,0.3)' }}>404</div>
        <h1 className="text-3xl font-bold text-white">Page Not Found</h1>
        <p className="text-lg" style={{ color: 'rgba(165,180,252,0.7)' }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link
          to="/dashboard"
          className="inline-block px-6 py-3 rounded-xl text-sm font-semibold text-white transition-all duration-200"
          style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
          onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          🏠 Back to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
