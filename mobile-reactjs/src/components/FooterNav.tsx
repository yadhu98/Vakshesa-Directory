
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Book, User } from 'feather-icons-react';

const navItems = [
  { label: 'Directory', path: '/directory', icon: <Book size={22} /> },
  { label: 'Edit Profile', path: '/edit-profile', icon: <User size={22} /> },
];

const FooterNav: React.FC = () => {
  const location = useLocation();
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
      {navItems.map(item => (
        <Link
          key={item.path}
          to={item.path}
          style={{
            textDecoration: 'none',
            color: location.pathname === item.path ? '#000' : '#999',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            fontWeight: location.pathname === item.path ? 600 : 400,
            fontSize: 13,
          }}
        >
          <span style={{ fontSize: 22, marginBottom: 2 }}>{item.icon}</span>
          {item.label}
        </Link>
      ))}
    </nav>
  );
};

export default FooterNav;
