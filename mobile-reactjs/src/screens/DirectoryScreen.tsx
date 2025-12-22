

import React, { useState, useEffect } from 'react';
import { Search, ChevronRight, Phone, Mail, UserPlus, Copy, Check, X } from 'feather-icons-react';
import AppHeader from '../components/AppHeader';
import { userService } from '../services/api';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

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
  occupation?: string;
  gender?: string;
  generation?: number;
  role?: string;
  linkedin?: string;
  instagram?: string;
  facebook?: string;
  fatherId?: string;
  motherId?: string;
  spouseId?: string;
  children?: string[];
  siblings?: string[];
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
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [inviteCopied, setInviteCopied] = useState(false);
  
  // Family member details
  const [familyMembers, setFamilyMembers] = useState<{
    father?: Member;
    mother?: Member;
    spouse?: Member;
    children: Member[];
    siblings: Member[];
  }>({ children: [], siblings: [] });

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

  // Lock body scroll when modal is open
  useEffect(() => {
    if (modalVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [modalVisible]);

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const handleMemberClick = async (member: Member) => {
    setSelectedMember(member);
    setModalVisible(true);
    
    // Load family member details
    const loadedFamily: any = { children: [], siblings: [] };
    
    // Load direct relationships (stored IDs)
    if (member.fatherId) {
      try {
        const res = await userService.getUserProfile(member.fatherId);
        if (res?.data) {
          loadedFamily.father = res.data;
        }
      } catch (err) {
        console.error('Error loading father:', err);
      }
    }
    
    if (member.motherId) {
      try {
        const res = await userService.getUserProfile(member.motherId);
        if (res?.data) {
          loadedFamily.mother = res.data;
        }
      } catch (err) {
        console.error('Error loading mother:', err);
      }
    }
    
    if (member.spouseId) {
      try {
        const res = await userService.getUserProfile(member.spouseId);
        if (res?.data) {
          loadedFamily.spouse = res.data;
        }
      } catch (err) {
        console.error('Error loading spouse:', err);
      }
    }
    
    if (member.children && member.children.length > 0) {
      for (const childId of member.children) {
        try {
          const res = await userService.getUserProfile(childId);
          if (res?.data) {
            loadedFamily.children.push(res.data);
          }
        } catch (err) {
          console.error('Error loading child:', err);
        }
      }
    }
    
    if (member.siblings && member.siblings.length > 0) {
      for (const siblingId of member.siblings) {
        try {
          const res = await userService.getUserProfile(siblingId);
          if (res?.data) {
            loadedFamily.siblings.push(res.data);
          }
        } catch (err) {
          console.error('Error loading sibling:', err);
        }
      }
    }
    
    // Load reverse relationships (find users who reference this member)
    try {
      const childrenRes = await userService.searchUsers('', 100);
      const allUsers = childrenRes?.data?.results || [];
      
      // Find children (users who have this member as father or mother)
      const reverseChildren = allUsers.filter((u: Member) => 
        u.fatherId === member._id || u.motherId === member._id
      );
      // Add reverse children if not already in the list
      reverseChildren.forEach((child: Member) => {
        if (!loadedFamily.children.find((c: Member) => c._id === child._id)) {
          loadedFamily.children.push(child);
        }
      });
      
      // Include siblings of children as children
      // If UserA has child UserB, and UserB has sibling UserC, include UserC as UserA's child too
      const childrenWithSiblings = [...loadedFamily.children];
      for (const child of childrenWithSiblings) {
        if (child.siblings && child.siblings.length > 0) {
          for (const siblingId of child.siblings) {
            // Find the sibling in allUsers
            const sibling = allUsers.find((u: Member) => u._id === siblingId);
            if (sibling && !loadedFamily.children.find((c: Member) => c._id === sibling._id)) {
              loadedFamily.children.push(sibling);
            }
          }
        }
      }
      
      // Infer spouse from shared children
      // If this member is a parent and we don't have a spouse yet, check if children have another parent
      if (!loadedFamily.spouse && loadedFamily.children.length > 0) {
        for (const child of loadedFamily.children) {
          // If we're the father, check if child has a mother
          if (child.fatherId === member._id && child.motherId) {
            try {
              const motherRes = await userService.getUserProfile(child.motherId);
              if (motherRes?.data) {
                loadedFamily.spouse = motherRes.data;
                break;
              }
            } catch (err) {
              console.error('Error loading inferred spouse (mother):', err);
            }
          }
          // If we're the mother, check if child has a father
          else if (child.motherId === member._id && child.fatherId) {
            try {
              const fatherRes = await userService.getUserProfile(child.fatherId);
              if (fatherRes?.data) {
                loadedFamily.spouse = fatherRes.data;
                break;
              }
            } catch (err) {
              console.error('Error loading inferred spouse (father):', err);
            }
          }
        }
      }
      
      // Find spouse (user who has this member as spouse)
      if (!loadedFamily.spouse) {
        const reverseSpouse = allUsers.find((u: Member) => u.spouseId === member._id);
        if (reverseSpouse) {
          loadedFamily.spouse = reverseSpouse;
        }
      }
      
      // Find siblings (users who have this member in their siblings array)
      const reverseSiblings = allUsers.filter((u: Member) => 
        u.siblings && u.siblings.includes(member._id)
      );
      // Add reverse siblings if not already in the list
      reverseSiblings.forEach((sibling: Member) => {
        if (!loadedFamily.siblings.find((s: Member) => s._id === sibling._id)) {
          loadedFamily.siblings.push(sibling);
        }
      });
      
      // Inherit parent information for siblings
      // If we have siblings, check if any of them have parents set and inherit those
      if (loadedFamily.siblings.length > 0) {
        for (const sibling of loadedFamily.siblings) {
          // If we don't have a father but sibling does, inherit it
          if (!loadedFamily.father && sibling.fatherId) {
            try {
              const fatherRes = await userService.getUserProfile(sibling.fatherId);
              if (fatherRes?.data) {
                loadedFamily.father = fatherRes.data;
              }
            } catch (err) {
              console.error('Error loading inherited father from sibling:', err);
            }
          }
          
          // If we don't have a mother but sibling does, inherit it
          if (!loadedFamily.mother && sibling.motherId) {
            try {
              const motherRes = await userService.getUserProfile(sibling.motherId);
              if (motherRes?.data) {
                loadedFamily.mother = motherRes.data;
              }
            } catch (err) {
              console.error('Error loading inherited mother from sibling:', err);
            }
          }
          
          // Break if we've found both parents
          if (loadedFamily.father && loadedFamily.mother) {
            break;
          }
        }
      }
      
    } catch (err) {
      console.error('Error loading reverse relationships:', err);
    }
    
    setFamilyMembers(loadedFamily);
  };

  const generateInviteLink = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        alert('Please log in to generate invite links.');
        return;
      }
      const response = await axios.post(
        `${API_URL}/invites/create`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setInviteLink(response.data.inviteLink);
      setInviteModalVisible(true);
    } catch (error: any) {
      console.error('Failed to generate invite:', error);
      const errorMessage = error?.response?.data?.message || 'Failed to generate invite link. Please try again.';
      alert(errorMessage);
    }
  };

  const copyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink);
    setInviteCopied(true);
    setTimeout(() => setInviteCopied(false), 2000);
  };

  const shareOnWhatsApp = () => {
    const message = `Join the Vakshesa Family Directory! Register using this invite link: ${inviteLink}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div style={{ background: colors.gray.light, minHeight: '100vh' }}>
      <AppHeader 
        title="Directory" 
        showInviteButton={true}
        onInvite={generateInviteLink}
      />
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
                {member.profilePicture ? (
                  <img
                    src={member.profilePicture}
                    alt={`${member.firstName} ${member.lastName}`}
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: '50%',
                      objectFit: 'cover',
                      marginRight: 16,
                      border: '2px solid #000',
                    }}
                  />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: colors.primary, marginRight: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: 18 }}>
                    {member.firstName[0]}{member.lastName[0]}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{member.firstName} {member.lastName}</div>
                  <div style={{ color: colors.gray.dark, fontSize: 14 }}>{member.email}</div>
                  <div style={{ color: colors.gray.medium, fontSize: 13 }}>{member.occupation}</div>
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
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, overflow: 'auto', padding: '20px 0' }}>
          <div style={{ background: colors.white, borderRadius: 16, minWidth: 300, maxWidth: 340, maxHeight: 'calc(100vh - 40px)', overflowY: 'auto', boxShadow: '0 2px 16px rgba(0,0,0,0.12)', padding: 24, position: 'relative', margin: 'auto' }}>
            {/* Close X button in top right */}
            <button 
              onClick={() => setModalVisible(false)} 
              style={{ 
                position: 'absolute', 
                top: 12, 
                right: 12, 
                width: 32, 
                height: 32, 
                borderRadius: '50%', 
                border: 'none', 
                background: colors.gray.light, 
                cursor: 'pointer', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                transition: 'background 0.2s'
              }}
              onMouseOver={(e) => e.currentTarget.style.background = colors.gray.border}
              onMouseOut={(e) => e.currentTarget.style.background = colors.gray.light}
            >
              <X size={18} color={colors.gray.dark} />
            </button>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 16 }}>
              {selectedMember.profilePicture ? (
                <img
                  src={selectedMember.profilePicture}
                  alt={`${selectedMember.firstName} ${selectedMember.lastName}`}
                  style={{
                    width: 80,
                    height: 80,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '3px solid #000',
                    marginBottom: 12,
                  }}
                />
              ) : (
                <div style={{
                  width: 80,
                  height: 80,
                  borderRadius: '50%',
                  background: colors.primary,
                  color: colors.white,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 32,
                  fontWeight: 700,
                  marginBottom: 12,
                  border: '3px solid #000',
                }}>
                  {getInitials(selectedMember.firstName, selectedMember.lastName)}
                </div>
              )}
              <div style={{ fontWeight: 700, fontSize: 20, color: colors.primary, marginBottom: 4 }}>{selectedMember.firstName} {selectedMember.lastName}</div>
              <div style={{ fontSize: 14, color: '#666', marginBottom: 8 }}>{selectedMember.email}</div>
              <div style={{ fontSize: 13, color: '#999', marginBottom: 8 }}>{selectedMember.role ? selectedMember.role.charAt(0).toUpperCase() + selectedMember.role.slice(1) : 'Member'}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
              {selectedMember.phone && <div style={{ fontSize: 14, color: '#333' }}>📞 {selectedMember.phone}</div>}
              {selectedMember.house && <div style={{ fontSize: 14, color: '#333' }}>🏠 {selectedMember.house}</div>}
              {selectedMember.gender && <div style={{ fontSize: 14, color: '#333' }}>👤 {selectedMember.gender.charAt(0).toUpperCase() + selectedMember.gender.slice(1)}</div>}
              {selectedMember.occupation && <div style={{ fontSize: 14, color: '#333' }}>💼 {selectedMember.occupation}</div>}
              {selectedMember.address && <div style={{ fontSize: 14, color: '#333', lineHeight: '1.5' }}>📍 {selectedMember.address}</div>}
            </div>
            {(selectedMember.linkedin || selectedMember.instagram || selectedMember.facebook) && (
              <div style={{ marginBottom: 16, paddingTop: 12, borderTop: '1px solid #E0E0E0' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#666', marginBottom: 8 }}>Social Media</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {selectedMember.linkedin && (
                    <a href={selectedMember.linkedin} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: '#0077B5', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
                      LinkedIn
                    </a>
                  )}
                  {selectedMember.instagram && (
                    <a href={selectedMember.instagram} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: '#E4405F', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                      Instagram
                    </a>
                  )}
                  {selectedMember.facebook && (
                    <a href={selectedMember.facebook} target="_blank" rel="noopener noreferrer" style={{ fontSize: 14, color: '#1877F2', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                      Facebook
                    </a>
                  )}
                </div>
              </div>
            )}
            {/* Family Section */}
            {(familyMembers.father || familyMembers.mother || familyMembers.spouse || familyMembers.children.length > 0 || familyMembers.siblings.length > 0) && (
              <div style={{ marginBottom: 16, paddingTop: 12, borderTop: '1px solid #E0E0E0' }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#666', marginBottom: 8 }}>Family</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {familyMembers.father && (
                    <div 
                      onClick={() => handleMemberClick(familyMembers.father!)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8,
                        cursor: 'pointer',
                        padding: 8,
                        borderRadius: 8,
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#F5F5F5'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {familyMembers.father.profilePicture ? (
                        <img 
                          src={familyMembers.father.profilePicture} 
                          alt="Father"
                          style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ 
                          width: 32, 
                          height: 32, 
                          borderRadius: '50%', 
                          background: '#000', 
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 600
                        }}>
                          {familyMembers.father.firstName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: 11, color: '#999' }}>Father</div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>
                          {familyMembers.father.firstName} {familyMembers.father.lastName}
                        </div>
                        {familyMembers.father.house && (
                          <div style={{ fontSize: 11, color: '#999' }}>🏠 {familyMembers.father.house}</div>
                        )}
                      </div>
                    </div>
                  )}
                  {familyMembers.mother && (
                    <div 
                      onClick={() => handleMemberClick(familyMembers.mother!)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8,
                        cursor: 'pointer',
                        padding: 8,
                        borderRadius: 8,
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#F5F5F5'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {familyMembers.mother.profilePicture ? (
                        <img 
                          src={familyMembers.mother.profilePicture} 
                          alt="Mother"
                          style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ 
                          width: 32, 
                          height: 32, 
                          borderRadius: '50%', 
                          background: '#000', 
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 600
                        }}>
                          {familyMembers.mother.firstName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: 11, color: '#999' }}>Mother</div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>
                          {familyMembers.mother.firstName} {familyMembers.mother.lastName}
                        </div>
                        {familyMembers.mother.house && (
                          <div style={{ fontSize: 11, color: '#999' }}>🏠 {familyMembers.mother.house}</div>
                        )}
                      </div>
                    </div>
                  )}
                  {familyMembers.spouse && (
                    <div 
                      onClick={() => handleMemberClick(familyMembers.spouse!)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8,
                        cursor: 'pointer',
                        padding: 8,
                        borderRadius: 8,
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#F5F5F5'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {familyMembers.spouse.profilePicture ? (
                        <img 
                          src={familyMembers.spouse.profilePicture} 
                          alt="Spouse"
                          style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ 
                          width: 32, 
                          height: 32, 
                          borderRadius: '50%', 
                          background: '#000', 
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 600
                        }}>
                          {familyMembers.spouse.firstName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: 11, color: '#999' }}>Spouse</div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>
                          {familyMembers.spouse.firstName} {familyMembers.spouse.lastName}
                        </div>
                        {familyMembers.spouse.house && (
                          <div style={{ fontSize: 11, color: '#999' }}>🏠 {familyMembers.spouse.house}</div>
                        )}
                      </div>
                    </div>
                  )}
                  {familyMembers.children.map((child) => (
                    <div 
                      key={child._id} 
                      onClick={() => handleMemberClick(child)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8,
                        cursor: 'pointer',
                        padding: 8,
                        borderRadius: 8,
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#F5F5F5'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {child.profilePicture ? (
                        <img 
                          src={child.profilePicture} 
                          alt="Child"
                          style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ 
                          width: 32, 
                          height: 32, 
                          borderRadius: '50%', 
                          background: '#000', 
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 600
                        }}>
                          {child.firstName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: 11, color: '#999' }}>Child</div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>
                          {child.firstName} {child.lastName}
                        </div>
                        {child.house && (
                          <div style={{ fontSize: 11, color: '#999' }}>🏠 {child.house}</div>
                        )}
                      </div>
                    </div>
                  ))}
                  {familyMembers.siblings.map((sibling) => (
                    <div 
                      key={sibling._id} 
                      onClick={() => handleMemberClick(sibling)}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 8,
                        cursor: 'pointer',
                        padding: 8,
                        borderRadius: 8,
                        transition: 'background 0.2s'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = '#F5F5F5'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      {sibling.profilePicture ? (
                        <img 
                          src={sibling.profilePicture} 
                          alt="Sibling"
                          style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }}
                        />
                      ) : (
                        <div style={{ 
                          width: 32, 
                          height: 32, 
                          borderRadius: '50%', 
                          background: '#000', 
                          color: '#fff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 600
                        }}>
                          {sibling.firstName.charAt(0)}
                        </div>
                      )}
                      <div>
                        <div style={{ fontSize: 11, color: '#999' }}>Sibling</div>
                        <div style={{ fontSize: 14, fontWeight: 500, color: '#333' }}>
                          {sibling.firstName} {sibling.lastName}
                        </div>
                        {sibling.house && (
                          <div style={{ fontSize: 11, color: '#999' }}>🏠 {sibling.house}</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <a 
                href={`https://wa.me/${selectedMember.phone?.replace(/[^0-9]/g, '')}`} 
                target="_blank" 
                rel="noopener noreferrer"
                style={{ 
                  flex: 1, 
                  padding: '10px 0', 
                  borderRadius: 8, 
                  border: 'none', 
                  background: '#25D366', 
                  color: colors.white, 
                  fontWeight: 600, 
                  fontSize: 13, 
                  cursor: 'pointer', 
                  textAlign: 'center', 
                  textDecoration: 'none', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center', 
                  gap: 4 
                }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                WhatsApp
              </a>
              <a href={`tel:${selectedMember.phone}`} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: colors.primary, color: colors.white, fontWeight: 600, fontSize: 15, cursor: 'pointer', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Phone size={18} />Call</a>
              <a href={`mailto:${selectedMember.email}`} style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: colors.primary, color: colors.white, fontWeight: 600, fontSize: 15, cursor: 'pointer', textAlign: 'center', textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}><Mail size={18} />Email</a>
            </div>
          </div>
        </div>
      )}

      {/* Invite Link Modal */}
      {inviteModalVisible && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: colors.white, borderRadius: 16, minWidth: 300, maxWidth: 400, boxShadow: '0 2px 16px rgba(0,0,0,0.12)', padding: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16, gap: 8 }}>
              <UserPlus size={24} color={colors.primary} />
              <h3 style={{ margin: 0, fontSize: 20, fontWeight: 700, color: colors.primary }}>Invite New Member</h3>
            </div>
            <p style={{ color: colors.gray.dark, fontSize: 14, marginBottom: 16 }}>
              Share this link with someone you'd like to invite to the Vakshesa Directory. The link is valid for 7 days.
            </p>
            <div style={{ 
              background: colors.gray.light, 
              padding: 12, 
              borderRadius: 8, 
              border: `1px solid ${colors.gray.border}`,
              marginBottom: 16,
              wordBreak: 'break-all',
              fontSize: 13,
              color: colors.gray.dark,
            }}>
              {inviteLink}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button 
                onClick={shareOnWhatsApp} 
                style={{ 
                  width: '100%',
                  padding: '12px 0', 
                  borderRadius: 8, 
                  border: 'none', 
                  background: '#25D366', 
                  color: colors.white, 
                  fontWeight: 600, 
                  fontSize: 15, 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" fill="currentColor"/>
                </svg>
                Share on WhatsApp
              </button>
              <div style={{ display: 'flex', gap: 8 }}>
                <button 
                  onClick={() => {
                    setInviteModalVisible(false);
                    setInviteCopied(false);
                  }} 
                  style={{ 
                    flex: 1, 
                    padding: '12px 0', 
                    borderRadius: 8, 
                    border: `1px solid ${colors.gray.border}`, 
                    background: colors.white, 
                    color: colors.primary, 
                    fontWeight: 600, 
                    fontSize: 15, 
                    cursor: 'pointer' 
                  }}
                >
                  Close
                </button>
                <button 
                  onClick={copyInviteLink} 
                  style={{ 
                    flex: 1, 
                    padding: '12px 0', 
                    borderRadius: 8, 
                    border: 'none', 
                    background: colors.primary, 
                    color: colors.white, 
                    fontWeight: 600, 
                    fontSize: 15, 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                  }}
                >
                  {inviteCopied ? (
                    <>
                      <Check size={18} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={18} />
                      Copy Link
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectoryScreen;
