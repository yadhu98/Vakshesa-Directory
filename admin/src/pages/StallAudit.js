import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Layout } from '@components/Layout';
import axiosInstance from '@services/api';
const StallAudit = () => {
    const [transactions, setTransactions] = useState([]);
    const [stalls, setStalls] = useState([]);
    const [selectedStall, setSelectedStall] = useState('');
    const [stallStats, setStallStats] = useState(null);
    const [filterType, setFilterType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        loadStalls();
        loadTransactions();
    }, []);
    useEffect(() => {
        if (selectedStall) {
            loadStallStats();
        }
    }, [selectedStall]);
    const loadStalls = async () => {
        try {
            const res = await axiosInstance.get('/bulk/stalls');
            setStalls(res.data.stalls || []);
        }
        catch (error) {
            console.error('Failed to load stalls:', error);
        }
    };
    const loadTransactions = async () => {
        setLoading(true);
        try {
            const params = {};
            if (selectedStall)
                params.stallId = selectedStall;
            if (filterType !== 'all')
                params.type = filterType;
            if (filterStatus !== 'all')
                params.status = filterStatus;
            if (startDate)
                params.startDate = startDate;
            if (endDate)
                params.endDate = endDate;
            const res = await axiosInstance.get('/tokens/transactions', { params });
            setTransactions(res.data.transactions || []);
        }
        catch (error) {
            console.error('Failed to load transactions:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const loadStallStats = async () => {
        try {
            const res = await axiosInstance.get(`/tokens/stall/${selectedStall}/stats`);
            setStallStats(res.data);
        }
        catch (error) {
            console.error('Failed to load stall stats:', error);
            setStallStats(null);
        }
    };
    const exportCSV = () => {
        const headers = ['Date', 'Type', 'User ID', 'Stall ID', 'Tokens', 'Status', 'Score', 'Description'];
        const rows = transactions.map(t => [
            new Date(t.createdAt).toLocaleString(),
            t.type,
            t.userId,
            t.stallId || 'N/A',
            t.tokensUsed,
            t.status,
            t.gameScore || 'N/A',
            t.description || '',
        ]);
        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `stall-audit-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };
    return (_jsx(Layout, { children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsx("h1", { className: "text-2xl font-bold", children: "\uD83D\uDCCA Stall Audit & Transactions" }), _jsx("button", { className: "btn-primary", onClick: exportCSV, children: "Export CSV" })] }), _jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsx("h2", { className: "text-lg font-bold mb-4", children: "Filters" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Stall" }), _jsxs("select", { className: "input", value: selectedStall, onChange: (e) => setSelectedStall(e.target.value), children: [_jsx("option", { value: "", children: "All Stalls" }), stalls.map(s => (_jsx("option", { value: s._id, children: s.name }, s._id)))] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Type" }), _jsxs("select", { className: "input", value: filterType, onChange: (e) => setFilterType(e.target.value), children: [_jsx("option", { value: "all", children: "All Types" }), _jsx("option", { value: "recharge", children: "Recharge" }), _jsx("option", { value: "payment", children: "Payment" }), _jsx("option", { value: "refund", children: "Refund" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Status" }), _jsxs("select", { className: "input", value: filterStatus, onChange: (e) => setFilterStatus(e.target.value), children: [_jsx("option", { value: "all", children: "All Status" }), _jsx("option", { value: "pending", children: "Pending" }), _jsx("option", { value: "completed", children: "Completed" }), _jsx("option", { value: "declined", children: "Declined" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Start Date" }), _jsx("input", { type: "date", className: "input", value: startDate, onChange: (e) => setStartDate(e.target.value) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "End Date" }), _jsx("input", { type: "date", className: "input", value: endDate, onChange: (e) => setEndDate(e.target.value) })] })] }), _jsx("button", { className: "btn-primary mt-4", onClick: loadTransactions, children: "Apply Filters" })] }), stallStats && (_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsx("div", { className: "text-sm text-gray-600", children: "Total Visits" }), _jsx("div", { className: "text-3xl font-bold text-blue-600", children: stallStats.totalVisits })] }), _jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsx("div", { className: "text-sm text-gray-600", children: "Tokens Collected" }), _jsx("div", { className: "text-3xl font-bold text-green-600", children: stallStats.totalTokensCollected })] }), _jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsx("div", { className: "text-sm text-gray-600", children: "Unique Users" }), _jsx("div", { className: "text-3xl font-bold text-purple-600", children: stallStats.uniqueUsers })] }), _jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsx("div", { className: "text-sm text-gray-600", children: "Avg Score" }), _jsx("div", { className: "text-3xl font-bold text-orange-600", children: stallStats.averageScore.toFixed(1) })] })] })), _jsx("div", { className: "bg-white rounded-lg shadow overflow-hidden", children: loading ? (_jsx("div", { className: "text-center py-8", children: "Loading transactions..." })) : (_jsxs("div", { className: "overflow-x-auto", children: [_jsxs("table", { className: "w-full", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "text-left py-3 px-4 text-sm font-bold", children: "Date/Time" }), _jsx("th", { className: "text-left py-3 px-4 text-sm font-bold", children: "Type" }), _jsx("th", { className: "text-left py-3 px-4 text-sm font-bold", children: "User ID" }), _jsx("th", { className: "text-left py-3 px-4 text-sm font-bold", children: "Stall" }), _jsx("th", { className: "text-right py-3 px-4 text-sm font-bold", children: "Tokens" }), _jsx("th", { className: "text-left py-3 px-4 text-sm font-bold", children: "Status" }), _jsx("th", { className: "text-right py-3 px-4 text-sm font-bold", children: "Score" })] }) }), _jsx("tbody", { children: transactions.map(t => (_jsxs("tr", { className: "border-b hover:bg-gray-50", children: [_jsx("td", { className: "py-3 px-4 text-sm", children: new Date(t.createdAt).toLocaleString() }), _jsx("td", { className: "py-3 px-4", children: _jsx("span", { className: `px-2 py-1 rounded text-xs ${t.type === 'recharge' ? 'bg-green-100 text-green-800' :
                                                            t.type === 'payment' ? 'bg-blue-100 text-blue-800' :
                                                                'bg-gray-100 text-gray-800'}`, children: t.type }) }), _jsxs("td", { className: "py-3 px-4 text-sm font-mono", children: [t.userId.slice(0, 8), "..."] }), _jsx("td", { className: "py-3 px-4 text-sm", children: stalls.find(s => s._id === t.stallId)?.name || 'N/A' }), _jsx("td", { className: "py-3 px-4 text-right font-medium", children: t.tokensUsed }), _jsx("td", { className: "py-3 px-4", children: _jsx("span", { className: `px-2 py-1 rounded text-xs ${t.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                            t.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                                'bg-red-100 text-red-800'}`, children: t.status }) }), _jsx("td", { className: "py-3 px-4 text-right font-bold", children: t.gameScore || '-' })] }, t._id))) })] }), transactions.length === 0 && (_jsx("div", { className: "text-center py-12 text-gray-500", children: "No transactions found" }))] })) })] }) }));
};
export default StallAudit;
