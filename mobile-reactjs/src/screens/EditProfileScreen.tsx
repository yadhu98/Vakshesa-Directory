import React, { useState, useEffect } from 'react';
import AppHeader from '../components/AppHeader';
import { userService } from '../services/api';
import ImageCropper from '../components/ImageCropper';
import UserSearchModal from '../components/UserSearchModal';
import { Camera, X, Plus } from 'feather-icons-react';

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
  fatherId?: string;
  motherId?: string;
  spouseId?: string;
  children?: string[];
  siblings?: string[];
}

interface FamilyMember {
  _id: string;
  firstName: string;
  lastName: string;
  profilePicture?: string;
}

const EditProfileScreen: React.FC = () => {
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

  // Family relationship states
  const [familyMembers, setFamilyMembers] = useState<{
    father?: FamilyMember;
    mother?: FamilyMember;
    spouse?: FamilyMember;
    children: FamilyMember[];
    siblings: FamilyMember[];
  }>({
    children: [],
    siblings: []
  });

  const [searchModalConfig, setSearchModalConfig] = useState<{
    isOpen: boolean;
    type: 'father' | 'mother' | 'spouse' | 'child' | 'sibling';
    title: string;
  }>({
    isOpen: false,
    type: 'father',
    title: ''
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
          fatherId: user.fatherId || '',
          motherId: user.motherId || '',
          spouseId: user.spouseId || '',
          children: user.children || [],
          siblings: user.siblings || [],
        });

        // Load family member details if IDs exist
        const loadedFamilyMembers: any = { children: [], siblings: [] };
        
        if (user.fatherId) {
          try {
            const fatherRes = await userService.getUserProfile(user.fatherId);
            if (fatherRes?.data) {
              loadedFamilyMembers.father = {
                _id: fatherRes.data._id,
                firstName: fatherRes.data.firstName,
                lastName: fatherRes.data.lastName,
                profilePicture: fatherRes.data.profilePicture
              };
            }
          } catch (err) {
            console.error('Error loading father:', err);
          }
        }

        if (user.motherId) {
          try {
            const motherRes = await userService.getUserProfile(user.motherId);
            if (motherRes?.data) {
              loadedFamilyMembers.mother = {
                _id: motherRes.data._id,
                firstName: motherRes.data.firstName,
                lastName: motherRes.data.lastName,
                profilePicture: motherRes.data.profilePicture
              };
            }
          } catch (err) {
            console.error('Error loading mother:', err);
          }
        }

        if (user.spouseId) {
          try {
            const spouseRes = await userService.getUserProfile(user.spouseId);
            if (spouseRes?.data) {
              loadedFamilyMembers.spouse = {
                _id: spouseRes.data._id,
                firstName: spouseRes.data.firstName,
                lastName: spouseRes.data.lastName,
                profilePicture: spouseRes.data.profilePicture
              };
            }
          } catch (err) {
            console.error('Error loading spouse:', err);
          }
        }

        if (user.children && user.children.length > 0) {
          for (const childId of user.children) {
            try {
              const childRes = await userService.getUserProfile(childId);
              if (childRes?.data) {
                loadedFamilyMembers.children.push({
                  _id: childRes.data._id,
                  firstName: childRes.data.firstName,
                  lastName: childRes.data.lastName,
                  profilePicture: childRes.data.profilePicture
                });
              }
            } catch (err) {
              console.error('Error loading child:', err);
            }
          }
        }

        if (user.siblings && user.siblings.length > 0) {
          for (const siblingId of user.siblings) {
            try {
              const siblingRes = await userService.getUserProfile(siblingId);
              if (siblingRes?.data) {
                loadedFamilyMembers.siblings.push({
                  _id: siblingRes.data._id,
                  firstName: siblingRes.data.firstName,
                  lastName: siblingRes.data.lastName,
                  profilePicture: siblingRes.data.profilePicture
                });
              }
            } catch (err) {
              console.error('Error loading sibling:', err);
            }
          }
        }

        setFamilyMembers(loadedFamilyMembers);
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
      
      // Include family relationship IDs
      const updateData = {
        ...form,
        fatherId: familyMembers.father?._id || '',
        motherId: familyMembers.mother?._id || '',
        spouseId: familyMembers.spouse?._id || '',
        children: familyMembers.children.map(child => child._id),
        siblings: familyMembers.siblings.map(sibling => sibling._id),
      };
      
      const response = await userService.updateUserProfile(userId, updateData);
      
      // Update localStorage with new data - response.data is the updated user object
      if (response?.data) {
        localStorage.setItem('userData', JSON.stringify(response.data));
        // Trigger event to refresh AppHeader
        window.dispatchEvent(new Event('profileUpdated'));
      }
      
      alert('Profile updated successfully!');
      
      // Force reload the page to see changes
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (err: any) {
      alert('Error: ' + (err?.response?.data?.message || err?.message || 'Failed to update profile'));
    } finally {
      setSaving(false);
    }
  };

  // Family relationship management functions
  const openSearchModal = (type: 'father' | 'mother' | 'spouse' | 'child' | 'sibling') => {
    const titles = {
      father: 'Select Father',
      mother: 'Select Mother',
      spouse: 'Select Spouse',
      child: 'Add Child',
      sibling: 'Add Sibling'
    };
    setSearchModalConfig({
      isOpen: true,
      type,
      title: titles[type]
    });
  };

  const handleFamilySelect = (selectedUser: any) => {
    const member: FamilyMember = {
      _id: selectedUser._id,
      firstName: selectedUser.firstName,
      lastName: selectedUser.lastName,
      profilePicture: selectedUser.profilePicture
    };

    setFamilyMembers(prev => {
      const updated = { ...prev };
      if (searchModalConfig.type === 'child') {
        updated.children = [...prev.children, member];
      } else if (searchModalConfig.type === 'sibling') {
        updated.siblings = [...prev.siblings, member];
      } else {
        updated[searchModalConfig.type] = member;
      }
      return updated;
    });

    // Update form state with IDs
    setForm(prev => {
      const updated = { ...prev };
      if (searchModalConfig.type === 'father') {
        updated.fatherId = member._id;
      } else if (searchModalConfig.type === 'mother') {
        updated.motherId = member._id;
      } else if (searchModalConfig.type === 'spouse') {
        updated.spouseId = member._id;
      } else if (searchModalConfig.type === 'child') {
        updated.children = [...(prev.children || []), member._id];
      } else if (searchModalConfig.type === 'sibling') {
        updated.siblings = [...(prev.siblings || []), member._id];
      }
      return updated;
    });

    setSearchModalConfig({ isOpen: false, type: 'father', title: '' });
  };

  const removeFamilyMember = (type: 'father' | 'mother' | 'spouse' | 'child' | 'sibling', id?: string) => {
    if (type === 'father' || type === 'mother' || type === 'spouse') {
      setFamilyMembers(prev => {
        const updated = { ...prev };
        delete updated[type];
        return updated;
      });
      
      setForm(prev => ({
        ...prev,
        [`${type}Id`]: ''
      }));
    } else if (type === 'child' && id) {
      setFamilyMembers(prev => ({
        ...prev,
        children: prev.children.filter(c => c._id !== id)
      }));
      
      setForm(prev => ({
        ...prev,
        children: (prev.children || []).filter(cId => cId !== id)
      }));
    } else if (type === 'sibling' && id) {
      setFamilyMembers(prev => ({
        ...prev,
        siblings: prev.siblings.filter(s => s._id !== id)
      }));
      
      setForm(prev => ({
        ...prev,
        siblings: (prev.siblings || []).filter(sId => sId !== id)
      }));
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

            {/* Family Relationships Section */}
            <div style={{ ...sectionTitleStyle, marginTop: 32 }}>Family</div>
            
            {/* Father */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8, color: '#666' }}>
                Father
              </div>
              {familyMembers.father ? (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: 12, 
                  background: '#F5F5F5', 
                  borderRadius: 8,
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {familyMembers.father.profilePicture ? (
                      <img 
                        src={familyMembers.father.profilePicture} 
                        alt="Father"
                        style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: '50%', 
                        background: '#000', 
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        fontWeight: 600
                      }}>
                        {familyMembers.father.firstName.charAt(0)}
                      </div>
                    )}
                    <span style={{ fontSize: 16, fontWeight: 500 }}>
                      {familyMembers.father.firstName} {familyMembers.father.lastName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFamilyMember('father')}
                    style={{ 
                      background: 'transparent', 
                      border: 'none', 
                      cursor: 'pointer',
                      padding: 4
                    }}
                  >
                    <X size={20} color="#666" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => openSearchModal('father')}
                  style={{
                    width: '100%',
                    padding: 12,
                    background: '#F5F5F5',
                    border: '1px dashed #CCC',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    fontSize: 14,
                    color: '#666'
                  }}
                >
                  <Plus size={18} />
                  Add Father
                </button>
              )}
            </div>

            {/* Mother */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8, color: '#666' }}>
                Mother
              </div>
              {familyMembers.mother ? (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: 12, 
                  background: '#F5F5F5', 
                  borderRadius: 8,
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {familyMembers.mother.profilePicture ? (
                      <img 
                        src={familyMembers.mother.profilePicture} 
                        alt="Mother"
                        style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: '50%', 
                        background: '#000', 
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        fontWeight: 600
                      }}>
                        {familyMembers.mother.firstName.charAt(0)}
                      </div>
                    )}
                    <span style={{ fontSize: 16, fontWeight: 500 }}>
                      {familyMembers.mother.firstName} {familyMembers.mother.lastName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFamilyMember('mother')}
                    style={{ 
                      background: 'transparent', 
                      border: 'none', 
                      cursor: 'pointer',
                      padding: 4
                    }}
                  >
                    <X size={20} color="#666" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => openSearchModal('mother')}
                  style={{
                    width: '100%',
                    padding: 12,
                    background: '#F5F5F5',
                    border: '1px dashed #CCC',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    fontSize: 14,
                    color: '#666'
                  }}
                >
                  <Plus size={18} />
                  Add Mother
                </button>
              )}
            </div>

            {/* Spouse */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8, color: '#666' }}>
                Spouse
              </div>
              {familyMembers.spouse ? (
                <div style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: 12, 
                  background: '#F5F5F5', 
                  borderRadius: 8,
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {familyMembers.spouse.profilePicture ? (
                      <img 
                        src={familyMembers.spouse.profilePicture} 
                        alt="Spouse"
                        style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: '50%', 
                        background: '#000', 
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        fontWeight: 600
                      }}>
                        {familyMembers.spouse.firstName.charAt(0)}
                      </div>
                    )}
                    <span style={{ fontSize: 16, fontWeight: 500 }}>
                      {familyMembers.spouse.firstName} {familyMembers.spouse.lastName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFamilyMember('spouse')}
                    style={{ 
                      background: 'transparent', 
                      border: 'none', 
                      cursor: 'pointer',
                      padding: 4
                    }}
                  >
                    <X size={20} color="#666" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => openSearchModal('spouse')}
                  style={{
                    width: '100%',
                    padding: 12,
                    background: '#F5F5F5',
                    border: '1px dashed #CCC',
                    borderRadius: 8,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    cursor: 'pointer',
                    fontSize: 14,
                    color: '#666'
                  }}
                >
                  <Plus size={18} />
                  Add Spouse
                </button>
              )}
            </div>

            {/* Children */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8, color: '#666' }}>
                Children
              </div>
              {familyMembers.children.map((child) => (
                <div 
                  key={child._id}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: 12, 
                    background: '#F5F5F5', 
                    borderRadius: 8,
                    justifyContent: 'space-between',
                    marginBottom: 8
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {child.profilePicture ? (
                      <img 
                        src={child.profilePicture} 
                        alt="Child"
                        style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: '50%', 
                        background: '#000', 
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        fontWeight: 600
                      }}>
                        {child.firstName.charAt(0)}
                      </div>
                    )}
                    <span style={{ fontSize: 16, fontWeight: 500 }}>
                      {child.firstName} {child.lastName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFamilyMember('child', child._id)}
                    style={{ 
                      background: 'transparent', 
                      border: 'none', 
                      cursor: 'pointer',
                      padding: 4
                    }}
                  >
                    <X size={20} color="#666" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => openSearchModal('child')}
                style={{
                  width: '100%',
                  padding: 12,
                  background: '#F5F5F5',
                  border: '1px dashed #CCC',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                  color: '#666',
                  marginTop: 8
                }}
              >
                <Plus size={18} />
                Add Child
              </button>
            </div>

            {/* Siblings */}
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 8, color: '#666' }}>
                Siblings
              </div>
              {familyMembers.siblings.map((sibling) => (
                <div 
                  key={sibling._id}
                  style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: 12, 
                    background: '#F5F5F5', 
                    borderRadius: 8,
                    justifyContent: 'space-between',
                    marginBottom: 8
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    {sibling.profilePicture ? (
                      <img 
                        src={sibling.profilePicture} 
                        alt="Sibling"
                        style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }}
                      />
                    ) : (
                      <div style={{ 
                        width: 40, 
                        height: 40, 
                        borderRadius: '50%', 
                        background: '#000', 
                        color: '#fff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 16,
                        fontWeight: 600
                      }}>
                        {sibling.firstName.charAt(0)}
                      </div>
                    )}
                    <span style={{ fontSize: 16, fontWeight: 500 }}>
                      {sibling.firstName} {sibling.lastName}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFamilyMember('sibling', sibling._id)}
                    style={{ 
                      background: 'transparent', 
                      border: 'none', 
                      cursor: 'pointer',
                      padding: 4
                    }}
                  >
                    <X size={20} color="#666" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() => openSearchModal('sibling')}
                style={{
                  width: '100%',
                  padding: 12,
                  background: '#F5F5F5',
                  border: '1px dashed #CCC',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  cursor: 'pointer',
                  fontSize: 14,
                  color: '#666',
                  marginTop: 8
                }}
              >
                <Plus size={18} />
                Add Sibling
              </button>
            </div>

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
          </form>
        )}
      </div>

      {/* User Search Modal for Family Relationships */}
      <UserSearchModal
        isOpen={searchModalConfig.isOpen}
        onClose={() => setSearchModalConfig({ isOpen: false, type: 'father', title: '' })}
        onSelect={handleFamilySelect}
        title={searchModalConfig.title}
        excludeUserId={
          (() => {
            const userDataStr = localStorage.getItem('userData');
            const userData = userDataStr ? JSON.parse(userDataStr) : null;
            return userData?._id || '';
          })()
        }
      />
    </div>
  );
};

export default EditProfileScreen;
