

import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, Phone, Mail } from 'feather-icons-react';
import AppHeader from '../components/AppHeader';
import { userService } from '../services/api';

type House = 'All' | 'Kadannamanna' | 'Ayiranazhi' | 'Aripra' | 'Mankada';

interface Member {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  house?: string;
  profilePicture?: string;
  address?: string;
  profession?: string;
  gender?: string;
  generation?: number;
  role?: string;
}

const colors = {
  primary: '#000000',
  white: '#FFFFFF',
  gray: {
    light: '#F5F5F5',
    border: '#E0E0E0',
    medium: '#999999',
    dark: '#666666',
  },
};

const DirectoryScreen: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHouse, setSelectedHouse] = useState<House>('All');
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<Member | null>(null);

  const houses: House[] = ['All', 'Kadannamanna', 'Mankada', 'Ayiranazhi', 'Aripra'];

  useEffect(() => {
    setLoading(true);
    userService.searchUsers('', 100)
      .then(res => {
        setMembers(res.data.results || []);
        setFilteredMembers(res.data.results || []);
      })
      .catch(() => {
        setMembers([]);
        setFilteredMembers([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!searchQuery && selectedHouse === 'All') {
      setFilteredMembers(members);
    } else {
      let filtered = members;
      
      // Filter by house
      if (selectedHouse !== 'All') {
        filtered = filtered.filter((m: Member) => m.house === selectedHouse);
      }
      
      // Filter by search query
      if (searchQuery) {
        filtered = filtered.filter((m: Member) =>
          `${m.firstName} ${m.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.phone?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      }
      
      setFilteredMembers(filtered);
    }
  }, [searchQuery, selectedHouse, members]);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleMemberClick = (member: Member) => {
    setSelectedMember(member);
    setModalVisible(true);
  };

  return (
    <div style={{ background: colors.gray.light, minHeight: '100vh' }}>
      <AppHeader title="Directory" />
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', background: colors.white, borderRadius: 8, border: `1px solid ${colors.gray.border}`, marginBottom: 16, padding: '0 12px' }}>
          <Search color={colors.gray.medium} style={{ marginRight: 8 }} />
          <input
            style={{ flex: 1, border: 'none', outline: 'none', fontSize: 16, background: 'transparent', padding: '12px 0' }}
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        {/* House Filter Chips */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 16, paddingBottom: 4 }}>
          {houses.map(house => {
            const isSelected = selectedHouse === house;
            return (
              <button
                key={house}
                onClick={() => setSelectedHouse(house)}
                style={{
                  paddingLeft: 20,
                  paddingRight: 20,
                  paddingTop: 10,
                  paddingBottom: 10,
                  borderRadius: 20,
                  background: isSelected ? colors.primary : colors.white,
                  border: `1px solid ${isSelected ? colors.primary : colors.gray.border}`,
                  color: isSelected ? colors.white : colors.gray.dark,
                  fontSize: 14,
                  fontWeight: '500',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s',
                }}
              >
                {house}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', marginTop: 40 }}>Loading...</div>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {filteredMembers.map((member: Member) => (
              <li key={member._id} style={{ background: '#fff', marginBottom: 12, borderRadius: 8, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', display: 'flex', alignItems: 'center', cursor: 'pointer' }} onClick={() => handleMemberClick(member)}>
                <div style={{ width: 48, height: 48, borderRadius: '50%', background: colors.primary, marginRight: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: 18 }}>
                  {member.firstName[0]}{member.lastName[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{member.firstName} {member.lastName}</div>
                  <div style={{ color: colors.gray.dark, fontSize: 14 }}>{member.email}</div>
                  <div style={{ color: colors.gray.medium, fontSize: 13 }}>{member.profession}</div>
                </div>
                <ChevronRight color={colors.gray.medium} />
              </li>
            ))}
            {filteredMembers.length === 0 && (
              <div style={{ textAlign: 'center', color: colors.gray.medium, marginTop: 40 }}>No members found.</div>
            )}
          </ul>
        )}
      </div>

      {/* Member Details Modal */}
      {modalVisible && selectedMember && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: colors.white, borderRadius: 16, minWidth: 300, maxWidth: 340, boxShadow: '0 2px 16px rgba(0,0,0,0.12)', padding: 24 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: colors.primary, color: colors.white, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, fontWeight: 700, marginBottom: 8 }}>{getInitials(selectedMember.firstName, selectedMember.lastName)}</div>
              <div style={{ fontWeight: 700, fontSize: 20, color: colors.primary, marginBottom: 4 }}>{selectedMember.firstName} {selectedMember.lastName}</div>
              <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>{selectedMember.email}</div>
              <div style={{ fontSize: 13, color: '#999', marginBottom: 8 }}>{selectedMember.role ? selectedMember.role.charAt(0).toUpperCase() + selectedMember.role.slice(1) : 'Member'}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
              {selectedMember.phone && <div style={{ fontSize: 14, color: '#333' }}>📞 {selectedMember.phone}</div>}
              {selectedMember.house && <div style={{ fontSize: 14, color: '#333' }}>🏠 {selectedMember.house}</div>}
              {selectedMember.profession && <div style={{ fontSize: 14, color: '#333' }}>💼 {selectedMember.profession}</div>}
              {selectedMember.address && <div style={{ fontSize: 14, color: '#333' }}>🏡 {selectedMember.address}</div>}
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button onClick={() => setModalVisible(false)} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid #E0E0E0', background: '#fff', color: colors.primary, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Close</button>
              <a href={`tel:${selectedMember.phone}`} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: colors.primary, color: colors.white, fontWeight: 600, fontSize: 15, cursor: 'pointer', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Phone />Call</a>
              <a href={`mailto:${selectedMember.email}`} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: colors.primary, color: colors.white, fontWeight: 600, fontSize: 15, cursor: 'pointer', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Mail />Email</a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectoryScreen;
