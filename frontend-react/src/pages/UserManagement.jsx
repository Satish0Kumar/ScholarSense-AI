import { useState, useEffect } from 'react';
import api from '../utils/api';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    role: 'teacher'
  });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users');
      setUsers(response.data.users || response.data || []);
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await api.put(`/users/${editingUser.id}`, {
          full_name: formData.full_name,
          role: formData.role,
          is_active: formData.is_active
        });
        alert('User updated successfully!');
      } else {
        await api.post('/users/create', formData);
        alert('User created successfully!');
      }
      setShowForm(false);
      setEditingUser(null);
      setFormData({
        username: '',
        email: '',
        password: '',
        full_name: '',
        role: 'teacher'
      });
      fetchUsers();
    } catch (error) {
      alert('Operation failed: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: '',
      full_name: user.full_name,
      role: user.role,
      is_active: user.is_active
    });
    setShowForm(true);
  };

  const handleDelete = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) {
      return;
    }
    try {
      await api.delete(`/users/${userId}`);
      alert('User deleted successfully!');
      fetchUsers();
    } catch (error) {
      alert('Delete failed: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    try {
      await api.put(`/users/${userId}`, { is_active: !currentStatus });
      fetchUsers();
    } catch (error) {
      alert('Status update failed: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingUser(null);
    setFormData({
      username: '',
      email: '',
      password: '',
      full_name: '',
      role: 'teacher'
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="flex flex-col items-center gap-3">
        <svg className="animate-spin w-10 h-10 text-indigo-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
        </svg>
        <p className="text-indigo-300 text-sm">Loading users...</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-sm mt-0.5" style={{ color: 'rgba(165,180,252,0.6)' }}>
            Manage admin and teacher accounts
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200"
          style={{ background: showForm ? 'rgba(239,68,68,0.2)' : 'linear-gradient(135deg, #6366f1, #8b5cf6)', border: showForm ? '1px solid rgba(239,68,68,0.4)' : 'none', color: showForm ? '#fca5a5' : '#fff' }}
          onMouseEnter={e => { if (!showForm) e.currentTarget.style.opacity = '0.85'; }}
          onMouseLeave={e => e.currentTarget.style.opacity = '1'}
        >
          {showForm ? '✕ Cancel' : '+ Add New User'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl space-y-5"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.2)', backdropFilter: 'blur(12px)' }}>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: 'rgba(99,102,241,0.15)' }}>
              {editingUser ? '✏️' : '👤'}
            </div>
            <div>
              <p className="text-sm font-bold text-white">{editingUser ? 'Edit User' : 'Create New User'}</p>
              <p className="text-xs" style={{ color: 'rgba(165,180,252,0.5)' }}>{editingUser ? `Editing ${editingUser.username}` : 'Fill in the details below'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {[{label:'Username', key:'username', type:'text', disabled:!!editingUser, placeholder:'e.g. john_doe'},
              {label:'Email',    key:'email',    type:'email', disabled:!!editingUser, placeholder:'e.g. john@school.com'},
              {label:'Full Name',key:'full_name',type:'text', disabled:false,          placeholder:'e.g. John Doe'},
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: 'rgba(165,180,252,0.7)' }}>{f.label}</label>
                <input
                  type={f.type} required disabled={f.disabled}
                  value={formData[f.key]}
                  onChange={e => setFormData({...formData, [f.key]: e.target.value})}
                  placeholder={f.placeholder}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{ background: f.disabled ? 'rgba(99,102,241,0.05)' : 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: f.disabled ? 'rgba(165,180,252,0.4)' : '#fff', cursor: f.disabled ? 'not-allowed' : 'text' }}
                  onFocus={e => { if (!f.disabled) e.target.style.borderColor = '#6366f1'; }}
                  onBlur={e => e.target.style.borderColor = 'rgba(99,102,241,0.25)'}
                />
              </div>
            ))}

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                style={{ color: 'rgba(165,180,252,0.7)' }}>Role</label>
              <select
                required value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
                className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
                style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc' }}
              >
                <option value="teacher" style={{ background: '#1e1b4b' }}>Teacher</option>
                <option value="admin"   style={{ background: '#1e1b4b' }}>Admin</option>
              </select>
            </div>

            {!editingUser && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: 'rgba(165,180,252,0.7)' }}>Password</label>
                <input
                  type="password" required minLength={6}
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  placeholder="Minimum 6 characters"
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#fff' }}
                  onFocus={e => e.target.style.borderColor = '#6366f1'}
                  onBlur={e => e.target.style.borderColor = 'rgba(99,102,241,0.25)'}
                />
              </div>
            )}

            {editingUser && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider mb-1.5"
                  style={{ color: 'rgba(165,180,252,0.7)' }}>Status</label>
                <select
                  value={formData.is_active ? 'active' : 'inactive'}
                  onChange={e => setFormData({...formData, is_active: e.target.value === 'active'})}
                  className="w-full px-4 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
                  style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)', color: '#a5b4fc' }}
                >
                  <option value="active"   style={{ background: '#1e1b4b' }}>Active</option>
                  <option value="inactive" style={{ background: '#1e1b4b' }}>Inactive</option>
                </select>
              </div>
            )}
          </div>

          <div className="flex gap-3">
            <button type="submit"
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-200"
              style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }}
              onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
              onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
              {editingUser ? '💾 Update User' : '✅ Create User'}
            </button>
            <button type="button" onClick={handleCancel}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200"
              style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.25)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.12)'}>
              ✕ Cancel
            </button>
          </div>
        </form>
      )}

      <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(99,102,241,0.2)', backdropFilter: 'blur(12px)' }}>
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(99,102,241,0.2)', background: 'rgba(99,102,241,0.08)' }}>
              {['User', 'Email', 'Role', 'Status', 'Last Login', 'Actions'].map(h => (
                <th key={h} className="px-5 py-3.5 text-left text-xs font-semibold uppercase tracking-wider"
                  style={{ color: 'rgba(165,180,252,0.7)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}
                style={{ borderBottom: '1px solid rgba(99,102,241,0.08)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(99,102,241,0.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                {/* User */}
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                      style={{ background: user.role === 'admin' ? 'linear-gradient(135deg, #8b5cf6, #6366f1)' : 'linear-gradient(135deg, #6366f1, #06b6d4)' }}>
                      {user.full_name?.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-white">{user.full_name}</p>
                      <p className="text-xs font-mono" style={{ color: 'rgba(165,180,252,0.5)' }}>@{user.username}</p>
                    </div>
                  </div>
                </td>
                {/* Email */}
                <td className="px-5 py-3.5">
                  <span className="text-sm" style={{ color: 'rgba(165,180,252,0.8)' }}>{user.email}</span>
                </td>
                {/* Role */}
                <td className="px-5 py-3.5">
                  <span className="px-2.5 py-1 rounded-full text-xs font-semibold"
                    style={user.role === 'admin'
                      ? { background: 'rgba(139,92,246,0.15)', border: '1px solid rgba(139,92,246,0.4)', color: '#c4b5fd' }
                      : { background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.4)', color: '#a5b4fc' }
                    }>
                    {user.role === 'admin' ? '👑 Admin' : '🎓 Teacher'}
                  </span>
                </td>
                {/* Status */}
                <td className="px-5 py-3.5">
                  <button
                    onClick={() => handleToggleStatus(user.id, user.is_active)}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold transition-all duration-200"
                    style={user.is_active
                      ? { background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.4)', color: '#86efac' }
                      : { background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.4)', color: '#fca5a5' }
                    }
                    onMouseEnter={e => e.currentTarget.style.opacity = '0.75'}
                    onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                  >
                    {user.is_active ? '● Active' : '● Inactive'}
                  </button>
                </td>
                {/* Last Login */}
                <td className="px-5 py-3.5">
                  <span className="text-xs" style={{ color: 'rgba(165,180,252,0.5)' }}>
                    {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                  </span>
                </td>
                {/* Actions */}
                <td className="px-5 py-3.5">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(user)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                      style={{ background: 'rgba(99,102,241,0.2)', border: '1px solid rgba(99,102,241,0.4)', color: '#a5b4fc' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.4)'; e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(99,102,241,0.2)'; e.currentTarget.style.color = '#a5b4fc'; }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                      style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.35)', color: '#fca5a5' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.35)'; e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.15)'; e.currentTarget.style.color = '#fca5a5'; }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl"
              style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.25)' }}>👥</div>
            <p className="text-sm font-semibold" style={{ color: '#a5b4fc' }}>No users found</p>
            <p className="text-xs" style={{ color: 'rgba(165,180,252,0.4)' }}>Click "+ Add New User" to create one</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserManagement;
