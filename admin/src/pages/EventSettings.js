import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Layout } from '@components/Layout';
import axiosInstance from '@services/api';
const EventSettings = () => {
    const [generating, setGenerating] = useState(false);
    const [code, setCode] = useState(null);
    const [events, setEvents] = useState([]);
    const [loadingEvents, setLoadingEvents] = useState(true);
    const [selectedEventId, setSelectedEventId] = useState('');
    const [tokenConfig, setTokenConfig] = useState({
        amountToTokenRatio: 2,
        minRecharge: 10,
        maxRecharge: 1000,
    });
    const [savingTokenConfig, setSavingTokenConfig] = useState(false);
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalFamilies: 0,
        totalStalls: 0,
        totalTokensIssued: 0,
        totalTokensSpent: 0,
    });
    const [loadingStats, setLoadingStats] = useState(true);
    useEffect(() => {
        loadStats();
        loadEvents();
    }, []);
    useEffect(() => {
        if (selectedEventId) {
            loadTokenConfig(selectedEventId);
        }
    }, [selectedEventId]);
    const loadEvents = async () => {
        try {
            const res = await axiosInstance.get('/events');
            const eventsList = res.data.data.events || [];
            setEvents(eventsList);
            // Auto-select first active or phase 2 event
            const activeEvent = eventsList.find((e) => e.status === 'active' || e.isPhase2Active);
            if (activeEvent && !selectedEventId) {
                setSelectedEventId(activeEvent._id);
            }
        }
        catch (error) {
            console.error('Failed to load events:', error);
        }
        finally {
            setLoadingEvents(false);
        }
    };
    const loadTokenConfig = async (eventId) => {
        try {
            const res = await axiosInstance.get(`/admin/token-config/${eventId}`);
            if (res.data.config) {
                setTokenConfig({
                    amountToTokenRatio: res.data.config.amountToTokenRatio,
                    minRecharge: res.data.config.minRecharge,
                    maxRecharge: res.data.config.maxRecharge,
                });
            }
        }
        catch (error) {
            // If no config found, use defaults
            if (error.response?.status !== 404) {
                console.error('Failed to load token config:', error);
            }
        }
    };
    const saveTokenConfig = async () => {
        if (!selectedEventId) {
            alert('Please select an event first');
            return;
        }
        setSavingTokenConfig(true);
        try {
            await axiosInstance.post('/admin/token-config', {
                eventId: selectedEventId,
                ...tokenConfig,
            });
            alert('Token configuration saved successfully!');
        }
        catch (error) {
            alert(error.response?.data?.message || 'Failed to save token configuration');
        }
        finally {
            setSavingTokenConfig(false);
        }
    };
    const loadStats = async () => {
        try {
            const [usersRes, familiesRes, stallsRes, tokensRes] = await Promise.all([
                axiosInstance.get('/bulk/users'),
                axiosInstance.get('/bulk/families'),
                axiosInstance.get('/bulk/stalls'),
                axiosInstance.get('/tokens/transactions'),
            ]);
            const transactions = tokensRes.data.transactions || [];
            const totalIssued = transactions
                .filter((t) => t.type === 'recharge' && t.status === 'completed')
                .reduce((sum, t) => sum + t.tokensUsed, 0);
            const totalSpent = transactions
                .filter((t) => t.type === 'payment' && t.status === 'completed')
                .reduce((sum, t) => sum + t.tokensUsed, 0);
            setStats({
                totalUsers: usersRes.data.users?.length || 0,
                totalFamilies: familiesRes.data?.length || 0,
                totalStalls: stallsRes.data.stalls?.length || 0,
                totalTokensIssued: totalIssued,
                totalTokensSpent: totalSpent,
            });
        }
        catch (error) {
            console.error('Failed to load stats:', error);
        }
        finally {
            setLoadingStats(false);
        }
    };
    const generateAdminCode = async () => {
        setGenerating(true);
        try {
            const res = await axiosInstance.post('/admin/admin-code');
            setCode(res.data);
        }
        catch (error) {
            alert(error.response?.data?.message || 'Failed to generate code');
        }
        finally {
            setGenerating(false);
        }
    };
    const calculateTokensForAmount = (amount) => {
        return Math.floor(amount * tokenConfig.amountToTokenRatio);
    };
    const calculateAmountForTokens = (tokens) => {
        return (tokens / tokenConfig.amountToTokenRatio).toFixed(2);
    };
    const togglePhase2 = async (eventId, currentStatus) => {
        try {
            await axiosInstance.patch(`/events/${eventId}/phase2`, {
                isPhase2Active: !currentStatus,
            });
            loadEvents(); // Reload events to show updated status
            alert(`Phase 2 ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
        }
        catch (error) {
            alert(error.response?.data?.message || 'Failed to toggle Phase 2');
        }
    };
    return (_jsx(Layout, { children: _jsxs("div", { className: "space-y-6", children: [_jsx("h1", { className: "text-2xl font-bold", children: "\u2699\uFE0F Event Settings" }), _jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsx("h2", { className: "text-lg font-bold mb-4", children: "\uD83C\uDF9F\uFE0F Token Configuration" }), _jsx("p", { className: "text-sm text-gray-600 mb-4", children: "Configure how money converts to tokens for the event" }), _jsxs("div", { className: "mb-6", children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Select Event" }), _jsxs("select", { className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black", value: selectedEventId, onChange: (e) => setSelectedEventId(e.target.value), children: [_jsx("option", { value: "", children: "-- Select an Event --" }), events.map((event) => (_jsxs("option", { value: event._id, children: [event.name, " (", event.status, ")"] }, event._id)))] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6 mb-6", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Amount to Token Ratio" }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-sm text-gray-600", children: "\u20B91 =" }), _jsx("input", { type: "number", className: "input flex-1", value: tokenConfig.amountToTokenRatio, onChange: (e) => setTokenConfig({ ...tokenConfig, amountToTokenRatio: Number(e.target.value) }), min: "0.1", step: "0.5" }), _jsx("span", { className: "text-sm text-gray-600", children: "tokens" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Minimum Recharge (\u20B9)" }), _jsx("input", { type: "number", className: "input", value: tokenConfig.minRecharge, onChange: (e) => setTokenConfig({ ...tokenConfig, minRecharge: Number(e.target.value) }), min: "1" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-2", children: "Maximum Recharge (\u20B9)" }), _jsx("input", { type: "number", className: "input", value: tokenConfig.maxRecharge, onChange: (e) => setTokenConfig({ ...tokenConfig, maxRecharge: Number(e.target.value) }), min: "1" })] })] }), _jsxs("div", { className: "bg-blue-50 p-4 rounded-lg border border-blue-200", children: [_jsx("h3", { className: "font-bold text-sm mb-3", children: "\uD83D\uDCA1 Quick Calculator" }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3 text-sm", children: [_jsxs("div", { className: "bg-white p-3 rounded", children: [_jsx("div", { className: "text-gray-600", children: "\u20B9100 =" }), _jsxs("div", { className: "text-xl font-bold text-blue-600", children: [calculateTokensForAmount(100), " tokens"] })] }), _jsxs("div", { className: "bg-white p-3 rounded", children: [_jsx("div", { className: "text-gray-600", children: "\u20B9500 =" }), _jsxs("div", { className: "text-xl font-bold text-blue-600", children: [calculateTokensForAmount(500), " tokens"] })] }), _jsxs("div", { className: "bg-white p-3 rounded", children: [_jsx("div", { className: "text-gray-600", children: "100 tokens =" }), _jsxs("div", { className: "text-xl font-bold text-green-600", children: ["\u20B9", calculateAmountForTokens(100)] })] }), _jsxs("div", { className: "bg-white p-3 rounded", children: [_jsx("div", { className: "text-gray-600", children: "500 tokens =" }), _jsxs("div", { className: "text-xl font-bold text-green-600", children: ["\u20B9", calculateAmountForTokens(500)] })] })] })] }), _jsx("button", { className: "btn-primary mt-4", children: "Save Token Configuration" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsx("h2", { className: "text-lg font-bold mb-4", children: "\uD83D\uDCCA Event Statistics" }), loadingStats ? (_jsx("div", { className: "text-center py-4 text-gray-500", children: "Loading..." })) : (_jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "flex justify-between items-center p-3 bg-gray-50 rounded", children: [_jsx("span", { className: "text-gray-600", children: "Total Users:" }), _jsx("span", { className: "font-bold text-lg", children: stats.totalUsers })] }), _jsxs("div", { className: "flex justify-between items-center p-3 bg-gray-50 rounded", children: [_jsx("span", { className: "text-gray-600", children: "Total Families:" }), _jsx("span", { className: "font-bold text-lg", children: stats.totalFamilies })] }), _jsxs("div", { className: "flex justify-between items-center p-3 bg-gray-50 rounded", children: [_jsx("span", { className: "text-gray-600", children: "Total Stalls:" }), _jsx("span", { className: "font-bold text-lg", children: stats.totalStalls })] }), _jsxs("div", { className: "flex justify-between items-center p-3 bg-green-50 rounded", children: [_jsx("span", { className: "text-gray-600", children: "Tokens Issued:" }), _jsx("span", { className: "font-bold text-lg text-green-600", children: stats.totalTokensIssued })] }), _jsxs("div", { className: "flex justify-between items-center p-3 bg-blue-50 rounded", children: [_jsx("span", { className: "text-gray-600", children: "Tokens Spent:" }), _jsx("span", { className: "font-bold text-lg text-blue-600", children: stats.totalTokensSpent })] }), _jsxs("div", { className: "flex justify-between items-center p-3 bg-purple-50 rounded", children: [_jsx("span", { className: "text-gray-600", children: "Tokens Available:" }), _jsx("span", { className: "font-bold text-lg text-purple-600", children: stats.totalTokensIssued - stats.totalTokensSpent })] })] }))] }), _jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsx("h2", { className: "text-lg font-bold mb-4", children: "\uD83D\uDD11 Admin Code Generator" }), _jsx("p", { className: "text-sm text-gray-600 mb-4", children: "Generate a one-time validation code for new admin registrations. Code expires in 1 minute." }), _jsx("button", { className: "btn-primary w-full mb-4", onClick: generateAdminCode, disabled: generating, children: generating ? 'Generating...' : 'Generate New Code' }), code && (_jsx("div", { className: "bg-blue-50 p-4 rounded border border-blue-200", children: _jsxs("div", { className: "text-center", children: [_jsx("p", { className: "text-sm text-gray-600 mb-2", children: "Validation Code:" }), _jsx("p", { className: "text-3xl font-mono font-bold text-blue-600", children: code.code }), _jsxs("p", { className: "text-xs text-gray-500 mt-2", children: ["Expires: ", new Date(code.expiresAt).toLocaleTimeString()] })] }) }))] })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-6", children: [_jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsx("h2", { className: "text-lg font-bold mb-4", children: "\uD83C\uDFAA Phase 2 Controls" }), _jsx("p", { className: "text-sm text-gray-600 mb-4", children: "Enable or disable Phase 2 (Carnival Mode) for specific events. Only one event can have Phase 2 active at a time." }), loadingEvents ? (_jsx("div", { className: "text-center py-4 text-gray-500", children: "Loading events..." })) : events.length === 0 ? (_jsxs("div", { className: "text-center py-6 text-gray-500", children: [_jsx("p", { className: "mb-3", children: "No events found. Create an event first." }), _jsx("button", { className: "btn-primary", onClick: () => window.location.href = '/events', children: "Create Event" })] })) : (_jsxs("div", { className: "space-y-3", children: [events.filter(e => e.status === 'active' || e.isPhase2Active).map((event) => (_jsx("div", { className: `p-4 rounded border ${event.isPhase2Active ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`, children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "font-bold", children: event.name }), _jsxs("p", { className: "text-sm text-gray-600", children: [new Date(event.startDate).toLocaleDateString(), " - ", new Date(event.endDate).toLocaleDateString()] }), _jsx("div", { className: "mt-2", children: _jsx("span", { className: `text-xs px-2 py-1 rounded ${event.isPhase2Active ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-700'}`, children: event.isPhase2Active ? '✓ Phase 2 Active' : 'Phase 2 Inactive' }) })] }), _jsx("label", { className: "flex items-center cursor-pointer", children: _jsxs("div", { className: "relative", children: [_jsx("input", { type: "checkbox", className: "sr-only", checked: event.isPhase2Active, onChange: () => togglePhase2(event._id, event.isPhase2Active) }), _jsx("div", { className: `block w-14 h-8 rounded-full transition ${event.isPhase2Active ? 'bg-green-500' : 'bg-gray-300'}` }), _jsx("div", { className: `dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform ${event.isPhase2Active ? 'translate-x-6' : ''}` })] }) })] }) }, event._id))), events.filter(e => e.status !== 'active' && !e.isPhase2Active).length > 0 && (_jsxs("details", { className: "mt-2", children: [_jsxs("summary", { className: "cursor-pointer text-sm text-gray-600 hover:text-gray-800", children: ["Show ", events.filter(e => e.status !== 'active' && !e.isPhase2Active).length, " inactive events"] }), _jsx("div", { className: "space-y-2 mt-2", children: events.filter(e => e.status !== 'active' && !e.isPhase2Active).map((event) => (_jsxs("div", { className: "p-3 bg-gray-50 rounded border text-sm", children: [_jsx("div", { className: "font-medium", children: event.name }), _jsxs("div", { className: "text-xs text-gray-500", children: ["Status: ", event.status] })] }, event._id))) })] }))] })), _jsx("button", { className: "w-full mt-4 px-4 py-2 border rounded hover:bg-gray-50 font-medium", onClick: () => window.location.href = '/events', children: "\uD83D\uDCCB Manage All Events" })] }), _jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsx("h2", { className: "text-lg font-bold mb-4", children: "\u2699\uFE0F System Controls" }), _jsx("p", { className: "text-sm text-gray-600 mb-4", children: "System-wide controls and danger zone actions." }), _jsxs("div", { className: "space-y-3", children: [_jsx("button", { className: "w-full px-4 py-2 border rounded hover:bg-gray-50", onClick: () => window.location.href = '/events', children: "\uD83D\uDCC5 View All Events" }), _jsx("button", { className: "w-full px-4 py-2 border rounded hover:bg-gray-50 text-red-600 border-red-300 hover:bg-red-50", children: "\uD83D\uDDD1\uFE0F Reset All Points (Danger)" })] })] })] }), _jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsx("h2", { className: "text-lg font-bold mb-4", children: "\uD83D\uDCB0 Money & Token Management" }), _jsx("p", { className: "text-sm text-gray-600 mb-4", children: "Financial overview and token dispensing controls" }), _jsxs("div", { className: "space-y-3", children: [_jsxs("div", { className: "p-4 bg-green-50 rounded border border-green-200", children: [_jsx("div", { className: "text-sm text-gray-600", children: "Estimated Revenue" }), _jsxs("div", { className: "text-2xl font-bold text-green-600", children: ["\u20B9", ((stats.totalTokensIssued / tokenConfig.amountToTokenRatio) || 0).toFixed(2)] }), _jsxs("div", { className: "text-xs text-gray-500 mt-1", children: ["Based on ", stats.totalTokensIssued, " tokens issued"] })] }), _jsx("button", { className: "w-full px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium", onClick: () => window.location.href = '/token-recharge', children: "\uD83D\uDCB3 Dispense Tokens (Recharge)" }), _jsx("button", { className: "w-full px-4 py-3 border border-gray-300 rounded hover:bg-gray-50 font-medium", onClick: () => window.location.href = '/stall-audit', children: "\uD83D\uDCCA View Token Transactions" })] })] }), _jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsx("h2", { className: "text-lg font-bold mb-4", children: "\uD83D\uDCE4 Data Export" }), _jsx("p", { className: "text-sm text-gray-600 mb-4", children: "Export system data for backup or analysis." }), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3", children: [_jsx("button", { className: "px-4 py-2 border rounded hover:bg-gray-50", children: "Export Users CSV" }), _jsx("button", { className: "px-4 py-2 border rounded hover:bg-gray-50", children: "Export Points CSV" }), _jsx("button", { className: "px-4 py-2 border rounded hover:bg-gray-50", children: "Export Families CSV" }), _jsx("button", { className: "px-4 py-2 border rounded hover:bg-gray-50", children: "Export Tokens CSV" })] })] })] }) }));
};
export default EventSettings;
