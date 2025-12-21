import React, { useState, useEffect } from 'react';
import AppHeader from '../components/AppHeader';
import { userService, api } from '../services/api';

interface EditForm {
  firstName: string;
  lastName: string;
  phone: string;
  profession: string;
  address: string;
}

const EditProfileScreen: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EditForm>({
    firstName: '',
    lastName: '',
    phone: '',
    profession: '',
    address: '',
  });

  useEffect(() => {
    const userId = localStorage.getItem('userId');
    if (!userId) {
      setLoading(false);
      return;
    }
    userService.getUserProfile(userId)
      .then(res => {
        setForm({
          firstName: res.data.firstName || '',
          lastName: res.data.lastName || '',
          phone: res.data.phone || '',
          profession: res.data.profession || '',
          address: res.data.address || '',
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const userDataStr = localStorage.getItem('userData');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      const userId = userData?._id;
      if (!userId) throw new Error('User not found');
      await userService.updateUserProfile(userId, form);
      alert('Profile updated!');
    } catch {
        const [form, setForm] = useState({
          firstName: '',
          lastName: '',
          phone: '',
          profession: '',
          address: '',
        });
    <div style={{ background: '#F5F5F5', minHeight: '100vh' }}>
      <AppHeader title="Edit Profile" />
      <div style={{ padding: '16px', maxWidth: 400, margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', marginTop: 40 }}>Loading...</div>
        ) : (
          <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
          const loadProfile = async () => {
            setLoading(true);
            try {
              const userDataStr = localStorage.getItem('userData');
              const currentUser = userDataStr ? JSON.parse(userDataStr) : null;
              if (!currentUser?._id) return;
              const profileRes = await api.get(`/users/${currentUser._id}`);
              const userData = profileRes.data.user || profileRes.data;
              setForm({
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                phone: userData.phone || '',
                profession: userData.profession || '',
                address: userData.address || '',
              });
            } catch {}
            setLoading(false);
          };
          loadProfile();
              style={{ width: '100%', padding: '10px', marginBottom: 12, borderRadius: 4, border: '1px solid #ccc' }}
              type="text"
              name="firstName"
              placeholder="First Name"
              value={form.firstName}
              onChange={handleChange}
              required
            />
            <input
              style={{ width: '100%', padding: '10px', marginBottom: 12, borderRadius: 4, border: '1px solid #ccc' }}
              type="text"
              name="lastName"
              placeholder="Last Name"
            await userService.updateUserProfile(userId, form);
              onChange={handleChange}
              required
            />
            <input
              style={{ width: '100%', padding: '10px', marginBottom: 12, borderRadius: 4, border: '1px solid #ccc' }}
              type="text"
              name="phone"
              placeholder="Phone"
              value={form.phone}
              onChange={handleChange}
            />
            <input
              style={{ width: '100%', padding: '10px', marginBottom: 12, borderRadius: 4, border: '1px solid #ccc' }}
              type="text"
              name="profession"
              placeholder="Profession"
              value={form.profession}
              onChange={handleChange}
            />
            <input
              style={{ width: '100%', padding: '10px', marginBottom: 12, borderRadius: 4, border: '1px solid #ccc' }}
              type="text"
              name="address"
              placeholder="Address"
              value={form.address}
              onChange={handleChange}
            />
            <button
              style={{ width: '100%', padding: '10px', background: '#000', color: '#fff', border: 'none', borderRadius: 4, fontWeight: 600 }}
              type="submit"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditProfileScreen;
