import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { getCurrentUser, isAdminUser, relationshipService, userService } from '../services/api';
import { findRelationshipPath } from './familyTreeKinship';
import FamilyTreeVisualization from './FamilyTreeVisualization';

interface Props {
  profile: { _id: string; firstName?: string; lastName?: string };
  canEdit?: boolean;
}

const FamilyRelationshipsPanel: React.FC<Props> = ({ profile, canEdit = false }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [relationships, setRelationships] = useState<any[]>([]);
  const [familyModal, setFamilyModal] = useState(false);
  const [familyQuery, setFamilyQuery] = useState('');
  const [familyMatches, setFamilyMatches] = useState<any[]>([]);
  const [familyTarget, setFamilyTarget] = useState<any>(null);
  const [familyType, setFamilyType] = useState('father');
  const [familyMessage, setFamilyMessage] = useState('');
  const [savingFamily, setSavingFamily] = useState(false);
  const [relatedTarget, setRelatedTarget] = useState<any>(null);
  const [howModalVisible, setHowModalVisible] = useState(false);
  const [howRelatedData, setHowRelatedData] = useState<any>(null);
  const [howLoading, setHowLoading] = useState(false);
  const [howError, setHowError] = useState('');
  const [relationshipHistory, setRelationshipHistory] = useState<any[]>([]);
  const directRelationships = relationships.filter((relationship: any) => !relationship.derived);
  const hasRelation = (type: string) => directRelationships.some((relationship: any) =>
    String(relationship.type || '').toLowerCase() === type || String(relationship.label || '').toLowerCase() === type,
  );
  const childGenderMismatch = (familyType === 'son' && familyTarget?.gender === 'female') || (familyType === 'daughter' && familyTarget?.gender === 'male');

  const reloadRelationships = useCallback(async () => {
    try {
      const response = await relationshipService.getProfileRelationships(profile._id);
      setRelationships(response.data.relationships || []);
    } catch { setRelationships([]); }
  }, [profile._id]);

  useEffect(() => { void reloadRelationships(); }, [reloadRelationships]);

  const searchFamily = async (value: string) => {
    setFamilyQuery(value);
    setFamilyTarget(null);
    setHowError('');
    setHowRelatedData(null);
    if (value.trim().length < 2) { setFamilyMatches([]); return; }
    try {
      const response = await userService.searchUsers(value, 30);
      setFamilyMatches((response.data.results || []).filter((member: any) => String(member._id) !== String(profile._id)));
    } catch { setFamilyMatches([]); }
  };

  const addFamilyRelationship = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!familyTarget) { setFamilyMessage('Choose a family member first.'); return; }
    setSavingFamily(true); setFamilyMessage('');
    try {
      await relationshipService.add(familyTarget._id, familyType, canEdit && isAdminUser(getCurrentUser()) ? profile._id : undefined);
      await reloadRelationships();
      setFamilyMessage('Relationship added to both profiles.');
      setFamilyTarget(null); setFamilyQuery(''); setFamilyMatches([]);
    } catch (error: any) { setFamilyMessage(error?.response?.data?.message || 'Could not add relationship'); }
    finally { setSavingFamily(false); }
  };

  const removeFamilyRelationship = async (relationship: any) => {
    if (relationship.derived) return;
    if (!window.confirm(`Remove ${relationship.label.toLowerCase()} relationship with ${relationship.user.firstName} ${relationship.user.lastName}? This also removes it from their profile.`)) return;
    try { await relationshipService.remove(relationship._id); await reloadRelationships(); }
    catch (error: any) { alert(error?.response?.data?.message || 'Could not remove relationship'); }
  };

  const checkHowRelated = async () => {
    if (!relatedTarget) return;
    setHowModalVisible(true);
    setHowLoading(true);
    setHowError('');
    setHowRelatedData(null);
    try {
      const currentUser = getCurrentUser();
      const currentUserId = String(currentUser?._id || currentUser?.id || '');
      if (!currentUserId) { setHowError('Please sign in again to find this relationship.'); return; }
      const response = await relationshipService.getFamilyTree();
      const tree = response.data;
      const path = findRelationshipPath(currentUserId, String(relatedTarget._id), tree.members || [], tree.relationships || []);
      if (!path) {
        setHowError(`No relationship path is recorded between you and ${relatedTarget.firstName} ${relatedTarget.lastName}.`);
        return;
      }
      setHowRelatedData({
        members: (tree.members || []).filter((member: any) => path.userIds.includes(String(member._id))),
        relationships: path.relationships,
        relationshipPath: path.userIds,
      });
    } catch (error: any) { setHowError(error?.response?.data?.message || 'Could not find this relationship path'); }
    finally { setHowLoading(false); }
  };

  const loadRelationshipHistory = async () => {
    try { const response = await relationshipService.getHistory(); setRelationshipHistory(response.data.history || []); }
    catch (error: any) { setFamilyMessage(error?.response?.data?.message || 'Could not load relationship history'); }
  };

  return <section style={{ padding: 16, background: '#fff', border: '1px solid #e5e5e5', borderRadius: 14 }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 14 }}>
      <h2 style={{ margin: 0, fontSize: 20 }}>Family &amp; Relationships</h2>
      {canEdit && <button type="button" onClick={() => { setFamilyModal(true); setFamilyMessage(''); setFamilyQuery(''); setFamilyMatches([]); setFamilyTarget(null); }} style={{ border: 0, borderRadius: 8, padding: '8px 10px', background: '#111', color: '#fff', fontWeight: 600, cursor: 'pointer' }}>＋ Add</button>}
    </div>
    {directRelationships.length === 0 ? <p style={{ margin: '0 0 14px', color: '#666', fontSize: 14 }}>No direct family relationships added yet.</p> : <div style={{ display: 'grid', gap: 8, marginBottom: 14 }}>
      {directRelationships.map((relationship: any) => <div key={`${relationship.user._id}-${relationship.type}`} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '9px 10px', border: '1px solid #e5e5e5', borderRadius: 9 }}>
        <button type="button" onClick={() => navigate(`/profile/${relationship.user._id}`)} style={{ flex: 1, border: 0, padding: 0, background: 'transparent', color: '#111', font: 'inherit', textAlign: 'left', cursor: 'pointer' }}><strong>{relationship.user.firstName} {relationship.user.lastName}</strong><span style={{ display: 'block', marginTop: 2, color: '#666', fontSize: 12 }}>{relationship.label}{relationship.derived ? ' · derived' : ''}</span></button>
        {!relationship.derived && (canEdit || isAdminUser(getCurrentUser())) && <button type="button" aria-label={`Remove relationship with ${relationship.user.firstName}`} onClick={() => removeFamilyRelationship(relationship)} style={{ border: 0, borderRadius: 7, padding: '6px 8px', background: '#f2f2f2', cursor: 'pointer' }}>⋯</button>}
      </div>)}
    </div>}
    <button type="button" onClick={() => navigate('/family-tree', { state: { returnTo: location.pathname, returnTab: 'family' } })} style={{ border: '1px solid #ddd', borderRadius: 8, padding: '9px 12px', background: '#fff', fontWeight: 600, cursor: 'pointer' }}>View Family Tree</button>
    <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #eee' }}>
      <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 7 }}>How am I related?</div>
      <input value={relatedTarget ? `${relatedTarget.firstName} ${relatedTarget.lastName}` : familyQuery} onChange={event => { setRelatedTarget(null); searchFamily(event.target.value); }} placeholder="Find a family member" style={{ width: '100%', boxSizing: 'border-box', padding: 10, border: '1px solid #ccc', borderRadius: 8 }} />
      {!relatedTarget && familyMatches.length > 0 && <div style={{ maxHeight: 150, overflow: 'auto', border: '1px solid #ddd', borderRadius: 8, marginTop: 4 }}>{familyMatches.map(member => <button key={member._id} type="button" onClick={() => { setRelatedTarget(member); setFamilyMatches([]); setHowError(''); setHowRelatedData(null); }} style={{ width: '100%', display: 'block', padding: 9, border: 0, borderBottom: '1px solid #eee', background: '#fff', textAlign: 'left', cursor: 'pointer' }}>{member.firstName} {member.lastName}</button>)}</div>}
      {relatedTarget && <button type="button" onClick={checkHowRelated} style={{ marginTop: 7, padding: '8px 10px', border: 0, borderRadius: 7, background: '#111', color: '#fff', cursor: 'pointer' }}>Find relationship</button>}
    </div>
    {isAdminUser(getCurrentUser()) && <div style={{ marginTop: 14 }}><button type="button" onClick={loadRelationshipHistory} style={{ border: 0, padding: 0, background: 'transparent', color: '#555', textDecoration: 'underline', cursor: 'pointer' }}>View relationship history</button>{relationshipHistory.length > 0 && <div style={{ marginTop: 8, maxHeight: 180, overflow: 'auto', fontSize: 12, color: '#555' }}>{relationshipHistory.map((event: any) => <div key={event._id} style={{ padding: '6px 0', borderBottom: '1px solid #eee' }}>{event.action.replace('family_relationship_', '').replace(/_/g, ' ')} · {new Date(event.occurredAt || event.createdAt).toLocaleString()}</div>)}</div>}</div>}
    {familyModal && <div role="presentation" onClick={() => setFamilyModal(false)} style={{ position: 'fixed', inset: 0, zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, background: 'rgba(0,0,0,.55)' }}>
      <form role="dialog" aria-modal="true" aria-label="Add family relationship" onSubmit={addFamilyRelationship} onClick={event => event.stopPropagation()} style={{ width: '100%', maxWidth: 430, maxHeight: '85vh', overflow: 'auto', padding: 20, borderRadius: 14, background: '#fff', boxShadow: '0 6px 28px rgba(0,0,0,.2)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><h2 style={{ margin: 0, fontSize: 20 }}>Add family member</h2><button type="button" aria-label="Close" onClick={() => setFamilyModal(false)} style={{ border: 0, background: 'transparent', fontSize: 24, cursor: 'pointer' }}>×</button></div>
        <p style={{ color: '#666', fontSize: 13 }}>Relationship for {profile.firstName} {profile.lastName}</p>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600 }}>Search member<input value={familyTarget ? `${familyTarget.firstName} ${familyTarget.lastName}` : familyQuery} onChange={event => searchFamily(event.target.value)} placeholder="Type a name" style={{ display: 'block', boxSizing: 'border-box', width: '100%', padding: 10, marginTop: 5, border: '1px solid #ccc', borderRadius: 8 }} /></label>
        {!familyTarget && familyMatches.length > 0 && <div style={{ maxHeight: 130, overflow: 'auto', border: '1px solid #ddd', borderRadius: 8, marginTop: 4 }}>{familyMatches.map(member => <button key={member._id} type="button" onClick={() => { setFamilyTarget(member); setFamilyQuery(''); setFamilyMatches([]); if (member.gender === 'female' && familyType === 'son') setFamilyType('daughter'); if (member.gender === 'male' && familyType === 'daughter') setFamilyType('son'); }} style={{ display: 'block', width: '100%', padding: 9, border: 0, borderBottom: '1px solid #eee', background: '#fff', textAlign: 'left', cursor: 'pointer' }}>{member.firstName} {member.lastName} · {member.house || 'Family'}</button>)}</div>}
        <label style={{ display: 'block', marginTop: 13, fontSize: 13, fontWeight: 600 }}>Their relationship to {profile.firstName}<select value={familyType} onChange={event => setFamilyType(event.target.value)} style={{ display: 'block', width: '100%', padding: 10, marginTop: 5, border: '1px solid #ccc', borderRadius: 8, background: '#fff' }}><option value="father" disabled={hasRelation('father')}>Father{hasRelation('father') ? ' (already set)' : ''}</option><option value="mother" disabled={hasRelation('mother')}>Mother{hasRelation('mother') ? ' (already set)' : ''}</option><option value="son" disabled={familyTarget?.gender === 'female'}>Son</option><option value="daughter" disabled={familyTarget?.gender === 'male'}>Daughter</option><option value="brother">Brother</option><option value="sister">Sister</option><option value="spouse" disabled={hasRelation('spouse')}>Spouse{hasRelation('spouse') ? ' (already set)' : ''}</option></select></label>
        {familyMessage && <p aria-live="polite" style={{ color: familyMessage.startsWith('Relationship added') ? '#1b7c4b' : '#b42318', fontSize: 13 }}>{familyMessage}</p>}
        <button type="submit" disabled={savingFamily || !familyTarget || hasRelation(familyType) || childGenderMismatch} style={{ width: '100%', marginTop: 16, padding: 12, border: 0, borderRadius: 8, background: '#111', color: '#fff', fontWeight: 600, cursor: 'pointer', opacity: savingFamily || !familyTarget || hasRelation(familyType) || childGenderMismatch ? .55 : 1 }}>{savingFamily ? 'Adding…' : 'Add relationship'}</button>
      </form>
    </div>}
    {howModalVisible && <div role="presentation" onClick={() => setHowModalVisible(false)} style={{ position: 'fixed', inset: 0, zIndex: 1300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 12, background: 'rgba(0,0,0,.68)' }}>
      <div role="dialog" aria-modal="true" aria-label="Relationship path visualization" onClick={event => event.stopPropagation()} style={{ width: 'min(1100px, 98vw)', maxHeight: '92vh', overflow: 'auto', boxSizing: 'border-box', padding: 20, borderRadius: 16, background: '#fff', boxShadow: '0 8px 36px rgba(0,0,0,.25)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 10 }}><div><h2 style={{ margin: 0, fontSize: 22 }}>How are you related?</h2><p style={{ margin: '4px 0 0', color: '#666', fontSize: 13 }}>{relatedTarget ? `Recorded relationship path to ${relatedTarget.firstName} ${relatedTarget.lastName}.` : 'Your family relationship path.'}</p></div><button type="button" aria-label="Close relationship visualization" onClick={() => setHowModalVisible(false)} style={{ width: 38, height: 38, flex: '0 0 38px', border: 0, borderRadius: '50%', background: '#f2f2f2', fontSize: 22, cursor: 'pointer' }}>×</button></div>
        {howLoading ? <p style={{ color: '#777' }}>Finding relationship…</p> : howError ? <p role="alert" style={{ color: '#b42318' }}>{howError}</p> : howRelatedData && <FamilyTreeVisualization data={howRelatedData} focusUserId={String(getCurrentUser()?._id || getCurrentUser()?.id || '')} relationshipPath={howRelatedData.relationshipPath} initialZoom={.85} showSiblingConnections heading="" description="" />}
      </div>
    </div>}
  </section>;
};

export default FamilyRelationshipsPanel;
