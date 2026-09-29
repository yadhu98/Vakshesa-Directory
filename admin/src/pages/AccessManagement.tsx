import React, { useCallback, useEffect, useState } from 'react';
import { Layout } from '@components/Layout';
import { adminService } from '@services/api';
import { PageLoader } from '@components/Loader';

interface Member { _id: string; firstName: string; lastName: string; email?: string; role: string; }
interface AuditEvent { id: string; who: string; what: string; when: string; affectedUser?: { name: string } | null; details?: Record<string, any>; }
interface Invitation { id: string; familyName: string; invitedEmail?: string | null; createdBy: string; createdAt: string; expiresAt: string; used: boolean; usedAt?: string; revokedAt?: string | null; }

const AccessManagement: React.FC = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [admins, setAdmins] = useState<Member[]>([]);
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState('');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [memberResponse, adminResponse, auditResponse, inviteResponse] = await Promise.all([
        adminService.getFamilyMembers(), adminService.getFamilyAdmins(), adminService.getAuditEvents(), adminService.getFamilyInvites(),
      ]);
      setMembers(memberResponse.data.users || []);
      setAdmins(adminResponse.data.admins || []);
      setEvents(auditResponse.data.events || []);
      setInvitations(inviteResponse.data.invitations || []);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not load access management data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const changeRole = async (member: Member) => {
    const role = member.role === 'admin' ? 'user' : 'admin';
    const action = role === 'admin' ? 'promote this member to admin' : 'revoke this admin’s access';
    if (!window.confirm(`Are you sure you want to ${action}?`)) return;
    setBusyId(member._id);
    setError('');
    try {
      await adminService.changeFamilyAdminRole(member._id, role);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not change this member’s role.');
    } finally {
      setBusyId('');
    }
  };

  const revokeInvite = async (invite: Invitation) => {
    if (!window.confirm('Revoke this invitation link? It will no longer be usable.')) return;
    setBusyId(invite.id);
    setError('');
    try {
      await adminService.revokeInvite(invite.id);
      await load();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not revoke this invitation.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <Layout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Access management</h1>
          <p className="text-sm text-gray-600">Manage family administrators and review access changes.</p>
        </div>
        {error && <div className="rounded border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}
        {loading ? <PageLoader /> : <>
          <section className="rounded-lg bg-white p-5 shadow">
            <h2 className="mb-4 text-lg font-semibold">Family invitations</h2>
            <div className="divide-y">
              {invitations.map((invite) => {
                const expired = new Date(invite.expiresAt).getTime() <= Date.now();
                const state = invite.used ? 'Used' : invite.revokedAt ? 'Revoked' : expired ? 'Expired' : 'Active';
                return <div key={invite.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                  <div><p className="font-medium">{invite.invitedEmail || 'Open invitation'}</p><p className="text-sm text-gray-500">Created by {invite.createdBy} · {new Date(invite.createdAt).toLocaleString()}</p><p className="text-xs text-gray-500">{state} · Expires {new Date(invite.expiresAt).toLocaleString()}</p></div>
                  {state === 'Active' && <button disabled={busyId === invite.id} className="rounded border border-red-300 px-3 py-2 text-sm text-red-700 disabled:opacity-50" onClick={() => revokeInvite(invite)}>{busyId === invite.id ? 'Revoking…' : 'Revoke'}</button>}
                </div>;
              })}
              {invitations.length === 0 && <p className="py-3 text-sm text-gray-500">No invitations have been created.</p>}
            </div>
          </section>
          <section className="rounded-lg bg-white p-5 shadow">
            <h2 className="mb-4 text-lg font-semibold">Family administrators</h2>
            <div className="divide-y">
              {admins.map((admin) => <div key={admin._id} className="flex items-center justify-between gap-3 py-3">
                <div><p className="font-medium">{admin.firstName} {admin.lastName}</p><p className="text-sm text-gray-500">{admin.email || 'Email private'}</p></div>
                <span className="rounded-full bg-purple-100 px-3 py-1 text-xs text-purple-800">Admin</span>
              </div>)}
              {admins.length === 0 && <p className="py-3 text-sm text-gray-500">No administrators are listed for this family.</p>}
            </div>
          </section>
          <section className="rounded-lg bg-white p-5 shadow">
            <h2 className="mb-4 text-lg font-semibold">Approved family members</h2>
            <div className="divide-y">
              {members.map((member) => <div key={member._id} className="flex items-center justify-between gap-3 py-3">
                <div><p className="font-medium">{member.firstName} {member.lastName}</p><p className="text-sm text-gray-500">{member.email || 'Email private'}</p></div>
                <button disabled={busyId === member._id} className={member.role === 'admin' ? 'rounded border border-red-300 px-3 py-2 text-sm text-red-700 disabled:opacity-50' : 'rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50'} onClick={() => changeRole(member)}>
                  {busyId === member._id ? 'Saving…' : member.role === 'admin' ? 'Revoke admin' : 'Promote to admin'}
                </button>
              </div>)}
              {members.length === 0 && <p className="py-3 text-sm text-gray-500">No approved members found.</p>}
            </div>
          </section>
          <section className="rounded-lg bg-white p-5 shadow">
            <h2 className="mb-4 text-lg font-semibold">Recent access audit</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead><tr className="border-b text-gray-500"><th className="py-2 pr-4">Who</th><th className="py-2 pr-4">What</th><th className="py-2 pr-4">Affected member</th><th className="py-2">When</th></tr></thead>
                <tbody>{events.map((event) => <tr key={event.id} className="border-b last:border-0"><td className="py-3 pr-4">{event.who}</td><td className="py-3 pr-4">{event.what.replace(/_/g, ' ')}</td><td className="py-3 pr-4">{event.affectedUser?.name || '—'}</td><td className="py-3">{new Date(event.when).toLocaleString()}</td></tr>)}</tbody>
              </table>
              {events.length === 0 && <p className="py-3 text-sm text-gray-500">No audit events yet.</p>}
            </div>
          </section>
        </>}
      </div>
    </Layout>
  );
};

export default AccessManagement;
