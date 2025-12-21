import React, { useState, useEffect } from 'react';
import AppHeader from '../components/AppHeader';
import { userService } from '../services/api';

interface EditForm {
  firstName: string;
  lastName: string;
  phone: string;
  profession: string;
  address: string;
}

const EditProfileScreen: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [form, setForm] = useState<EditForm>({
    firstName: '',
    lastName: '',
    phone: '',
    profession: '',
    address: '',
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const userId = localStorage.getItem('userId');
        if (!userId) return;
        const res = await userService.getUserProfile(userId);
        const user = res?.data || {};
        setForm({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          phone: user.phone || '',
          profession: user.profession || '',
          address: user.address || '',
        });
      } catch (err) {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value } as EditForm));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const userDataStr = localStorage.getItem('userData');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      const userId = userData?._id || localStorage.getItem('userId');
      if (!userId) throw new Error('User not found');
      await userService.updateUserProfile(userId, form);
      alert('Profile updated!');
    } catch (err: any) {
      alert(err?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ background: '#F5F5F5', minHeight: '100vh' }}>
      <AppHeader title="Edit Profile" />
      <div style={{ padding: '16px', maxWidth: 400, margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', marginTop: 40 }}>Loading...</div>
        ) : (
          <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
            <input
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
              value={form.lastName}
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
