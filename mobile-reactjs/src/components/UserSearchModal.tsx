import React, { useState, useEffect } from 'react';
import { Search, X } from 'feather-icons-react';
import { userService } from '../services/api';

interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  house?: string;
  profilePicture?: string;
}

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (user: User) => void;
  title: string;
  excludeUserId?: string;
}

const UserSearchModal: React.FC<UserSearchModalProps> = ({
  isOpen,
  onClose,
  onSelect,
  title,
  excludeUserId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const response = await userService.searchUsers(searchQuery, 50);
      const filteredUsers = (response.data.results || []).filter(
        (user: User) => user._id !== excludeUserId
      );
      setUsers(filteredUsers);
    } catch (err) {
      console.error('Error loading users:', err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, searchQuery]);

  const handleSelect = (user: User) => {
    onSelect(user);
    onClose();
    setSearchQuery('');
  };

  if (!isOpen) return null;

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: 16,
          width: '90%',
          maxWidth: 500,
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E0E0E0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>{title}</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={24} color="#666" />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #E0E0E0' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              background: '#F5F5F5',
              borderRadius: 8,
              padding: '8px 12px',
            }}
          >
            <Search size={20} color="#999" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                flex: 1,
                border: 'none',
                background: 'none',
                marginLeft: 8,
                fontSize: 16,
                outline: 'none',
              }}
              autoFocus
            />
          </div>
        </div>

        {/* User List */}
        <div style={{ flex: 1, overflow: 'auto', padding: '8px 0' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
              Loading...
            </div>
          ) : users.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#999' }}>
              No users found
            </div>
          ) : (
            users.map((user) => (
              <div
                key={user._id}
                onClick={() => handleSelect(user)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '12px 20px',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = '#F5F5F5')
                }
                onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
              >
                {user.profilePicture ? (
                  <img
                    src={user.profilePicture}
                    alt={`${user.firstName} ${user.lastName}`}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      marginRight: 12,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      background: '#000',
                      color: '#fff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 18,
                      fontWeight: 600,
                      marginRight: 12,
                    }}
                  >
                    {getInitials(user.firstName, user.lastName)}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 16 }}>
                    {user.firstName} {user.lastName}
                  </div>
                  <div style={{ fontSize: 14, color: '#666' }}>{user.email}</div>
                  {user.house && (
                    <div style={{ fontSize: 13, color: '#999' }}>
                      🏠 {user.house}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default UserSearchModal;
