import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import FamilyTreeVisualization from '../components/FamilyTreeVisualization';
import { relationshipService } from '../services/api';

const FamilyTreeScreen: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [data, setData] = useState<any>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [focusUserId, setFocusUserId] = useState('');
  const returnTo = (location.state as any)?.returnTo as string | undefined;
  const returnTab = (location.state as any)?.returnTab as string | undefined;
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
        {error ? <p role="alert" style={{ color: '#b42318' }}>{error}</p> : loading ? <p style={{ color: '#666' }}>Loading family tree…</p> : <FamilyTreeVisualization data={data} focusUserId={focusUserId} />}
      </section>
    </main>
  </div>;
};

export default FamilyTreeScreen;
