import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { userService } from '../services/api';
import ImageCropper from '../components/ImageCropper';
import { Camera } from 'feather-icons-react';

interface EditForm {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  countryCode: string;
  gender: string;
  house: string;
  occupation: string;
  address: string;
  linkedin: string;
  instagram: string;
  facebook: string;
  profilePicture?: string;
}

const EditProfileScreen: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [showCropper, setShowCropper] = useState(false);
  const [form, setForm] = useState<EditForm>({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    countryCode: '+91',
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
          countryCode: user.countryCode || '+91',
          gender: user.gender || 'male',
          house: user.house || 'Kadannamanna',
          occupation: user.occupation || '',
          address: user.address || '',
          linkedin: user.linkedin || '',
          instagram: user.instagram || '',
          facebook: user.facebook || '',
          profilePicture: user.profilePicture || '',
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
        // Trigger event to refresh AppHeader
        window.dispatchEvent(new Event('profileUpdated'));
      }
      
      alert('Profile updated successfully!');
      
      // Navigate to directory to show updated profile
      setTimeout(() => {
        navigate('/directory', { replace: true });
      }, 500);
    } catch (err: any) {
      alert('Error: ' + (err?.response?.data?.message || err?.message || 'Failed to update profile'));
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

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setImageSrc(reader.result as string);
        setShowCropper(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImage: string) => {
    setForm(prev => ({ ...prev, profilePicture: croppedImage }));
    setShowCropper(false);
    setImageSrc(null);
  };

  const handleCropCancel = () => {
    setShowCropper(false);
    setImageSrc(null);
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div style={{ background: '#F5F5F5', minHeight: '100vh', paddingBottom: 70 }}>
      <AppHeader title="My Profile" />
      {showCropper && imageSrc && (
        <ImageCropper
          imageSrc={imageSrc}
          onCropComplete={handleCropComplete}
          onCancel={handleCropCancel}
        />
      )}
      <div style={{ padding: '16px', maxWidth: 400, margin: '0 auto' }}>
        {loading ? (
          <div style={{ textAlign: 'center', marginTop: 40 }}>Loading...</div>
        ) : (
          <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
            <div style={sectionTitleStyle}>Personal Information</div>
            
            {/* Profile Picture */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 20 }}>
              <div style={{ position: 'relative' }}>
                {form.profilePicture ? (
                  <img
                    src={form.profilePicture}
                    alt="Profile"
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid #000',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 120,
                      height: 120,
                      borderRadius: '50%',
                      background: '#000',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 40,
                      fontWeight: 700,
                    }}
                  >
                    {getInitials(form.firstName, form.lastName)}
                  </div>
                )}
                <label
                  htmlFor="profilePictureInput"
                  style={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    width: 40,
                    height: 40,
                    borderRadius: '50%',
                    background: '#000',
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    border: '3px solid #F5F5F5',
                  }}
                >
                  <Camera size={20} />
                </label>
                <input
                  id="profilePictureInput"
                  type="file"
                  accept="image/*"
                  onChange={handleImageSelect}
                  style={{ display: 'none' }}
                />
              </div>
              <div style={{ fontSize: 12, color: '#999', marginTop: 8, textAlign: 'center' }}>
                Click camera icon to upload photo
              </div>
            </div>
            
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
            
            <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
              <select
                name="countryCode"
                value={form.countryCode}
                onChange={handleChange}
                style={{ ...inputStyle, marginBottom: 0, width: '35%' }}
              >
                <option value="+91">🇮🇳 +91 India</option>
                <option value="+971">🇦🇪 +971 UAE</option>
                <option value="+966">🇸🇦 +966 Saudi Arabia</option>
                <option value="+965">🇰🇼 +965 Kuwait</option>
                <option value="+974">🇶🇦 +974 Qatar</option>
                <option value="+968">🇴🇲 +968 Oman</option>
                <option value="+973">🇧🇭 +973 Bahrain</option>
                <option value="+1">🇺🇸 +1 USA/Canada</option>
                <option value="+44">🇬🇧 +44 UK</option>
                <option value="+61">🇦🇺 +61 Australia</option>
                <option value="+64">🇳🇿 +64 New Zealand</option>
                <option value="+65">🇸🇬 +65 Singapore</option>
                <option value="+60">🇲🇾 +60 Malaysia</option>
                <option value="+66">🇹🇭 +66 Thailand</option>
                <option value="+63">🇵🇭 +63 Philippines</option>
                <option value="+62">🇮🇩 +62 Indonesia</option>
                <option value="+84">🇻🇳 +84 Vietnam</option>
                <option value="+86">🇨🇳 +86 China</option>
                <option value="+81">🇯🇵 +81 Japan</option>
                <option value="+82">🇰🇷 +82 South Korea</option>
                <option value="+92">🇵🇰 +92 Pakistan</option>
                <option value="+880">🇧🇩 +880 Bangladesh</option>
                <option value="+94">🇱🇰 +94 Sri Lanka</option>
                <option value="+977">🇳🇵 +977 Nepal</option>
                <option value="+20">🇪🇬 +20 Egypt</option>
                <option value="+27">🇿🇦 +27 South Africa</option>
                <option value="+49">🇩🇪 +49 Germany</option>
                <option value="+33">🇫🇷 +33 France</option>
                <option value="+39">🇮🇹 +39 Italy</option>
                <option value="+34">🇪🇸 +34 Spain</option>
                <option value="+31">🇳🇱 +31 Netherlands</option>
                <option value="+32">🇧🇪 +32 Belgium</option>
                <option value="+41">🇨🇭 +41 Switzerland</option>
                <option value="+43">🇦🇹 +43 Austria</option>
                <option value="+46">🇸🇪 +46 Sweden</option>
                <option value="+47">🇳🇴 +47 Norway</option>
                <option value="+45">🇩🇰 +45 Denmark</option>
                <option value="+358">🇫🇮 +358 Finland</option>
                <option value="+353">🇮🇪 +353 Ireland</option>
                <option value="+351">🇵🇹 +351 Portugal</option>
                <option value="+30">🇬🇷 +30 Greece</option>
                <option value="+48">🇵🇱 +48 Poland</option>
                <option value="+7">🇷🇺 +7 Russia</option>
                <option value="+90">🇹🇷 +90 Turkey</option>
                <option value="+972">🇮🇱 +972 Israel</option>
                <option value="+961">🇱🇧 +961 Lebanon</option>
                <option value="+962">🇯🇴 +962 Jordan</option>
                <option value="+55">🇧🇷 +55 Brazil</option>
                <option value="+52">🇲🇽 +52 Mexico</option>
                <option value="+54">🇦🇷 +54 Argentina</option>
              </select>
              <input
                style={{ ...inputStyle, marginBottom: 0, flex: 1 }}
                type="tel"
                name="phone"
                placeholder="Phone Number *"
                value={form.phone}
                onChange={handleChange}
                required
              />
            </div>

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
              onClick={(e) => {
                e.preventDefault();
                handleSave();
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
            
            <button
              style={{
                width: '100%',
                padding: '16px',
                background: '#fff',
                color: '#000',
                border: '1px solid #E0E0E0',
                borderRadius: 12,
                fontWeight: 600,
                fontSize: 16,
                cursor: 'pointer',
                marginTop: 12,
              }}
              type="button"
              onClick={() => navigate('/change-password')}
            >
              Change Password
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default EditProfileScreen;
