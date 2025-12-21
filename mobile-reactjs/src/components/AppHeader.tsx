import React, { useState, useEffect } from 'react';

interface User {
  _id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  email: string;
  phone?: string;
  house?: string;
  profession?: string;
  role: string;
  familyName?: string;
}

interface AppHeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  showBackButton?: boolean;
}

const colors = {
  primary: '#000000',
  white: '#FFFFFF',
  gray: {
    light: '#F5F5F5',
    border: '#E0E0E0',
  },
};

const AppHeader: React.FC<AppHeaderProps> = ({ title, showBack = false, showBackButton = false, onBack }) => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Replace AsyncStorage with localStorage for web
    const userStr = localStorage.getItem('userData');
    if (userStr) {
      setUser(JSON.parse(userStr));
    }
  }, []);

  // Helper for initials
  const getInitials = (userData?: User | null) => {
    if (!userData) return 'U';
    if (userData.firstName && userData.lastName) {
      return (userData.firstName[0] + userData.lastName[0]).toUpperCase();
    }
    if (userData.name && typeof userData.name === 'string') {
      const trimmedName = userData.name.trim();
      if (trimmedName) {
        const parts = trimmedName.split(' ').filter(p => p.length > 0);
        if (parts.length > 0) {
          return parts.map(n => n[0]).join('').toUpperCase().slice(0, 2);
        }
      }
    }
    return 'U';
  };

  // Logout handler
  const handleLogout = () => {
    localStorage.removeItem('userData');
    setShowProfileModal(false);
    window.location.replace('/');
  };

  return (
    <header style={{ background: colors.primary, color: colors.white, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
      {(showBack || showBackButton) && (
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: colors.white, fontSize: 20, marginRight: 12 }}>&larr;</button>
      )}
      <h1 style={{ margin: 0, fontSize: 20 }}>{title}</h1>
      <button onClick={() => setShowProfileModal(true)} style={{ background: 'none', border: 'none', marginLeft: 12, padding: 0, cursor: 'pointer' }}>
        <span style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: colors.white,
          color: colors.primary,
          fontWeight: 700,
          fontSize: 16,
          border: `2px solid ${colors.white}`,
          boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}>{getInitials(user)}</span>
      </button>
      {showProfileModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: colors.white, padding: 24, borderRadius: 16, minWidth: 300, maxWidth: 340, boxShadow: '0 2px 16px rgba(0,0,0,0.12)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: colors.primary, color: colors.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{getInitials(user)}</div>
              <div style={{ fontWeight: 700, fontSize: 20, color: colors.primary, marginBottom: 4 }}>{user ? (user.name || (user.firstName + ' ' + user.lastName)) : 'User'}</div>
              <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>{user?.email}</div>
              <div style={{ fontSize: 13, color: '#999', marginBottom: 8 }}>{user?.role ? user.role.charAt(0).toUpperCase() + user.role.slice(1) : 'Member'}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
              {user?.phone && <div style={{ fontSize: 14, color: '#333' }}>📞 {user.phone}</div>}
              {user?.house && <div style={{ fontSize: 14, color: '#333' }}>🏠 {user.house}</div>}
              {user?.profession && <div style={{ fontSize: 14, color: '#333' }}>💼 {user.profession}</div>}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={() => setShowProfileModal(false)} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #E0E0E0', background: '#fff', color: colors.primary, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Close</button>
              <button onClick={handleLogout} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: colors.primary, color: colors.white, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Logout</button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default AppHeader;
