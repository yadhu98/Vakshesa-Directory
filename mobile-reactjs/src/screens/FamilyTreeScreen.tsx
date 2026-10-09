import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import FamilyTreeVisualization from '../components/FamilyTreeVisualization';
import { relationshipService, userService } from '../services/api';

const FamilyTreeScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [focusUserId, setFocusUserId] = useState('');
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [memberRelationships, setMemberRelationships] = useState<any[]>([]);
  const returnTo = (location.state as any)?.returnTo as string | undefined;
  const returnTab = (location.state as any)?.returnTab as string | undefined;

  const openMemberModal = (member: any) => {
    const memberId = String(member._id || member.id || '');
    setSelectedMember({ ...member, _id: memberId });
    setMemberRelationships([]);
    userService.getUserProfile(memberId)
      .then(response => setSelectedMember((current: any) => current?._id === memberId ? { ...current, ...(response.data?.user || response.data), _id: memberId } : current))
      .catch(() => undefined);
    relationshipService.getProfileRelationships(memberId)
      .then(response => setMemberRelationships(response.data.relationships || []))
      .catch(() => setMemberRelationships([]));
  };
  useEffect(() => {
    try {
      const storedUser = JSON.parse(localStorage.getItem('userData') || '{}');
      setFocusUserId(String(storedUser._id || storedUser.id || ''));
    }
    catch { setFocusUserId(''); }
    relationshipService.getFamilyTree()
      .then(response => setData(response.data))
      .catch(error => setError(error?.response?.data?.message || 'Could not load the family tree'))
      .finally(() => setLoading(false));
  }, []);

  return <div style={{ minHeight: '100vh', paddingBottom: 80, background: '#f5f5f5' }}>
    <AppHeader title="Family Tree" showBackButton onBack={() => returnTo ? navigate(returnTo, { state: { activeTab: returnTab } }) : navigate(-1)} />
    <main style={{ maxWidth: 1100, margin: '0 auto', padding: 16 }}>
      <section style={{ background: '#fff', border: '1px solid #e0e0e0', borderRadius: 14, padding: 16 }}>
        {error ? <p role="alert" style={{ color: '#b42318' }}>{error}</p> : loading ? <p style={{ color: '#666' }}>Loading family tree…</p> : <FamilyTreeVisualization data={data} focusUserId={focusUserId} onSelectMember={openMemberModal} />}
      </section>
    </main>
    {selectedMember && <div role="presentation" onClick={() => setSelectedMember(null)} style={{ position: 'fixed', inset: 0, zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,.55)' }}>
      <section role="dialog" aria-modal="true" aria-label={`${selectedMember.firstName} ${selectedMember.lastName} profile`} onClick={event => event.stopPropagation()} style={{ position: 'relative', width: 'calc(100vw - 32px)', maxWidth: 560, maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box', padding: 24, borderRadius: 16, background: '#fff', boxShadow: '0 8px 36px rgba(0,0,0,.25)' }}>
        <button type="button" aria-label="Close profile" onClick={() => setSelectedMember(null)} style={{ position: 'absolute', top: 12, right: 12, width: 34, height: 34, border: 0, borderRadius: '50%', background: '#f2f2f2', fontSize: 20, cursor: 'pointer' }}>×</button>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 18, paddingTop: 8 }}>
          {selectedMember.profilePicture ? <img src={selectedMember.profilePicture} alt="" style={{ width: 80, height: 80, borderRadius: '50%', objectFit: 'cover', border: '3px solid #111', marginBottom: 12 }} /> : <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#111', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 28, fontWeight: 700, marginBottom: 12 }}>{`${selectedMember.firstName?.[0] || ''}${selectedMember.lastName?.[0] || ''}`.toUpperCase()}</div>}
          <strong style={{ fontSize: 20 }}>{selectedMember.firstName} {selectedMember.lastName}</strong>
          {selectedMember.email && <span style={{ marginTop: 4, color: '#666', fontSize: 14 }}>{selectedMember.email}</span>}
          <span style={{ marginTop: 6, color: '#888', fontSize: 13 }}>{selectedMember.role ? `${selectedMember.role[0].toUpperCase()}${selectedMember.role.slice(1)}` : 'Member'}</span>
        </div>
        <div style={{ display: 'grid', gap: 5, marginBottom: 16, color: '#333', fontSize: 14 }}>
          {selectedMember.phone && <div>📞 {selectedMember.phone}</div>}{selectedMember.house && <div>🏠 {selectedMember.house}</div>}{selectedMember.gender && <div>👤 {`${selectedMember.gender[0].toUpperCase()}${selectedMember.gender.slice(1)}`}</div>}{selectedMember.occupation && <div>💼 {selectedMember.occupation}</div>}{selectedMember.address && <div>📍 {selectedMember.address}</div>}
        </div>
        <section aria-label="Family relationships" style={{ padding: 12, border: '1px solid #e5e5e5', borderRadius: 12 }}>
          <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>Family</h3>
          {memberRelationships.filter((relationship: any) => !relationship.derived).length ? <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>{memberRelationships.filter((relationship: any) => !relationship.derived).map((relationship: any) => <span key={`${relationship.user._id}-${relationship.type}`} style={{ padding: '5px 9px', border: '1px solid #e3e3e3', borderRadius: 999, background: '#f7f7f7', color: '#444', fontSize: 12 }}><strong>{relationship.label}</strong> · {relationship.user.firstName} {relationship.user.lastName}</span>)}</div> : <p style={{ margin: 0, color: '#777', fontSize: 13 }}>No direct family relationships added yet.</p>}
        </section>
      </section>
    </div>}
  </div>;
};

export default FamilyTreeScreen;
