import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Layout } from '@components/Layout';
import { adminService } from '@services/api';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { ButtonLoader } from '@components/Loader';
const Leaderboard = () => {
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    const [limit, setLimit] = useState(50);
    const [showClearModal, setShowClearModal] = useState(false);
    const [confirmCode, setConfirmCode] = useState('');
    const [clearLoading, setClearLoading] = useState(false);
    useEffect(() => {
        loadLeaderboard();
    }, [limit]);
    const loadLeaderboard = async () => {
        try {
            setLoading(true);
            const res = await adminService.getLeaderboard(limit);
            setLeaderboard(res.data.leaderboard || []);
        }
        catch (error) {
            console.error('Failed to load leaderboard:', error);
            toast.error('Failed to load leaderboard');
        }
        finally {
            setLoading(false);
        }
    };
    const exportCSV = () => {
        const headers = ['Rank', 'Name', 'Family', 'Points'];
        const rows = leaderboard.map(entry => [
            entry.rank,
            entry.userName,
            entry.familyName || 'N/A',
            entry.totalPoints
        ]);
        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `leaderboard-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };
    const handleClearLeaderboard = async () => {
        if (confirmCode !== 'CLEAR_LEADERBOARD') {
            toast.error('Invalid confirmation code');
            return;
        }
        setClearLoading(true);
        try {
            const token = localStorage.getItem('authToken');
            const response = await fetch('http://localhost:5000/api/bulk/clear-leaderboard', {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ confirmCode: 'CLEAR_LEADERBOARD' }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || `Server error: ${response.status}`);
            }
            toast.success(data.message || 'Leaderboard cleared successfully');
            setShowClearModal(false);
            setConfirmCode('');
            // Wait a moment then reload
            setTimeout(() => {
                loadLeaderboard();
            }, 500);
        }
        catch (error) {
            const errorMessage = error.message || 'Failed to clear leaderboard';
            toast.error(errorMessage);
        }
        finally {
            setClearLoading(false);
        }
    };
    return (_jsx(Layout, { children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h1", { className: "text-2xl font-bold", children: "\uD83C\uDFC6 Leaderboard" }), _jsxs("div", { className: "flex gap-2", children: [_jsxs("select", { className: "input", value: limit, onChange: (e) => setLimit(Number(e.target.value)), children: [_jsx("option", { value: 10, children: "Top 10" }), _jsx("option", { value: 25, children: "Top 25" }), _jsx("option", { value: 50, children: "Top 50" }), _jsx("option", { value: 100, children: "Top 100" })] }), _jsx("button", { className: "btn-primary", onClick: exportCSV, children: "Export CSV" }), _jsxs("button", { className: "px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2", onClick: () => setShowClearModal(true), children: [_jsx(Trash2, { size: 18 }), "Clear Leaderboard"] })] })] }), loading ? (_jsx("div", { className: "text-center py-8", children: "Loading leaderboard..." })) : (_jsx("div", { className: "bg-white rounded-lg shadow overflow-hidden", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "text-left py-4 px-4 font-bold", children: "Rank" }), _jsx("th", { className: "text-left py-4 px-4 font-bold", children: "Name" }), _jsx("th", { className: "text-left py-4 px-4 font-bold", children: "Family" }), _jsx("th", { className: "text-right py-4 px-4 font-bold", children: "Points" })] }) }), _jsx("tbody", { children: leaderboard.map((entry, idx) => (_jsxs("tr", { className: `border-b hover:bg-gray-50 ${idx === 0 ? 'bg-yellow-50' : idx === 1 ? 'bg-gray-100' : idx === 2 ? 'bg-orange-50' : ''}`, children: [_jsx("td", { className: "py-4 px-4", children: _jsxs("span", { className: `font-bold text-lg ${idx === 0 ? 'text-yellow-600' : idx === 1 ? 'text-gray-600' : idx === 2 ? 'text-orange-600' : ''}`, children: ["#", entry.rank] }) }), _jsx("td", { className: "py-4 px-4 font-medium", children: entry.userName }), _jsx("td", { className: "py-4 px-4 text-gray-600", children: entry.familyName || 'N/A' }), _jsx("td", { className: "py-4 px-4 text-right font-bold text-lg", children: entry.totalPoints })] }, entry.userId))) })] }) })), showClearModal && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50", children: _jsxs("div", { className: "bg-white rounded-lg p-6 max-w-md w-full mx-4", children: [_jsx("h3", { className: "text-xl font-bold mb-4 text-red-600", children: "\u26A0\uFE0F Clear Leaderboard" }), _jsxs("div", { className: "mb-4", children: [_jsxs("p", { className: "text-gray-700 mb-4", children: ["This will ", _jsx("strong", { children: "permanently delete all points" }), " from the leaderboard. This action cannot be undone!"] }), _jsxs("p", { className: "text-gray-600 mb-4", children: ["Type ", _jsx("code", { className: "bg-gray-100 px-2 py-1 rounded font-mono text-sm", children: "CLEAR_LEADERBOARD" }), " to confirm:"] }), _jsx("input", { type: "text", className: "w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black", placeholder: "Type confirmation code", value: confirmCode, onChange: (e) => setConfirmCode(e.target.value), disabled: clearLoading, autoFocus: true }), _jsxs("p", { className: "text-xs text-gray-500 mt-2", children: ["Code match: ", confirmCode === 'CLEAR_LEADERBOARD' ? '✓' : '✗'] })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("button", { className: "flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50", onClick: () => {
                                            setShowClearModal(false);
                                            setConfirmCode('');
                                        }, disabled: clearLoading, children: "Cancel" }), _jsx("button", { className: "flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2", onClick: () => {
                                            console.log('Clear Leaderboard button clicked');
                                            handleClearLeaderboard();
                                        }, disabled: clearLoading || confirmCode !== 'CLEAR_LEADERBOARD', children: clearLoading ? (_jsxs(_Fragment, { children: [_jsx(ButtonLoader, {}), "Clearing..."] })) : ('Clear Leaderboard') })] })] }) }))] }) }));
};
export default Leaderboard;
