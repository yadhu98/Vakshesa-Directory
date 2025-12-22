import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Feather } from 'feather-icons-react';
import { api } from '../services/api';
import AppHeader from '../components/AppHeader';

const styles = {
  container: { background: '#fff', minHeight: '100vh' },
  scroll: { maxWidth: 480, margin: '0 auto', padding: 0 },
  loading: { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' },
  headerCard: {
    background: '#000', color: '#fff', padding: 24, textAlign: 'center', borderBottomLeftRadius: 24, borderBottomRightRadius: 24,
  },
  avatar: {
    width: 80, height: 80, borderRadius: '50%', background: '#fff', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, fontWeight: 600, margin: '0 auto 16px',
  },
  name: { fontSize: 24, fontWeight: 700, marginBottom: 4 },
  email: { fontSize: 14, marginBottom: 12 },
  badge: { display: 'inline-block', background: '#fff', color: '#000', padding: '6px 12px', borderRadius: 12, border: '1px solid #E0E0E0', fontSize: 12, fontWeight: 600 },
  statsGrid: { display: 'flex', gap: 12, padding: 16 },
  statCard: { flex: 1, background: '#F5F5F5', padding: 20, borderRadius: 12, alignItems: 'center', border: '1px solid #E0E0E0', textAlign: 'center' },
  statValue: { fontSize: 28, fontWeight: 700, color: '#000', marginBottom: 4 },
  statLabel: { fontSize: 14, color: '#666' },
  section: { background: '#fff', margin: '16px', marginBottom: 16, padding: 16, borderRadius: 12, border: '1px solid #E0E0E0' },
  sectionTitle: { fontSize: 18, fontWeight: 600, color: '#000', marginBottom: 16 },
  infoRow: { marginBottom: 12 },
  infoLabel: { fontSize: 12, color: '#666', marginBottom: 4, fontWeight: 500 },
  infoValue: { fontSize: 15, color: '#000' },
  infoValueMultiline: { lineHeight: '22px' },
  editButton: { background: '#000', color: '#fff', margin: '16px', padding: 16, borderRadius: 12, textAlign: 'center', fontWeight: 600, fontSize: 16, cursor: 'pointer' },
};

const InfoRow = ({ label, value, multiline }: { label: string; value: any; multiline?: boolean }) => (
  <div style={styles.infoRow}>
    <div style={styles.infoLabel}>{label}</div>
    <div style={{ ...styles.infoValue, ...(multiline ? styles.infoValueMultiline : {}) }}>{value}</div>
  </div>
);

const EnhancedProfileScreen = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const userDataStr = localStorage.getItem('userData');
        const currentUser = userDataStr ? JSON.parse(userDataStr) : null;
        const targetUserId = userId || currentUser?._id;
        if (!targetUserId) return;
        const profileRes = await api.get(`/users/${targetUserId}`);
        const userData = profileRes.data.user || profileRes.data;
        // Family name
        let familyName = 'Unknown';
        try {
          const familiesRes = await api.get('/bulk/families');
          const families = familiesRes.data || [];
          const family = families.find((f: any) => f._id === userData.familyId);
          if (family) familyName = family.name;
        } catch {}
        // Tokens and points
        let tokenBalance = 0, totalPoints = 0;
        try {
          const tokenRes = await api.get('/tokens/balance', { params: { userId: targetUserId } });
          tokenBalance = tokenRes.data.balance || 0;
        } catch {}
        try {
          const pointsRes = await api.get(`/points/user/${targetUserId}`);
          totalPoints = pointsRes.data.totalPoints || 0;
        } catch {}
        setProfile({ ...userData, familyName, tokenBalance, totalPoints });
      } catch {
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [userId]);

  if (loading) return <div style={styles.loading}><span>Loading...</span></div>;
  if (!profile) return <div style={styles.loading}><span>Profile not found</span></div>;
  
  const isOwnProfile = () => {
    const userDataStr = localStorage.getItem('userData');
    const currentUser = userDataStr ? JSON.parse(userDataStr) : null;
    return currentUser?._id === profile._id;
  };

  return (
    <div style={styles.container}>
      <AppHeader 
        title={isOwnProfile() ? "My Profile" : "Profile"} 
        showBackButton={true}
        onBack={() => navigate(-1)}
      />
      <div style={styles.headerCard as React.CSSProperties}>
        <div style={styles.avatar}>{profile.firstName?.[0]}{profile.lastName?.[0]}</div>
        <div style={styles.name}>{profile.firstName} {profile.lastName}</div>
        <div style={styles.email}>{profile.email}</div>
        <div><span style={styles.badge}>{profile.house || 'No House'}</span></div>
      </div>
      <div style={styles.statsGrid}>
        <div style={styles.statCard as React.CSSProperties}>
          <Feather name="credit-card" size={24} />
          <div style={styles.statValue}>{profile.tokenBalance || 0}</div>
          <div style={styles.statLabel}>Tokens</div>
        </div>
        <div style={styles.statCard as React.CSSProperties}>
          <Feather name="star" size={24} />
          <div style={styles.statValue}>{profile.totalPoints || 0}</div>
          <div style={styles.statLabel}>Points</div>
        </div>
      </div>
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Personal Information</div>
        <InfoRow label="Full Name" value={`${profile.firstName} ${profile.lastName}`} />
        <InfoRow label="Email" value={profile.email} />
        {profile.phone && <InfoRow label="Phone" value={profile.phone} />}
        {profile.gender && <InfoRow label="Gender" value={profile.gender} />}
        {profile.profession && <InfoRow label="Profession" value={profile.profession} />}
        {profile.address && <InfoRow label="Address" value={profile.address} multiline />}
        <InfoRow label="Status" value={profile.isAlive !== false ? 'Active' : 'Inactive'} />
      </div>
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Family Information</div>
        <InfoRow label="Family ID" value={profile.familyId} />
        <InfoRow label="Family Name" value={profile.familyName || 'Unknown'} />
        <InfoRow label="House" value={profile.house || 'Not assigned'} />
        {profile.fatherId && <InfoRow label="Father ID" value={profile.fatherId} />}
        {profile.motherId && <InfoRow label="Mother ID" value={profile.motherId} />}
        {profile.spouseId && <InfoRow label="Spouse ID" value={profile.spouseId} />}
        {profile.children && profile.children.length > 0 && (
          <InfoRow label="Children" value={`${profile.children.length} children`} />
        )}
      </div>
      <div style={styles.section}>
        <div style={styles.sectionTitle}>Account Information</div>
        <InfoRow label="User ID" value={profile._id} />
        <InfoRow label="Role" value={profile.role} />
        {profile.createdAt && (
          <InfoRow label="Member Since" value={new Date(profile.createdAt).toLocaleDateString()} />
        )}
      </div>
      {isOwnProfile() && (
        <div 
          style={styles.editButton as React.CSSProperties} 
          onClick={() => navigate('/edit-profile')}
        >
          Edit Profile
        </div>
      )}
    </div>
  );
};

export default EnhancedProfileScreen;
