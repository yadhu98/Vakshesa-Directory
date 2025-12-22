import React, { useState, useEffect } from 'react';
import AppHeader from '../components/AppHeader';
import { userService } from '../services/api';

interface EditForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  gender: string;
  house: string;
  occupation: string;
  address: string;
  linkedin: string;
  instagram: string;
  facebook: string;
}

const EditProfileScreen: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [form, setForm] = useState<EditForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    gender: 'male',
    house: 'Kadannamanna',
    occupation: '',
    address: '',
    linkedin: '',
    instagram: '',
    facebook: '',
  });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        // Get user data from localStorage
        const userDataStr = localStorage.getItem('userData');
        if (!userDataStr) {
          console.error('No user data found');
          setLoading(false);
          return;
        }
        
        const userData = JSON.parse(userDataStr);
        const userId = userData._id || userData.id;
        
        if (!userId) {
          console.error('No user ID found');
          setLoading(false);
          return;
        }
        
        const res = await userService.getUserProfile(userId);
        const user = res?.data || {};
        
        setForm({
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email || '',
          phone: user.phone || '',
          gender: user.gender || 'male',
          house: user.house || 'Kadannamanna',
          occupation: user.occupation || '',
          address: user.address || '',
          linkedin: user.linkedin || '',
          instagram: user.instagram || '',
          facebook: user.facebook || '',
        });
      } catch (err) {
        console.error('Error loading profile:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value } as EditForm));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const userDataStr = localStorage.getItem('userData');
      const userData = userDataStr ? JSON.parse(userDataStr) : null;
      const userId = userData?._id || localStorage.getItem('userId');
      if (!userId) throw new Error('User not found');
      
      const response = await userService.updateUserProfile(userId, form);
      
      // Update localStorage with new data - response.data is the updated user object
      if (response?.data) {
        localStorage.setItem('userData', JSON.stringify(response.data));
      }
      
      alert('Profile updated!');
    } catch (err: any) {
      alert(err?.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '12px',
    marginBottom: 12,
    borderRadius: 8,
    border: '1px solid #E0E0E0',
    fontSize: 16,
    background: '#FFFFFF',
    boxSizing: 'border-box',
  };

  const sectionTitleStyle: React.CSSProperties = {
    fontSize: 18,
    fontWeight: 600,
    color: '#000',
    marginTop: 20,
    marginBottom: 12,
  };

  const labelStyle: React.CSSProperties = {
    fontSize: 14,
    fontWeight: 500,
    color: '#666',
    marginBottom: 8,
    marginTop: 8,
  };

  return (
    <div style={{ background: '#F5F5F5', minHeight: '100vh', paddingBottom: 70 }}>
      <AppHeader title="My Profile" />
      <div style={{ padding: '16px', maxWidth: 400, margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', marginTop: 40 }}>Loading...</div>
        ) : (
          <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
            <div style={sectionTitleStyle}>Personal Information</div>
            
            <input
              style={inputStyle}
              type="text"
              name="firstName"
              placeholder="First Name *"
              value={form.firstName}
              onChange={handleChange}
              required
            />
            <input
              style={inputStyle}
              type="text"
              name="lastName"
              placeholder="Last Name *"
              value={form.lastName}
              onChange={handleChange}
              required
            />
            <input
              style={{ ...inputStyle, background: '#F5F5F5', cursor: 'not-allowed' }}
              type="email"
              name="email"
              placeholder="Email"
              value={form.email}
              disabled
            />
            <input
              style={inputStyle}
              type="tel"
              name="phone"
              placeholder="Phone (with country code) *"
              value={form.phone}
              onChange={handleChange}
              required
            />

            <div style={labelStyle}>Gender *</div>
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              style={{
                ...inputStyle,
                cursor: 'pointer',
              }}
              required
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>

            <div style={labelStyle}>House *</div>
            <select
              name="house"
              value={form.house}
              onChange={handleChange}
              style={{
                ...inputStyle,
                cursor: 'pointer',
              }}
              required
            >
              <option value="Kadannamanna">Kadannamanna</option>
              <option value="Mankada">Mankada</option>
              <option value="Ayiranazhi">Ayiranazhi</option>
              <option value="Aripra">Aripra</option>
            </select>

            <textarea
              style={{ ...inputStyle, minHeight: 80, fontFamily: 'inherit' }}
              name="address"
              placeholder="Address"
              value={form.address}
              onChange={handleChange as any}
            />

            <input
              style={inputStyle}
              type="text"
              name="occupation"
              placeholder="Profession"
              value={form.occupation}
              onChange={handleChange}
            />

            <div style={labelStyle}>Social Media Links</div>
            <input
              style={inputStyle}
              type="url"
              name="linkedin"
              placeholder="LinkedIn Profile URL (optional)"
              value={form.linkedin}
              onChange={handleChange}
            />
            <input
              style={inputStyle}
              type="url"
              name="instagram"
              placeholder="Instagram Profile URL (optional)"
              value={form.instagram}
              onChange={handleChange}
            />
            <input
              style={inputStyle}
              type="url"
              name="facebook"
              placeholder="Facebook Profile URL (optional)"
              value={form.facebook}
              onChange={handleChange}
            />

            <button
              style={{
                width: '100%',
                padding: '16px',
                background: '#000',
                color: '#fff',
                border: 'none',
                borderRadius: 12,
                fontWeight: 600,
                fontSize: 16,
                cursor: saving ? 'not-allowed' : 'pointer',
                opacity: saving ? 0.6 : 1,
                marginTop: 24,
              }}
              type="submit"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditProfileScreen;
