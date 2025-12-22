import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
  onInvite?: () => void;
  showInviteButton?: boolean;
}

const colors = {
  primary: '#000000',
  white: '#FFFFFF',
  gray: {
    light: '#F5F5F5',
    border: '#E0E0E0',
  },
};

const AppHeader: React.FC<AppHeaderProps> = ({ title, showBack = false, showBackButton = false, onBack, onInvite, showInviteButton = false }) => {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

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
    navigate('/');
  };

  return (
    <header style={{ background: colors.primary, color: colors.white, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 10 }}>
      {(showBack || showBackButton) && (
        <button onClick={onBack} style={{ background: 'none', border: 'none', color: colors.white, fontSize: 20, marginRight: 12 }}>&larr;</button>
      )}
      <h1 style={{ margin: 0, fontSize: 20, flex: 1 }}>{title}</h1>
      {showInviteButton && onInvite && (
        <button
          onClick={onInvite}
          style={{
            background: '#25D366',
            border: 'none',
            borderRadius: 8,
            padding: '8px 12px',
            marginRight: 12,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            color: colors.white,
            fontSize: 14,
            fontWeight: 600,
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" fill="currentColor"/>
          </svg>
          Generate Invite
        </button>
      )}
      <button onClick={() => setShowProfileModal(true)} style={{ background: 'none', border: 'none', marginLeft: 0, padding: 0, cursor: 'pointer' }}>
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
