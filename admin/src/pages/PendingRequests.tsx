import React, { useCallback, useEffect, useState } from 'react';
import { Layout } from '@components/Layout';
import { adminService } from '@services/api';
import { PageLoader } from '@components/Loader';

type RequestStatus = 'all' | 'Pending' | 'Approved' | 'Rejected';
interface RegistrationRequest {
  id: string;
  status: Exclude<RequestStatus, 'all'>;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: { id: string; name: string } | null;
  invitedBy?: { id: string; name: string } | null;
  relationshipNote?: string | null;
  rejectionReason?: string;
  applicant: Record<string, any> | null;
}

const PendingRequests: React.FC = () => {
  const [status, setStatus] = useState<RequestStatus>('Pending');
  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await adminService.getRegistrationRequests(status);
      setRequests(response.data.requests || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not load registration requests.');
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => { load(); }, [load]);

  const review = async (item: RegistrationRequest, action: 'approve' | 'reject') => {
    const reason = action === 'reject' ? window.prompt('Optional rejection reason:') : undefined;
    if (action === 'reject' && reason === null) return;
    setBusyId(item.id);
    setError('');
    try {
      await adminService.reviewRegistrationRequest(item.id, action, reason || undefined);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not update this request.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <Layout>
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Registration requests</h1>
            <p className="text-sm text-gray-600">Review invitations submitted by members of your family.</p>
          </div>
          <select className="input max-w-48" value={status} onChange={(event) => setStatus(event.target.value as RequestStatus)}>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="all">All requests</option>
          </select>
        </div>
        {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}
        {loading ? <PageLoader /> : requests.length === 0 ? (
          <div className="rounded-lg bg-white p-8 text-center text-gray-500 shadow">No requests in this status.</div>
        ) : requests.map((item) => {
          const person = item.applicant || {};
          return (
            <section key={item.id} className="rounded-lg bg-white p-5 shadow">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-semibold">{person.firstName} {person.lastName}</h2>
                  <p className="text-sm text-gray-600">{item.status} · Submitted {new Date(item.submittedAt).toLocaleString()}</p>
                  <p className="text-sm text-gray-600">Invited by {item.invitedBy?.name || 'Unknown member'}</p>
                  {item.relationshipNote && <p className="mt-1 rounded bg-amber-50 p-2 text-sm text-amber-900">Relationship note: {item.relationshipNote}</p>}
                </div>
                <span className={`rounded-full px-3 py-1 text-sm ${item.status === 'Pending' ? 'bg-amber-100 text-amber-800' : item.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{item.status}</span>
              </div>
              <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3">
                {[
                  ['Email', person.email], ['Phone', [person.countryCode, person.phone].filter(Boolean).join(' ')],
                  ['House', person.house], ['Gender', person.gender], ['Occupation', person.occupation],
                  ['Address', person.address], ['Generation', person.generation],
                ].filter(([, value]) => value !== undefined && value !== '').map(([label, value]) => (
                  <div key={String(label)}><dt className="text-gray-500">{label}</dt><dd className="font-medium">{value}</dd></div>
                ))}
              </dl>
              {item.status === 'Rejected' && item.rejectionReason && <p className="mt-3 text-sm text-red-700">Reason: {item.rejectionReason}</p>}
              {item.reviewedAt && <p className="mt-3 text-xs text-gray-500">Reviewed by {item.reviewedBy?.name || 'Unknown admin'} · {new Date(item.reviewedAt).toLocaleString()}</p>}
              {item.status === 'Pending' && (
                <div className="mt-5 flex gap-2">
                  <button className="btn-primary" disabled={busyId === item.id} onClick={() => review(item, 'approve')}>{busyId === item.id ? 'Saving…' : 'Approve'}</button>
                  <button className="rounded-lg border border-red-300 px-4 py-2 text-red-700 hover:bg-red-50 disabled:opacity-50" disabled={busyId === item.id} onClick={() => review(item, 'reject')}>Reject</button>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </Layout>
  );
};

export default PendingRequests;
