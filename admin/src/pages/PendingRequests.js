import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useCallback, useEffect, useState } from 'react';
import { Layout } from '@components/Layout';
import { adminService } from '@services/api';
import { PageLoader } from '@components/Loader';
const PendingRequests = () => {
    const [status, setStatus] = useState('Pending');
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busyId, setBusyId] = useState(null);
    const [error, setError] = useState('');
    const load = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const response = await adminService.getRegistrationRequests(status);
            setRequests(response.data.requests || []);
        }
        catch (err) {
            setError(err.response?.data?.message || 'Could not load registration requests.');
        }
        finally {
            setLoading(false);
        }
    }, [status]);
    useEffect(() => { load(); }, [load]);
    const review = async (item, action) => {
        const reason = action === 'reject' ? window.prompt('Optional rejection reason:') : undefined;
        if (action === 'reject' && reason === null)
            return;
        setBusyId(item.id);
        setError('');
        try {
            await adminService.reviewRegistrationRequest(item.id, action, reason || undefined);
            await load();
        }
        catch (err) {
            setError(err.response?.data?.message || 'Could not update this request.');
        }
        finally {
            setBusyId(null);
        }
    };
    return (_jsx(Layout, { children: _jsxs("div", { className: "space-y-5", children: [_jsxs("div", { className: "flex flex-wrap items-center justify-between gap-3", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold", children: "Registration requests" }), _jsx("p", { className: "text-sm text-gray-600", children: "Review invitations submitted by members of your family." })] }), _jsxs("select", { className: "input max-w-48", value: status, onChange: (event) => setStatus(event.target.value), children: [_jsx("option", { value: "Pending", children: "Pending" }), _jsx("option", { value: "Approved", children: "Approved" }), _jsx("option", { value: "Rejected", children: "Rejected" }), _jsx("option", { value: "all", children: "All requests" })] })] }), error && _jsx("div", { className: "rounded border border-red-200 bg-red-50 p-3 text-red-700", children: error }), loading ? _jsx(PageLoader, {}) : requests.length === 0 ? (_jsx("div", { className: "rounded-lg bg-white p-8 text-center text-gray-500 shadow", children: "No requests in this status." })) : requests.map((item) => {
                    const person = item.applicant || {};
                    return (_jsxs("section", { className: "rounded-lg bg-white p-5 shadow", children: [_jsxs("div", { className: "flex flex-wrap items-start justify-between gap-4", children: [_jsxs("div", { children: [_jsxs("h2", { className: "text-lg font-semibold", children: [person.firstName, " ", person.lastName] }), _jsxs("p", { className: "text-sm text-gray-600", children: [item.status, " \u00B7 Submitted ", new Date(item.submittedAt).toLocaleString()] }), _jsxs("p", { className: "text-sm text-gray-600", children: ["Invited by ", item.invitedBy?.name || 'Unknown member'] })] }), _jsx("span", { className: `rounded-full px-3 py-1 text-sm ${item.status === 'Pending' ? 'bg-amber-100 text-amber-800' : item.status === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`, children: item.status })] }), _jsx("dl", { className: "mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-3", children: [
                                    ['Email', person.email], ['Phone', [person.countryCode, person.phone].filter(Boolean).join(' ')],
                                    ['House', person.house], ['Gender', person.gender], ['Occupation', person.occupation],
                                    ['Address', person.address], ['Generation', person.generation],
                                ].filter(([, value]) => value !== undefined && value !== '').map(([label, value]) => (_jsxs("div", { children: [_jsx("dt", { className: "text-gray-500", children: label }), _jsx("dd", { className: "font-medium", children: value })] }, String(label)))) }), item.status === 'Rejected' && item.rejectionReason && _jsxs("p", { className: "mt-3 text-sm text-red-700", children: ["Reason: ", item.rejectionReason] }), item.reviewedAt && _jsxs("p", { className: "mt-3 text-xs text-gray-500", children: ["Reviewed by ", item.reviewedBy?.name || 'Unknown admin', " \u00B7 ", new Date(item.reviewedAt).toLocaleString()] }), item.status === 'Pending' && (_jsxs("div", { className: "mt-5 flex gap-2", children: [_jsx("button", { className: "btn-primary", disabled: busyId === item.id, onClick: () => review(item, 'approve'), children: busyId === item.id ? 'Saving…' : 'Approve' }), _jsx("button", { className: "rounded-lg border border-red-300 px-4 py-2 text-red-700 hover:bg-red-50 disabled:opacity-50", disabled: busyId === item.id, onClick: () => review(item, 'reject'), children: "Reject" })] }))] }, item.id));
                })] }) }));
};
export default PendingRequests;
