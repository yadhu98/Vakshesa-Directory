
import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Book, User, Shield, Calendar, MoreHorizontal } from 'feather-icons-react';
import { adminService, isAdminUser } from '../services/api';

const BullhornIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M3 10v4h3l12 5V5L6 10H3z" />
    <path d="M6 14l1.5 5h3L9 15" />
    <path d="M21 9v6" />
  </svg>
);

const baseItems = [
  { label: 'Directory', path: '/directory', icon: <Book size={22} /> },
  { label: 'Calendar', path: '/calendar', icon: <Calendar size={22} /> },
  { label: 'Announcements', path: '/announcements', icon: <BullhornIcon /> },
  { label: 'My Profile', path: '/edit-profile', icon: <User size={22} /> },
];

const adminMenuItems = [
  { label: 'Admin', path: '/admin', icon: <Shield size={19} /> },
  { label: 'My Profile', path: '/edit-profile', icon: <User size={19} /> },
];

const FooterNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState<boolean>(isAdminUser());
  const [pendingCount, setPendingCount] = useState<number>(0);
  const [showMore, setShowMore] = useState(false);

  useEffect(() => { setShowMore(false); }, [location.pathname]);

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

  const navItems = isAdmin ? [...baseItems.slice(0, 3), { label: 'More', path: '/more', icon: <MoreHorizontal size={22} /> }] : baseItems;

  return createPortal((
    <>
    {isAdmin && showMore && <>
      <button type="button" aria-label="Close menu" onClick={() => setShowMore(false)} style={{ position: 'fixed', inset: 0, zIndex: 100, border: 0, background: 'transparent' }} />
      <div role="menu" aria-label="More navigation" style={{ position: 'fixed', right: 12, bottom: 66, zIndex: 101, minWidth: 190, padding: 6, border: '1px solid #e0e0e0', borderRadius: 12, background: '#fff', boxShadow: '0 4px 18px rgba(0,0,0,.16)' }}>
        {adminMenuItems.map(item => <Link key={item.path} role="menuitem" to={item.path} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 10px', borderRadius: 8, color: location.pathname === item.path ? '#111' : '#555', background: location.pathname === item.path ? '#f2f3f5' : '#fff', textDecoration: 'none', fontSize: 14, fontWeight: location.pathname === item.path ? 600 : 400 }}>
          <span style={{ position: 'relative', display: 'inline-flex' }}>{item.icon}{item.path === '/admin' && pendingCount > 0 && <span style={{ position: 'absolute', top: -6, right: -9, minWidth: 15, height: 15, padding: '0 3px', borderRadius: 9, background: '#d32f2f', color: '#fff', fontSize: 9, fontWeight: 700, lineHeight: '15px', textAlign: 'center' }}>{pendingCount > 99 ? '99+' : pendingCount}</span>}</span>
          {item.label}
        </Link>)}
      </div>
    </>}
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
      height: 62,
      zIndex: 100,
    }}>
      {navItems.map(item => {
        const isMoreItem = item.path === '/more';
        const active = isMoreItem ? showMore || ['/admin', '/edit-profile'].includes(location.pathname) : location.pathname === item.path;
        return (
          <button
            key={item.path}
            type="button"
            onClick={() => isMoreItem ? setShowMore(value => !value) : navigate(item.path)}
            aria-label={isMoreItem ? 'More navigation options' : item.label}
            aria-expanded={isMoreItem ? showMore : undefined}
            style={{
              flex: 1,
              minWidth: 0,
              height: '100%',
              border: 0,
              background: '#fff',
              textDecoration: 'none',
              color: active ? '#000' : '#999',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              fontWeight: active ? 600 : 400,
              fontSize: 'clamp(10px, 2.8vw, 12px)',
              whiteSpace: 'nowrap',
              cursor: 'pointer',
            }}
          >
            <span style={{ position: 'relative', lineHeight: 0 }}>
              {item.icon}
            </span>
            {item.label}
          </button>
        );
      })}
    </nav>
    </>
  ), document.body);
};

export default FooterNav;
