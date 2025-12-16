import React, { useState, useEffect } from 'react';
import { authService } from '@services/api';
import axiosInstance from '@services/api';
import { Layout } from '@components/Layout';

interface FamilyOption {
  _id?: string;
  name: string;
}

const RegisterUser: React.FC = () => {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    role: 'user',
    familyId: '',
    house: 'Kadannamanna' as 'Kadannamanna' | 'Ayiranazhi' | 'Aripra' | 'Mankada',
  });
  const [families, setFamilies] = useState<FamilyOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const loadFamilies = async () => {
      try {
        const res = await axiosInstance.get('/bulk/families');
        setFamilies(res.data || []);
      } catch (e) {
        // ignore families load failure
      }
    };
    loadFamilies();
  }, []);

  const updateField = (key: string, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.familyId) {
        delete (payload as any).familyId;
      }
      await authService.register(payload as any);
      setSuccess('User registered successfully');
      setForm({ firstName: '', lastName: '', email: '', phone: '', password: '', role: 'user', familyId: '', house: 'Kadannamanna' });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow space-y-6">
        <h1 className="text-2xl font-bold">Register New User</h1>
        <p className="text-gray-600 text-sm">Create admin, user, or shopkeeper accounts. Password will be stored securely.</p>

        {error && <div className="bg-red-100 text-red-700 px-4 py-2 rounded">{error}</div>}
        {success && <div className="bg-green-100 text-green-700 px-4 py-2 rounded">{success}</div>}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">First Name</label>
            <input className="input" value={form.firstName} onChange={(e) => updateField('firstName', e.target.value)} required />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Last Name</label>
            <input className="input" value={form.lastName} onChange={(e) => updateField('lastName', e.target.value)} required />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Email</label>
            <input type="email" className="input" value={form.email} onChange={(e) => updateField('email', e.target.value)} required />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-1">Phone</label>
            <input className="input" value={form.phone} onChange={(e) => updateField('phone', e.target.value)} required />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-1">Password</label>
            <input type="password" className="input" value={form.password} onChange={(e) => updateField('password', e.target.value)} required />
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-1">Role</label>
            <select className="input" value={form.role} onChange={(e) => updateField('role', e.target.value)}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
              <option value="shopkeeper">Shopkeeper</option>
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-1">Family (optional)</label>
            <select className="input" value={form.familyId} onChange={(e) => updateField('familyId', e.target.value)}>
              <option value="">-- None / Default --</option>
              {families.map((f) => (
                <option key={f._id || f.name} value={f._id || f.name}>{f.name}</option>
              ))}
            </select>
          </div>
          <div className="md:col-span-1">
            <label className="block text-sm font-medium mb-1">House *</label>
            <select className="input" value={form.house} onChange={(e) => updateField('house', e.target.value)} required>
              <option value="Kadannamanna">Kadannamanna</option>
              <option value="Ayiranazhi">Ayiranazhi</option>
              <option value="Aripra">Aripra</option>
              <option value="Mankada">Mankada</option>
            </select>
          </div>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary px-6 py-2 disabled:opacity-50"
            >
              {loading ? 'Registering...' : 'Register User'}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
};

export default RegisterUser;
