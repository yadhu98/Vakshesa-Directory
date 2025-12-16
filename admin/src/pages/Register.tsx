import React, { useState } from 'react';
import { authService } from '@services/api';
import axiosInstance from '@services/api';
import { useNavigate } from 'react-router-dom';

const Register: React.FC = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'user',
    validationCode: '',
    isSuperUser: false,
    house: 'Kadannamanna' as 'Kadannamanna' | 'Ayiranazhi' | 'Aripra' | 'Mankada',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeCodes, setActiveCodes] = useState<{ code: string; expiresAt: string }[]>([]);

  const update = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));

  const loadCodes = async () => {
    setError('');
    try {
      const res = await axiosInstance.get('/admin/admin-codes');
      setActiveCodes(res.data.codes || []);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Failed to load codes (login as admin to view)');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    // Debug: ensure handler runs
    console.log('[Register] submit clicked', { ...form, password: '***' });
    if (form.role === 'admin' && !form.isSuperUser && !form.validationCode) {
      setError('Admin registration requires a validation code.');
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form };
      console.log('[Register] calling /auth/register with', { ...payload, password: '***' });
      const response = await authService.register(payload as any);
      setSuccess('Registration successful. You can now login.');
      setForm({ firstName: '', lastName: '', email: '', phone: '', password: '', role: 'user', validationCode: '', isSuperUser: false, house: 'Kadannamanna' });
      if (response.user?.role === 'admin') {
        // optionally auto-login for super user
        if (response.user?.isSuperUser) {
          localStorage.setItem('authToken', response.token);
          navigate('/dashboard');
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-8">
      <div className="w-full max-w-2xl bg-white p-6 rounded-lg shadow">
        <h1 className="text-2xl font-bold mb-2">Create Account</h1>
        <p className="text-sm text-gray-600 mb-4">Register a regular user or an admin. Regular admin requires a validation code from an existing admin. Super User can register directly without a code and auto logs in.</p>
        {error && <div className="bg-red-100 text-red-700 px-4 py-2 rounded mb-4">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 px-4 py-2 rounded mb-4">{success}</div>}
        <form noValidate onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">First Name</label>
            <input className="input" value={form.firstName} onChange={(e) => update('firstName', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Last Name</label>
            <input className="input" value={form.lastName} onChange={(e) => update('lastName', e.target.value)} required />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" className="input" value={form.email} onChange={(e) => update('email', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => update('phone', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" className="input" value={form.password} onChange={(e) => update('password', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Role</label>
            <select className="input" value={form.role} onChange={(e) => update('role', e.target.value)}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">House *</label>
            <select className="input" value={form.house} onChange={(e) => update('house', e.target.value)} required>
              <option value="Kadannamanna">Kadannamanna</option>
              <option value="Ayiranazhi">Ayiranazhi</option>
              <option value="Aripra">Aripra</option>
              <option value="Mankada">Mankada</option>
            </select>
          </div>
          {form.role === 'admin' && (
            <div>
              <label className="block text-sm font-medium mb-1">Validation Code</label>
              <input className="input" value={form.validationCode} onChange={(e) => update('validationCode', e.target.value)} placeholder="6-digit code" disabled={form.isSuperUser} />
            </div>
          )}
          {form.role === 'admin' && (
            <div className="flex items-center gap-2 md:col-span-2">
              <input type="checkbox" id="isSuperUser" checked={form.isSuperUser} onChange={(e) => update('isSuperUser', e.target.checked)} />
              <label htmlFor="isSuperUser" className="text-sm">Super User (bypass code & auto-login)</label>
            </div>
          )}
          <div className="md:col-span-2 flex justify-between items-center mt-2">
            <button type="submit" disabled={loading} className="btn-primary px-6 py-2 disabled:opacity-50">
              {loading ? 'Registering...' : 'Register'}
            </button>
            {form.role === 'admin' && (
              <button type="button" onClick={loadCodes} className="text-sm text-blue-600 hover:text-blue-700 underline">View Active Codes</button>
            )}
          </div>
        </form>
        {activeCodes.length > 0 && (
          <div className="mt-4 bg-blue-50 p-3 rounded">
            <p className="text-sm font-medium mb-2">Active Admin Codes (expires quickly):</p>
            <ul className="text-xs space-y-1">
              {activeCodes.map(c => (
                <li key={c.code} className="flex justify-between">
                  <span>{c.code}</span>
                  <span>{new Date(c.expiresAt).toLocaleTimeString()}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="text-center mt-6 text-sm">
          <button onClick={() => navigate('/login')} className="text-gray-600 hover:text-gray-800 underline">Back to Login</button>
        </div>
      </div>
    </div>
  );
};

export default Register;
