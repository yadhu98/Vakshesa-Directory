import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Layout } from '@components/Layout';
import axiosInstance from '@services/api';
import toast, { Toaster } from 'react-hot-toast';
const Stalls = () => {
    const [stalls, setStalls] = useState([]);
    const [carnivals, setCarnivals] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingStall, setEditingStall] = useState(null);
    const [showQRModal, setShowQRModal] = useState(false);
    const [selectedQR, setSelectedQR] = useState(null);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingStall, setDeletingStall] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [forceDelete, setForceDelete] = useState(false);
    const [loadingParticipants, setLoadingParticipants] = useState(false);
    const [formData, setFormData] = useState({
        carnivalEventId: '',
        name: '',
        description: '',
        category: 'game',
        type: 'game',
        adminIds: [],
        tokenCost: '5',
        gameRules: '',
        participationType: 'individual',
        startTime: '',
        endTime: '',
        maxParticipants: '',
        location: '',
    });
    useEffect(() => {
        loadData();
    }, []);
    const loadData = async () => {
        try {
            setLoading(true);
            const [stallsRes, usersRes, eventsRes] = await Promise.all([
                axiosInstance.get('/carnival-admin/events'),
                axiosInstance.get('/carnival-admin/users'),
                axiosInstance.get('/events'),
            ]);
            setStalls(stallsRes.data.events || []);
            setUsers(usersRes.data.users || []);
            // Filter for active and upcoming carnivals
            const allEvents = eventsRes.data?.events || eventsRes.data?.data?.events || [];
            console.log('All carnival events:', allEvents);
            const activeCarnival = allEvents.filter((e) => e.status === 'active' || e.status === 'upcoming');
            console.log('Filtered active/upcoming carnivals:', activeCarnival);
            setCarnivals(activeCarnival);
        }
        catch (error) {
            console.error('Load data error:', error);
            toast.error('Failed to load data: ' + (error.response?.data?.message || error.message));
        }
        finally {
            setLoading(false);
        }
    };
    const handleCreateClick = () => {
        if (carnivals.length === 0) {
            toast.error('No active or upcoming carnivals. Please create a carnival event first.');
            return;
        }
        setEditingStall(null);
        setFormData({
            carnivalEventId: carnivals[0]?._id || '',
            name: '',
            description: '',
            category: 'game',
            type: 'game',
            adminIds: [],
            tokenCost: '5',
            gameRules: '',
            participationType: 'individual',
            startTime: '',
            endTime: '',
            maxParticipants: '',
            location: '',
        });
        setShowModal(true);
    };
    const handleEditClick = (stall) => {
        setEditingStall(stall);
        setFormData({
            carnivalEventId: stall.carnivalEventId,
            name: stall.name,
            description: stall.description || '',
            category: stall.category,
            type: stall.type,
            adminIds: stall.adminIds,
            tokenCost: stall.tokenCost.toString(),
            gameRules: stall.gameRules || '',
            participationType: stall.participationType,
            startTime: stall.startTime ? new Date(stall.startTime).toISOString().slice(0, 16) : '',
            endTime: stall.endTime ? new Date(stall.endTime).toISOString().slice(0, 16) : '',
            maxParticipants: stall.maxParticipants?.toString() || '',
            location: stall.location || '',
        });
        setShowModal(true);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.carnivalEventId || formData.adminIds.length === 0) {
            toast.error('Please fill in all required fields');
            return;
        }
        try {
            if (editingStall) {
                await axiosInstance.put(`/carnival-admin/events/${editingStall._id}`, formData);
                toast.success('Stall updated successfully!');
            }
            else {
                await axiosInstance.post('/carnival-admin/events', formData);
                toast.success('Stall created successfully!');
            }
            setShowModal(false);
            loadData();
        }
        catch (error) {
            console.error('Submit error:', error);
            toast.error('Failed to save stall: ' + (error.response?.data?.message || error.message));
        }
    };
    const toggleStallStatus = async (stallId, currentStatus) => {
        if (confirm(`Are you sure you want to ${currentStatus ? 'close' : 'open'} this stall?`)) {
            try {
                await axiosInstance.patch(`/carnival-admin/events/${stallId}/toggle`, {
                    isOpen: !currentStatus,
                });
                toast.success(`Stall ${!currentStatus ? 'opened' : 'closed'} successfully!`);
                loadData();
            }
            catch (error) {
                toast.error('Failed to toggle stall: ' + (error.response?.data?.message || error.message));
            }
        }
    };
    const handleToggleActive = async (stallId, currentStatus) => {
        const action = currentStatus ? 'deactivate' : 'activate';
        if (confirm(`Are you sure you want to ${action} this stall?`)) {
            try {
                await axiosInstance.put(`/carnival-admin/events/${stallId}/active`, {
                    isActive: !currentStatus
                });
                toast.success(`Stall ${action}d successfully!`);
                loadData();
            }
            catch (error) {
                toast.error(`Failed to ${action} stall: ` + (error.response?.data?.message || error.message));
            }
        }
    };
    const handleDeleteClick = async (stallId) => {
        const stall = stalls.find(s => s._id === stallId);
        if (!stall)
            return;
        setDeletingStall(stall);
        setForceDelete(false);
        // If stall has participations, load them
        if (stall.totalParticipations > 0) {
            setLoadingParticipants(true);
            try {
                const response = await axiosInstance.get(`/carnival-admin/events/${stallId}/participations`);
                setParticipants(response.data.participations || []);
            }
            catch (error) {
                toast.error('Failed to load participants: ' + (error.response?.data?.message || error.message));
                setParticipants([]);
            }
            finally {
                setLoadingParticipants(false);
            }
        }
        else {
            setParticipants([]);
        }
        setShowDeleteModal(true);
    };
    const handleConfirmDelete = async () => {
        if (!deletingStall)
            return;
        if (deletingStall.totalParticipations > 0 && !forceDelete) {
            toast.error('Please check "Force Delete" or remove all participants first.');
            return;
        }
        try {
            const url = forceDelete
                ? `/carnival-admin/events/${deletingStall._id}?force=true`
                : `/carnival-admin/events/${deletingStall._id}`;
            await axiosInstance.delete(url);
            toast.success('Stall deleted successfully!');
            setShowDeleteModal(false);
            setDeletingStall(null);
            setParticipants([]);
            loadData();
        }
        catch (error) {
            const message = error.response?.data?.message || error.message;
            toast.error('Failed to delete stall: ' + message);
        }
    };
    const handleRemoveParticipant = async (participationId) => {
        if (!deletingStall)
            return;
        if (confirm('Are you sure you want to remove this participant?')) {
            try {
                await axiosInstance.delete(`/carnival-admin/participations/${participationId}`);
                toast.success('Participant removed successfully!');
                // Reload participants
                const response = await axiosInstance.get(`/carnival-admin/events/${deletingStall._id}/participations`);
                setParticipants(response.data.participations || []);
                // Reload stalls to update count
                loadData();
            }
            catch (error) {
                toast.error('Failed to remove participant: ' + (error.response?.data?.message || error.message));
            }
        }
    };
    const handleUpdateScore = async (participationId, newScore) => {
        try {
            await axiosInstance.patch(`/carnival-admin/participations/${participationId}`, {
                score: newScore
            });
            toast.success('Score updated successfully!');
            // Update local state
            setParticipants(prev => prev.map(p => p._id === participationId ? { ...p, score: newScore } : p));
        }
        catch (error) {
            toast.error('Failed to update score: ' + (error.response?.data?.message || error.message));
        }
    };
    const showQRCode = (stall) => {
        setSelectedQR({ name: stall.name, qrCode: stall.qrCode });
        setShowQRModal(true);
    };
    const handleAdminSelect = (userId) => {
        setFormData(prev => ({
            ...prev,
            adminIds: prev.adminIds.includes(userId)
                ? prev.adminIds.filter(id => id !== userId)
                : [...prev.adminIds, userId],
        }));
    };
    const getCarnivalName = (carnivalId) => {
        return carnivals.find(c => c._id === carnivalId)?.name || 'Unknown Carnival';
    };
    if (loading) {
        return (_jsx(Layout, { children: _jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("div", { className: "text-xl", children: "Loading..." }) }) }));
    }
    return (_jsxs(Layout, { children: [_jsx(Toaster, { position: "top-right" }), _jsxs("div", { className: "max-w-7xl mx-auto px-4 py-8", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Stalls Management" }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: "Create and manage carnival stalls, games, and stage programs" })] }), _jsx("button", { onClick: handleCreateClick, className: "bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors", children: "+ Create Stall" })] }), _jsx("div", { className: "mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4", children: _jsxs("div", { className: "flex items-start", children: [_jsx("span", { className: "text-blue-600 text-xl mr-3", children: "\u2139\uFE0F" }), _jsxs("div", { className: "text-sm text-blue-800", children: [_jsx("p", { className: "font-semibold mb-1", children: "Stall Management Tips:" }), _jsxs("ul", { className: "list-disc list-inside space-y-1 text-blue-700", children: [_jsxs("li", { children: [_jsx("strong", { children: "Deactivate" }), " stalls to hide them while preserving participation data"] }), _jsxs("li", { children: [_jsx("strong", { children: "Delete" }), " is only available for stalls with no participation records"] }), _jsxs("li", { children: ["Use ", _jsx("strong", { children: "Pause/Open" }), " to temporarily control stall availability"] })] })] })] }) }), carnivals.length === 0 && (_jsx("div", { className: "bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6", children: _jsx("p", { className: "text-yellow-800", children: "\u26A0\uFE0F No active or upcoming carnivals. Please create and activate a carnival event first." }) })), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: stalls.map((stall) => (_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6 border border-gray-200", children: [_jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "text-lg font-bold text-gray-900 mb-1", children: stall.name }), _jsx("p", { className: "text-xs text-gray-500 mb-2", children: getCarnivalName(stall.carnivalEventId) }), _jsxs("div", { className: "flex gap-2 flex-wrap", children: [_jsx("span", { className: `inline-block px-3 py-1 rounded-full text-xs font-semibold ${stall.category === 'game'
                                                                ? 'bg-blue-100 text-blue-800'
                                                                : 'bg-purple-100 text-purple-800'}`, children: stall.category === 'game' ? '🎮 Game' : '🎭 Stage' }), _jsx("span", { className: "inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800", children: stall.participationType })] })] }), _jsxs("div", { className: "flex flex-col gap-2", children: [_jsx("span", { className: `px-3 py-1 rounded-full text-xs font-semibold ${stall.isActive
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'}`, children: stall.isActive ? 'Active' : 'Inactive' }), _jsx("span", { className: `px-3 py-1 rounded-full text-xs font-semibold ${stall.isOpen
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'}`, children: stall.isOpen ? 'Open' : 'Closed' })] })] }), stall.description && (_jsx("p", { className: "text-sm text-gray-600 mb-3", children: stall.description })), _jsxs("div", { className: "space-y-2 text-sm text-gray-700 mb-4", children: [stall.category === 'game' && (_jsxs("div", { children: ["\uD83D\uDCB0 ", _jsx("strong", { children: "Tokens:" }), " ", stall.tokenCost] })), stall.category === 'stage_program' && (_jsxs("div", { children: ["\uD83C\uDF9F\uFE0F ", _jsx("strong", { children: "Free Entry" })] })), stall.location && (_jsxs("div", { children: ["\uD83D\uDCCD ", _jsx("strong", { children: "Location:" }), " ", stall.location] })), stall.maxParticipants && (_jsxs("div", { children: ["\uD83D\uDC65 ", _jsx("strong", { children: "Participants:" }), " ", stall.currentParticipants, "/", stall.maxParticipants] })), _jsxs("div", { children: ["\uD83D\uDCCA ", _jsx("strong", { children: "Total:" }), " ", stall.totalParticipations, " |", _jsx("strong", { className: "text-yellow-600", children: " Pending:" }), " ", stall.pendingParticipations] })] }), _jsxs("div", { className: "mb-4", children: [_jsx("div", { className: "text-xs font-semibold text-gray-600 mb-1", children: "Volunteers:" }), _jsx("div", { className: "flex flex-wrap gap-1", children: stall.adminNames.map((name, idx) => (_jsx("span", { className: "px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs", children: name }, idx))) })] }), stall.gameRules && (_jsxs("div", { className: "mb-4 p-3 bg-gray-50 rounded-lg", children: [_jsx("div", { className: "text-xs font-semibold text-gray-600 mb-1", children: "Rules:" }), _jsx("p", { className: "text-xs text-gray-700 line-clamp-2", children: stall.gameRules })] })), _jsx("div", { className: "mb-3", children: _jsx("span", { className: `inline-block px-3 py-1 rounded-full text-xs font-semibold ${stall.isActive
                                            ? 'bg-green-100 text-green-800'
                                            : 'bg-gray-100 text-gray-800'}`, children: stall.isActive ? '✓ Active' : '✗ Inactive' }) }), _jsxs("div", { className: "flex gap-2 flex-wrap", children: [_jsx("button", { onClick: () => showQRCode(stall), className: "flex-1 bg-purple-50 text-purple-700 px-3 py-2 rounded text-sm font-medium hover:bg-purple-100 transition-colors", children: "\uD83D\uDCF1 QR" }), _jsx("button", { onClick: () => toggleStallStatus(stall._id, stall.isOpen), className: `flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${stall.isOpen
                                                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                                : 'bg-green-50 text-green-700 hover:bg-green-100'}`, children: stall.isOpen ? '⏸️ Pause' : '▶️ Open' }), _jsx("button", { onClick: () => handleToggleActive(stall._id, stall.isActive), className: `flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${stall.isActive
                                                ? 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                                                : 'bg-green-50 text-green-700 hover:bg-green-100'}`, children: stall.isActive ? '🚫 Deactivate' : '✓ Activate' }), _jsx("button", { onClick: () => handleEditClick(stall), className: "bg-blue-50 text-blue-700 px-3 py-2 rounded text-sm font-medium hover:bg-blue-100 transition-colors", children: "\u270F\uFE0F" }), _jsx("button", { onClick: () => handleDeleteClick(stall._id), className: "bg-red-50 text-red-700 px-3 py-2 rounded text-sm font-medium hover:bg-red-100 transition-colors", title: stall.totalParticipations > 0 ? `${stall.totalParticipations} participation(s)` : 'Delete stall', children: "\uD83D\uDDD1\uFE0F Delete" })] })] }, stall._id))) }), stalls.length === 0 && carnivals.length > 0 && (_jsxs("div", { className: "text-center py-12", children: [_jsx("p", { className: "text-gray-500 text-lg", children: "No stalls yet" }), _jsx("p", { className: "text-gray-400 text-sm mt-2", children: "Click \"Create Stall\" to get started" })] }))] }), showModal && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto", children: _jsx("div", { className: "bg-white rounded-lg max-w-3xl w-full my-8", children: _jsxs("div", { className: "p-6 max-h-[85vh] overflow-y-auto", children: [_jsx("h2", { className: "text-2xl font-bold mb-4", children: editingStall ? 'Edit Stall' : 'Create New Stall' }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-semibold text-gray-700 mb-2", children: "Carnival Event *" }), _jsxs("select", { value: formData.carnivalEventId, onChange: (e) => setFormData({ ...formData, carnivalEventId: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black", required: true, disabled: !!editingStall, children: [_jsx("option", { value: "", children: "Select a carnival" }), carnivals.map(carnival => (_jsxs("option", { value: carnival._id, children: [carnival.name, " (", carnival.status, ")"] }, carnival._id)))] })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-semibold text-gray-700 mb-2", children: "Category *" }), _jsxs("div", { className: "flex gap-4", children: [_jsxs("label", { className: "flex items-center cursor-pointer", children: [_jsx("input", { type: "radio", value: "game", checked: formData.category === 'game', onChange: (e) => setFormData({ ...formData, category: e.target.value }), className: "mr-2", disabled: !!editingStall }), _jsx("span", { className: "text-sm", children: "\uD83C\uDFAE Games & Activities" })] }), _jsxs("label", { className: "flex items-center cursor-pointer", children: [_jsx("input", { type: "radio", value: "stage_program", checked: formData.category === 'stage_program', onChange: (e) => setFormData({ ...formData, category: e.target.value, tokenCost: '0' }), className: "mr-2", disabled: !!editingStall }), _jsx("span", { className: "text-sm", children: "\uD83C\uDFAD Stage Program" })] })] })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-semibold text-gray-700 mb-2", children: "Participation Type *" }), _jsxs("div", { className: "flex gap-4", children: [_jsxs("label", { className: "flex items-center cursor-pointer", children: [_jsx("input", { type: "radio", value: "individual", checked: formData.participationType === 'individual', onChange: (e) => setFormData({ ...formData, participationType: e.target.value }), className: "mr-2" }), _jsx("span", { className: "text-sm", children: "\uD83D\uDC64 Individual Only" })] }), _jsxs("label", { className: "flex items-center cursor-pointer", children: [_jsx("input", { type: "radio", value: "group", checked: formData.participationType === 'group', onChange: (e) => setFormData({ ...formData, participationType: e.target.value }), className: "mr-2" }), _jsx("span", { className: "text-sm", children: "\uD83D\uDC65 Group Only" })] }), _jsxs("label", { className: "flex items-center cursor-pointer", children: [_jsx("input", { type: "radio", value: "both", checked: formData.participationType === 'both', onChange: (e) => setFormData({ ...formData, participationType: e.target.value }), className: "mr-2" }), _jsx("span", { className: "text-sm", children: "\uD83E\uDD1D Both" })] })] })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-semibold text-gray-700 mb-2", children: "Stall/Event Name *" }), _jsx("input", { type: "text", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black", required: true, placeholder: "e.g., Ring Toss Game" })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-semibold text-gray-700 mb-2", children: "Description" }), _jsx("textarea", { value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black", rows: 3, placeholder: "Brief description of the stall/event" })] }), formData.category === 'game' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-semibold text-gray-700 mb-2", children: "Token Cost *" }), _jsx("input", { type: "number", value: formData.tokenCost, onChange: (e) => setFormData({ ...formData, tokenCost: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black", min: "0", required: true })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-semibold text-gray-700 mb-2", children: "Game Rules" }), _jsx("textarea", { value: formData.gameRules, onChange: (e) => setFormData({ ...formData, gameRules: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black", rows: 4, placeholder: "Explain how to play the game, scoring rules, etc." })] })] })), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-semibold text-gray-700 mb-2", children: "Volunteers/Admins * (Select one or more)" }), _jsx("div", { className: "border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto bg-gray-50", children: users.map((user) => (_jsxs("label", { className: "flex items-center mb-2 cursor-pointer hover:bg-white p-2 rounded", children: [_jsx("input", { type: "checkbox", checked: formData.adminIds.includes(user._id), onChange: () => handleAdminSelect(user._id), className: "mr-3" }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium", children: user.name }), _jsxs("div", { className: "text-xs text-gray-500", children: [user.house, " | ", user.phone] })] })] }, user._id))) }), _jsx("p", { className: "text-xs text-gray-500 mt-1", children: "Selected volunteers will get admin access to manage this stall in their mobile app" })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-semibold text-gray-700 mb-2", children: "Location" }), _jsx("input", { type: "text", value: formData.location, onChange: (e) => setFormData({ ...formData, location: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black", placeholder: "e.g., Near main gate" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mb-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-semibold text-gray-700 mb-2", children: "Start Time" }), _jsx("input", { type: "datetime-local", value: formData.startTime, onChange: (e) => setFormData({ ...formData, startTime: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-semibold text-gray-700 mb-2", children: "End Time" }), _jsx("input", { type: "datetime-local", value: formData.endTime, onChange: (e) => setFormData({ ...formData, endTime: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black" })] })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-semibold text-gray-700 mb-2", children: "Maximum Participants" }), _jsx("input", { type: "number", value: formData.maxParticipants, onChange: (e) => setFormData({ ...formData, maxParticipants: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black", min: "0", placeholder: "Leave empty for unlimited" })] }), _jsxs("div", { className: "flex gap-4 mt-6", children: [_jsx("button", { type: "button", onClick: () => setShowModal(false), className: "flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors", children: "Cancel" }), _jsx("button", { type: "submit", className: "flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors", children: editingStall ? 'Update Stall' : 'Create Stall' })] })] })] }) }) })), showQRModal && selectedQR && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "bg-white rounded-lg max-w-md w-full p-8 text-center", children: [_jsx("h3", { className: "text-2xl font-bold mb-4", children: selectedQR.name }), _jsx("p", { className: "text-gray-600 mb-6", children: "Participants scan this QR code to join" }), _jsx("div", { className: "bg-white p-6 rounded-lg inline-block border-2 border-gray-200", children: _jsx("img", { src: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${selectedQR.qrCode}`, alt: "QR Code", className: "w-64 h-64" }) }), _jsx("p", { className: "mt-4 text-xs text-gray-500 font-mono break-all", children: selectedQR.qrCode }), _jsx("button", { onClick: () => setShowQRModal(false), className: "mt-6 px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors", children: "Close" })] }) })), showDeleteModal && deletingStall && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col", children: [_jsxs("div", { className: "p-6 border-b border-gray-200", children: [_jsx("h2", { className: "text-2xl font-bold text-gray-900", children: "Delete Stall" }), _jsx("p", { className: "text-sm text-gray-600 mt-1", children: deletingStall.name })] }), _jsxs("div", { className: "p-6 overflow-y-auto flex-1", children: [loadingParticipants ? (_jsx("div", { className: "text-center py-8", children: _jsx("div", { className: "text-lg", children: "Loading participants..." }) })) : participants.length > 0 ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4", children: _jsxs("div", { className: "flex items-start", children: [_jsx("span", { className: "text-yellow-600 text-xl mr-3", children: "\u26A0\uFE0F" }), _jsxs("div", { className: "text-sm text-yellow-800", children: [_jsxs("p", { className: "font-semibold mb-1", children: ["This stall has ", participants.length, " participation record(s)"] }), _jsx("p", { children: "You can either remove all participants individually, or use force delete to remove everything." })] })] }) }), _jsxs("div", { className: "mb-6", children: [_jsxs("h3", { className: "text-lg font-semibold mb-3", children: ["Participants (", participants.length, ")"] }), _jsx("div", { className: "space-y-2 max-h-96 overflow-y-auto", children: participants.map((participant) => (_jsxs("div", { className: "bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between", children: [_jsxs("div", { className: "flex-1", children: [_jsx("div", { className: "font-medium text-gray-900", children: participant.userName || participant.userId }), _jsxs("div", { className: "text-sm text-gray-600", children: ["Score: ", participant.score !== undefined ? participant.score : 'N/A', " | Status: ", _jsx("span", { className: `font-medium ${participant.status === 'completed' ? 'text-green-600' :
                                                                                    participant.status === 'pending' ? 'text-yellow-600' :
                                                                                        'text-gray-600'}`, children: participant.status || 'Unknown' })] }), _jsx("div", { className: "text-xs text-gray-500 mt-1", children: new Date(participant.createdAt).toLocaleString() })] }), _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("input", { type: "number", defaultValue: participant.score || 0, onBlur: (e) => handleUpdateScore(participant._id, parseFloat(e.target.value) || 0), className: "w-20 px-2 py-1 border border-gray-300 rounded text-sm", placeholder: "Score" }), _jsx("button", { onClick: () => handleRemoveParticipant(participant._id), className: "bg-red-50 text-red-700 px-3 py-1 rounded text-sm font-medium hover:bg-red-100 transition-colors", children: "Remove" })] })] }, participant._id))) })] }), _jsx("div", { className: "mb-4 bg-red-50 border border-red-200 rounded-lg p-4", children: _jsxs("label", { className: "flex items-start cursor-pointer", children: [_jsx("input", { type: "checkbox", checked: forceDelete, onChange: (e) => setForceDelete(e.target.checked), className: "mt-1 mr-3 h-5 w-5 text-red-600 border-gray-300 rounded focus:ring-red-500" }), _jsxs("div", { className: "text-sm", children: [_jsx("div", { className: "font-semibold text-red-800", children: "Force Delete" }), _jsxs("div", { className: "text-red-700", children: ["Delete this stall and all ", participants.length, " participation record(s). This action cannot be undone and will permanently remove all associated data."] })] })] }) })] })) : (_jsx("div", { className: "bg-green-50 border border-green-200 rounded-lg p-4 mb-4", children: _jsxs("div", { className: "flex items-start", children: [_jsx("span", { className: "text-green-600 text-xl mr-3", children: "\u2713" }), _jsxs("div", { className: "text-sm text-green-800", children: [_jsx("p", { className: "font-semibold mb-1", children: "No participants found" }), _jsx("p", { children: "This stall can be safely deleted without affecting any user data." })] })] }) })), _jsxs("div", { className: "bg-gray-50 border border-gray-200 rounded-lg p-4", children: [_jsx("h4", { className: "font-semibold text-gray-900 mb-2", children: "Deletion Summary" }), _jsxs("ul", { className: "text-sm text-gray-700 space-y-1", children: [_jsxs("li", { children: ["\u2022 Stall: ", _jsx("strong", { children: deletingStall.name })] }), _jsxs("li", { children: ["\u2022 Category: ", _jsx("strong", { children: deletingStall.category })] }), _jsxs("li", { children: ["\u2022 Total Participations: ", _jsx("strong", { children: deletingStall.totalParticipations })] }), _jsxs("li", { children: ["\u2022 Current Participants: ", _jsx("strong", { children: participants.length })] })] })] })] }), _jsxs("div", { className: "p-6 border-t border-gray-200 flex justify-end gap-3", children: [_jsx("button", { onClick: () => {
                                        setShowDeleteModal(false);
                                        setDeletingStall(null);
                                        setParticipants([]);
                                        setForceDelete(false);
                                    }, className: "px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors", children: "Cancel" }), _jsx("button", { onClick: handleConfirmDelete, disabled: participants.length > 0 && !forceDelete, className: `px-6 py-2 rounded-lg font-medium transition-colors ${participants.length > 0 && !forceDelete
                                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                        : 'bg-red-600 text-white hover:bg-red-700'}`, children: participants.length > 0 && forceDelete ? 'Force Delete Stall' : 'Delete Stall' })] })] }) }))] }));
};
export default Stalls;
