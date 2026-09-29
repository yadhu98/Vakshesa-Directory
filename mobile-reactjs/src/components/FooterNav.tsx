
import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Book, User, Shield } from 'feather-icons-react';
import { adminService, isAdminUser } from '../services/api';

const baseItems = [
  { label: 'Directory', path: '/directory', icon: <Book size={22} /> },
  { label: 'My Profile', path: '/edit-profile', icon: <User size={22} /> },
];

const adminItem = { label: 'Admin', path: '/admin', icon: <Shield size={22} /> };

const FooterNav: React.FC = () => {
  const location = useLocation();
  const [isAdmin, setIsAdmin] = useState<boolean>(isAdminUser());
  const [pendingCount, setPendingCount] = useState<number>(0);

  useEffect(() => {
    const admin = isAdminUser();
    setIsAdmin(admin);
    if (!admin) {
      setPendingCount(0);
      return;
    }
    let ignore = false;
    const loadCount = () => {
      adminService.getRegistrationRequests('Pending')
        .then(res => { if (!ignore) setPendingCount((res.data?.requests || []).length); })
        .catch(() => { if (!ignore) setPendingCount(0); });
    };
    loadCount();
    window.addEventListener('adminRequestsUpdated', loadCount);
    return () => {
      ignore = true;
      window.removeEventListener('adminRequestsUpdated', loadCount);
    };
  }, [location.pathname]);

  const navItems = isAdmin ? [baseItems[0], adminItem, baseItems[1]] : baseItems;

  return (
    <nav style={{
      position: 'fixed',
      left: 0,
      right: 0,
      bottom: 0,
      background: '#fff',
      borderTop: '1px solid #E0E0E0',
      display: 'flex',
      justifyContent: 'space-around',
      alignItems: 'center',
      height: 56,
      zIndex: 100,
    }}>
      {navItems.map(item => {
        const active = location.pathname === item.path;
        const showBadge = item.path === '/admin' && pendingCount > 0;
        return (
          <Link
            key={item.path}
            to={item.path}
            style={{
              textDecoration: 'none',
              color: active ? '#000' : '#999',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              fontWeight: active ? 600 : 400,
              fontSize: 13,
            }}
          >
            <span style={{ position: 'relative', lineHeight: 0 }}>
              {item.icon}
              {showBadge && (
                <span style={{
                  position: 'absolute',
                  top: -6,
                  right: -10,
                  minWidth: 16,
                  height: 16,
                  padding: '0 4px',
                  borderRadius: 8,
                  background: '#D32F2F',
                  color: '#fff',
                  fontSize: 10,
                  fontWeight: 700,
                  lineHeight: '16px',
                  textAlign: 'center',
                }}>{pendingCount > 99 ? '99+' : pendingCount}</span>
              )}
            </span>
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
};

export default FooterNav;
