import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from 'react';
import { Layout } from '@components/Layout';
import { adminService } from '@services/api';
import { PageLoader } from '@components/Loader';
const AccessManagement = () => {
    const [members, setMembers] = useState([]);
    const [admins, setAdmins] = useState([]);
    const [events, setEvents] = useState([]);
    const [invitations, setInvitations] = useState([]);
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
        }
        catch (err) {
            setError(err.response?.data?.message || 'Could not load access management data.');
        }
        finally {
            setLoading(false);
        }
    }, []);
    useEffect(() => { load(); }, [load]);
    const changeRole = async (member) => {
        const role = member.role === 'admin' ? 'user' : 'admin';
        const action = role === 'admin' ? 'promote this member to admin' : 'revoke this admin’s access';
        if (!window.confirm(`Are you sure you want to ${action}?`))
            return;
        setBusyId(member._id);
        setError('');
        try {
            await adminService.changeFamilyAdminRole(member._id, role);
            await load();
        }
        catch (err) {
            setError(err.response?.data?.message || 'Could not change this member’s role.');
        }
        finally {
            setBusyId('');
        }
    };
    const revokeInvite = async (invite) => {
        if (!window.confirm('Revoke this invitation link? It will no longer be usable.'))
            return;
        setBusyId(invite.id);
        setError('');
        try {
            await adminService.revokeInvite(invite.id);
            await load();
        }
        catch (err) {
            setError(err.response?.data?.message || 'Could not revoke this invitation.');
        }
        finally {
            setBusyId('');
        }
    };
    return (_jsx(Layout, { children: _jsxs("div", { className: "space-y-8", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold", children: "Access management" }), _jsx("p", { className: "text-sm text-gray-600", children: "Manage family administrators and review access changes." })] }), error && _jsx("div", { className: "rounded border border-red-200 bg-red-50 p-3 text-red-700", children: error }), loading ? _jsx(PageLoader, {}) : _jsxs(_Fragment, { children: [_jsxs("section", { className: "rounded-lg bg-white p-5 shadow", children: [_jsx("h2", { className: "mb-4 text-lg font-semibold", children: "Family invitations" }), _jsxs("div", { className: "divide-y", children: [invitations.map((invite) => {
                                            const expired = new Date(invite.expiresAt).getTime() <= Date.now();
                                            const state = invite.used ? 'Used' : invite.revokedAt ? 'Revoked' : expired ? 'Expired' : 'Active';
                                            return _jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3 py-3", children: [_jsxs("div", { children: [_jsx("p", { className: "font-medium", children: invite.invitedEmail || 'Open invitation' }), _jsxs("p", { className: "text-sm text-gray-500", children: ["Created by ", invite.createdBy, " \u00B7 ", new Date(invite.createdAt).toLocaleString()] }), _jsxs("p", { className: "text-xs text-gray-500", children: [state, " \u00B7 Expires ", new Date(invite.expiresAt).toLocaleString()] })] }), state === 'Active' && _jsx("button", { disabled: busyId === invite.id, className: "rounded border border-red-300 px-3 py-2 text-sm text-red-700 disabled:opacity-50", onClick: () => revokeInvite(invite), children: busyId === invite.id ? 'Revoking…' : 'Revoke' })] }, invite.id);
                                        }), invitations.length === 0 && _jsx("p", { className: "py-3 text-sm text-gray-500", children: "No invitations have been created." })] })] }), _jsxs("section", { className: "rounded-lg bg-white p-5 shadow", children: [_jsx("h2", { className: "mb-4 text-lg font-semibold", children: "Family administrators" }), _jsxs("div", { className: "divide-y", children: [admins.map((admin) => _jsxs("div", { className: "flex items-center justify-between gap-3 py-3", children: [_jsxs("div", { children: [_jsxs("p", { className: "font-medium", children: [admin.firstName, " ", admin.lastName] }), _jsx("p", { className: "text-sm text-gray-500", children: admin.email || 'Email private' })] }), _jsx("span", { className: "rounded-full bg-purple-100 px-3 py-1 text-xs text-purple-800", children: "Admin" })] }, admin._id)), admins.length === 0 && _jsx("p", { className: "py-3 text-sm text-gray-500", children: "No administrators are listed for this family." })] })] }), _jsxs("section", { className: "rounded-lg bg-white p-5 shadow", children: [_jsx("h2", { className: "mb-4 text-lg font-semibold", children: "Approved family members" }), _jsxs("div", { className: "divide-y", children: [members.map((member) => _jsxs("div", { className: "flex items-center justify-between gap-3 py-3", children: [_jsxs("div", { children: [_jsxs("p", { className: "font-medium", children: [member.firstName, " ", member.lastName] }), _jsx("p", { className: "text-sm text-gray-500", children: member.email || 'Email private' })] }), _jsx("button", { disabled: busyId === member._id, className: member.role === 'admin' ? 'rounded border border-red-300 px-3 py-2 text-sm text-red-700 disabled:opacity-50' : 'rounded bg-black px-3 py-2 text-sm text-white disabled:opacity-50', onClick: () => changeRole(member), children: busyId === member._id ? 'Saving…' : member.role === 'admin' ? 'Revoke admin' : 'Promote to admin' })] }, member._id)), members.length === 0 && _jsx("p", { className: "py-3 text-sm text-gray-500", children: "No approved members found." })] })] }), _jsxs("section", { className: "rounded-lg bg-white p-5 shadow", children: [_jsx("h2", { className: "mb-4 text-lg font-semibold", children: "Recent access audit" }), _jsxs("div", { className: "overflow-x-auto", children: [_jsxs("table", { className: "w-full text-left text-sm", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b text-gray-500", children: [_jsx("th", { className: "py-2 pr-4", children: "Who" }), _jsx("th", { className: "py-2 pr-4", children: "What" }), _jsx("th", { className: "py-2 pr-4", children: "Affected member" }), _jsx("th", { className: "py-2", children: "When" })] }) }), _jsx("tbody", { children: events.map((event) => _jsxs("tr", { className: "border-b last:border-0", children: [_jsx("td", { className: "py-3 pr-4", children: event.who }), _jsx("td", { className: "py-3 pr-4", children: event.what.replace(/_/g, ' ') }), _jsx("td", { className: "py-3 pr-4", children: event.affectedUser?.name || '—' }), _jsx("td", { className: "py-3", children: new Date(event.when).toLocaleString() })] }, event.id)) })] }), events.length === 0 && _jsx("p", { className: "py-3 text-sm text-gray-500", children: "No audit events yet." })] })] })] })] }) }));
};
export default AccessManagement;
