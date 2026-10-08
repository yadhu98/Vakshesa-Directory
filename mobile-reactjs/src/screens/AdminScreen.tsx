import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, ChevronRight, Users } from 'feather-icons-react';
import AppHeader from '../components/AppHeader';
import { adminService } from '../services/api';
import './AdminScreen.css';

const colors = {
  primary: '#000000',
  white: '#FFFFFF',
  gray: { light: '#F5F5F5', border: '#E0E0E0', medium: '#999999', dark: '#666666' },
  green: '#1B8A5A',
  red: '#C62828',
};

type FilterKey = 'Pending' | 'Approved' | 'Rejected' | 'all';

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: 'Pending', label: 'Pending' },
  { key: 'Approved', label: 'Approved' },
  { key: 'Rejected', label: 'Rejected' },
  { key: 'all', label: 'All' },
];

interface Applicant {
  _id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  house?: string;
  gender?: string;
  occupation?: string;
  address?: string;
  profilePicture?: string;
  createdAt?: string;
}

interface RegistrationRequest {
  id: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: { id: string; name: string } | null;
  rejectionReason?: string;
  invitedBy?: { id: string; name: string; house?: string | null } | null;
  relationshipNote?: string | null;
  applicant?: Applicant | null;
}

const fmtDate = (value?: string) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : date.toLocaleString(undefined, {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
};

const inviterHouseForRequest = (request: RegistrationRequest) => request.invitedBy?.house?.trim() || 'Inviter house unavailable';

const Detail = ({ label, value }: { label: string; value?: string | null }) => (
  value ? (
    <div style={{ display: 'flex', gap: 8, fontSize: 13, marginTop: 4 }}>
      <span style={{ color: colors.gray.medium, minWidth: 78 }}>{label}</span>
      <span style={{ color: '#222', wordBreak: 'break-word' }}>{value}</span>
    </div>
  ) : null
);

const StatusPill = ({ status }: { status: RegistrationRequest['status'] }) => {
  const palette = status === 'Approved'
    ? { bg: '#E7F4EE', fg: colors.green }
    : status === 'Rejected'
      ? { bg: '#FCE9E9', fg: colors.red }
      : { bg: '#FFF6E0', fg: '#8A6100' };
  return (
    <span style={{ background: palette.bg, color: palette.fg, fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 10 }}>
      {status}
    </span>
  );
};

const AdminScreen: React.FC = () => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<FilterKey>('Pending');
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  const [busyId, setBusyId] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string>('');
  const [openHouse, setOpenHouse] = useState<string>('');

  const load = useCallback(async (activeFilter: FilterKey) => {
    setLoading(true);
    setError('');
    try {
      const res = await adminService.getRegistrationRequests(activeFilter);
      const loadedRequests: RegistrationRequest[] = res.data?.requests || [];
      setRequests(loadedRequests);
      setOpenHouse(Array.from(new Set(loadedRequests.map(inviterHouseForRequest))).sort((a, b) => a.localeCompare(b))[0] || '');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Could not load registration requests');
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(filter); }, [filter, load]);

  const requestsByInviterHouse = requests.reduce<Record<string, RegistrationRequest[]>>((groups, request) => {
    const house = inviterHouseForRequest(request);
    (groups[house] ||= []).push(request);
    return groups;
  }, {});
  const houseGroups = Object.entries(requestsByInviterHouse).sort(([a], [b]) => a.localeCompare(b));
  const handleReview = async (request: RegistrationRequest, action: 'approve' | 'reject') => {
    const name = `${request.applicant?.firstName || ''} ${request.applicant?.lastName || ''}`.trim() || 'this applicant';
    let reason: string | undefined;
    if (action === 'reject') {
      const input = window.prompt(`Reject ${name}? You can add a short reason (optional).`, '');
      if (input === null) return;
      reason = input.trim() || undefined;
    } else if (!window.confirm(`Approve ${name}? They will be able to sign in immediately.`)) {
      return;
    }

    setBusyId(request.id);
    try {
      await adminService.reviewRegistrationRequest(request.id, action, reason);
      window.dispatchEvent(new Event('adminRequestsUpdated'));
      await load(filter);
    } catch (err: any) {
      alert(err?.response?.data?.message || `Could not ${action} this request`);
    } finally {
      setBusyId('');
    }
  };

  return (
    <div style={{ background: colors.gray.light, minHeight: '100vh', paddingBottom: 70 }}>
      <AppHeader title="Admin" />
      <div style={{ padding: 16, maxWidth: 480, margin: '0 auto' }}>
        <div className="admin-filter-scroller" style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 22, paddingBottom: 12 }}>
          {FILTERS.map(item => {
            const isSelected = filter === item.key;
            return (
              <button
                key={item.key}
                onClick={() => setFilter(item.key)}
                style={{
                  padding: '10px 18px',
                  borderRadius: 20,
                  background: isSelected ? colors.primary : colors.white,
                  border: `1px solid ${isSelected ? colors.primary : colors.gray.border}`,
                  color: isSelected ? colors.white : colors.gray.dark,
                  fontSize: 14,
                  fontWeight: 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.label}
              </button>
            );
          })}
          <button
            onClick={() => load(filter)}
            aria-label="Refresh requests"
            style={{
              padding: '10px 14px',
              borderRadius: 20,
              background: colors.white,
              border: `1px solid ${colors.gray.border}`,
              color: colors.gray.dark,
              fontSize: 14,
              cursor: 'pointer',
              marginLeft: 'auto',
            }}
          >
            ↻
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', marginTop: 40 }}>Loading…</div>
        ) : error ? (
          <div style={{ textAlign: 'center', marginTop: 40, color: colors.red }}>{error}</div>
        ) : requests.length === 0 ? (
          <div style={{ textAlign: 'center', marginTop: 40, color: colors.gray.medium }}>
            <Users size={32} style={{ marginBottom: 8 }} />
            <div>{filter === 'all' ? 'No' : `No ${filter.toLowerCase()}`} requests.</div>
          </div>
        ) : (
          <div>
            {houseGroups.map(([house, houseRequests]) => {
              const isHouseOpen = openHouse === house;
              return <section key={house} style={{ marginBottom: 12, overflow: 'hidden', border: `1px solid ${colors.gray.border}`, borderRadius: 10, background: colors.white }}>
                <button type="button" aria-expanded={isHouseOpen} onClick={() => setOpenHouse(isHouseOpen ? '' : house)} style={{ display: 'flex', width: '100%', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '13px 14px', border: 0, background: '#eceef1', color: '#222', textAlign: 'left', font: 'inherit', cursor: 'pointer' }}>
                  <span style={{ fontWeight: 700 }}>Invited from {house}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 8, color: colors.gray.dark, fontSize: 12 }}><span>{houseRequests.length} {houseRequests.length === 1 ? 'request' : 'requests'}</span><span aria-hidden="true" style={{ fontSize: 18, lineHeight: 1 }}>{isHouseOpen ? '⌄' : '›'}</span></span>
                </button>
                {isHouseOpen && <ul style={{ listStyle: 'none', padding: '10px 12px 0', margin: 0 }}>
                {houseRequests.map(request => {
              const applicant = request.applicant || {};
              const expanded = expandedId === request.id;
              const fullName = `${applicant.firstName || ''} ${applicant.lastName || ''}`.trim() || 'Unknown applicant';
              const inviterName = request.invitedBy?.name;
              const inviterHouse = request.invitedBy?.house?.trim();
              const inviterDetail = inviterName ? `${inviterName}${inviterHouse ? ` (${inviterHouse})` : ''}` : undefined;
              const busy = busyId === request.id;
              return (
                <li key={request.id} style={{ background: colors.white, marginBottom: 12, borderRadius: 8, padding: 16, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', border: `1px solid ${colors.gray.border}` }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    {applicant.profilePicture ? (
                      <img src={applicant.profilePicture} alt={fullName} style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid #000' }} />
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: '50%', background: colors.primary, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, fontSize: 16, flexShrink: 0 }}>
                        {(applicant.firstName?.[0] || '?').toUpperCase()}{(applicant.lastName?.[0] || '').toUpperCase()}
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 15 }}>{fullName}</div>
                      <div style={{ color: colors.gray.dark, fontSize: 13, wordBreak: 'break-word' }}>{applicant.email}</div>
                      <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <StatusPill status={request.status} />
                      </div>
                    </div>
                    {request.status === 'Pending' ? (
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          aria-label={`Approve ${fullName}`}
                          disabled={busy}
                          onClick={() => handleReview(request, 'approve')}
                          style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: busy ? colors.gray.border : colors.green, color: '#fff', cursor: busy ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: busy ? 0.6 : 1 }}
                        >
                          <Check size={20} />
                        </button>
                        <button
                          aria-label={`Reject ${fullName}`}
                          disabled={busy}
                          onClick={() => handleReview(request, 'reject')}
                          style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: busy ? colors.gray.border : colors.red, color: '#fff', cursor: busy ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: busy ? 0.6 : 1 }}
                        >
                          <X size={20} />
                        </button>
                      </div>
                    ) : applicant._id ? (
                      <button
                        onClick={() => navigate(`/profile/${applicant._id}`)}
                        aria-label={`Open ${fullName}'s profile`}
                        style={{ background: 'none', border: 'none', color: colors.gray.medium, cursor: 'pointer', padding: 4 }}
                      >
                        <ChevronRight size={20} />
                      </button>
                    ) : null}
                  </div>

                  <button
                    onClick={() => setExpandedId(expanded ? '' : request.id)}
                    style={{ background: 'none', border: 'none', color: colors.primary, fontSize: 13, fontWeight: 600, padding: '10px 0 0', cursor: 'pointer', textAlign: 'left' }}
                  >
                    {expanded ? 'Hide details' : 'View submitted details'}
                  </button>

                  {expanded && (
                    <div style={{ marginTop: 8, paddingTop: 8, borderTop: `1px solid ${colors.gray.border}` }}>
                      <Detail label="Phone" value={applicant.phone} />
                      <Detail label="House" value={applicant.house} />
                      <Detail label="Gender" value={applicant.gender} />
                      <Detail label="Occupation" value={applicant.occupation} />
                      <Detail label="Address" value={applicant.address} />
                      <Detail label="Inviter" value={inviterDetail} />
                      {request.relationshipNote && <Detail label="Relationship note" value={request.relationshipNote} />}
                      <Detail label="Reviewed by" value={request.reviewedBy?.name} />
                      {request.reviewedAt && <Detail label="Reviewed" value={fmtDate(request.reviewedAt)} />}
                      {request.status === 'Rejected' && <Detail label="Reason" value={request.rejectionReason || 'No reason given'} />}
                    </div>
                  )}
                </li>
              );
                })}
                </ul>}
              </section>;
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminScreen;
