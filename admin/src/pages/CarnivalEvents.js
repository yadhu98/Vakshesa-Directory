import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import axiosInstance from '../services/api';
const CarnivalEventsPage = () => {
    const [events, setEvents] = useState([]);
    const [users, setUsers] = useState([]);
    const [activeEvent, setActiveEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [showQRModal, setShowQRModal] = useState(false);
    const [selectedQR, setSelectedQR] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'game',
        type: 'game',
        participationType: 'individual',
        adminIds: [],
        tokenCost: '5',
        gameRules: '',
        startTime: '',
        endTime: '',
        duration: '',
        maxParticipants: '',
        location: '',
    });
    useEffect(() => {
        loadData();
    }, []);
    const loadData = async () => {
        try {
            setLoading(true);
            const [eventsRes, usersRes, activeEventRes] = await Promise.all([
                axiosInstance.get('/carnival-admin/events'),
                axiosInstance.get('/carnival-admin/users'),
                axiosInstance.get('/events/active'),
            ]);
            setEvents(eventsRes.data.events || []);
            setUsers(usersRes.data.users || []);
            setActiveEvent(activeEventRes.data.event || null);
        }
        catch (error) {
            console.error('Load data error:', error);
            alert('Failed to load data: ' + (error.response?.data?.message || error.message));
        }
        finally {
            setLoading(false);
        }
    };
    const handleCreateClick = () => {
        if (!activeEvent) {
            alert('Please activate a carnival event first from the Events page');
            return;
        }
        setEditingEvent(null);
        setFormData({
            name: '',
            description: '',
            category: 'game',
            type: 'game',
            participationType: 'individual',
            adminIds: [],
            tokenCost: '5',
            gameRules: '',
            startTime: '',
            endTime: '',
            duration: '',
            maxParticipants: '',
            location: '',
        });
        setShowModal(true);
    };
    const handleEditClick = (event) => {
        setEditingEvent(event);
        setFormData({
            name: event.name,
            description: event.description || '',
            category: event.category,
            type: event.type,
            participationType: event.participationType || 'individual',
            adminIds: event.adminIds,
            tokenCost: event.tokenCost.toString(),
            gameRules: event.gameRules || '',
            startTime: event.startTime ? new Date(event.startTime).toISOString().slice(0, 16) : '',
            endTime: event.endTime ? new Date(event.endTime).toISOString().slice(0, 16) : '',
            duration: event.duration?.toString() || '',
            maxParticipants: event.maxParticipants?.toString() || '',
            location: event.location || '',
        });
        setShowModal(true);
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || formData.adminIds.length === 0) {
            alert('Please fill in all required fields');
            return;
        }
        try {
            if (editingEvent) {
                await axiosInstance.put(`/carnival-admin/events/${editingEvent._id}`, formData);
                alert('Event updated successfully!');
            }
            else {
                await axiosInstance.post('/carnival-admin/events', {
                    ...formData,
                    carnivalEventId: activeEvent._id,
                });
                alert('Event created successfully!');
            }
            setShowModal(false);
            loadData();
        }
        catch (error) {
            console.error('Submit error:', error);
            alert('Failed to save event: ' + (error.response?.data?.message || error.message));
        }
    };
    const toggleEventStatus = async (eventId, currentStatus) => {
        if (confirm(`Are you sure you want to ${currentStatus ? 'close' : 'open'} this event?`)) {
            try {
                await axiosInstance.patch(`/carnival-admin/events/${eventId}/toggle`, {
                    isOpen: !currentStatus,
                });
                alert(`Event ${!currentStatus ? 'opened' : 'closed'} successfully!`);
                loadData();
            }
            catch (error) {
                alert('Failed to toggle event: ' + (error.response?.data?.message || error.message));
            }
        }
    };
    const handleDelete = async (eventId) => {
        if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
            try {
                await axiosInstance.delete(`/carnival-admin/events/${eventId}`);
                alert('Event deleted successfully!');
                loadData();
            }
            catch (error) {
                alert('Failed to delete event: ' + (error.response?.data?.message || error.message));
            }
        }
    };
    const showQRCode = (event) => {
        setSelectedQR({ name: event.name, qrCode: event.qrCode });
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
    if (loading) {
        return (_jsx(Layout, { children: _jsx("div", { className: "flex items-center justify-center h-64", children: _jsx("div", { className: "text-xl", children: "Loading..." }) }) }));
    }
    return (_jsxs(Layout, { children: [_jsxs("div", { className: "max-w-7xl mx-auto px-4 py-8", children: [_jsxs("div", { className: "flex justify-between items-center mb-6", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-3xl font-bold text-gray-900", children: "Carnival Events" }), activeEvent && (_jsxs("p", { className: "text-sm text-gray-600 mt-1", children: ["Managing events for: ", activeEvent.name] }))] }), _jsx("button", { onClick: handleCreateClick, className: "bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors", children: "+ Create Event" })] }), !activeEvent && (_jsx("div", { className: "bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6", children: _jsx("p", { className: "text-yellow-800", children: "\u26A0\uFE0F No active carnival event. Please activate Phase 2 from the Events page to create carnival events." }) })), _jsx("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6", children: events.map((event) => (_jsxs("div", { className: "bg-white rounded-lg shadow-md p-6 border border-gray-200", children: [_jsxs("div", { className: "flex justify-between items-start mb-4", children: [_jsxs("div", { className: "flex-1", children: [_jsx("h3", { className: "text-lg font-bold text-gray-900 mb-1", children: event.name }), _jsx("span", { className: `inline-block px-3 py-1 rounded-full text-xs font-semibold ${event.category === 'game'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-purple-100 text-purple-800'}`, children: event.category === 'game' ? '🎮 Game' : '🎭 Stage Program' })] }), _jsxs("div", { className: "flex gap-2", children: [_jsx("span", { className: `px-3 py-1 rounded-full text-xs font-semibold ${event.isActive
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-gray-100 text-gray-800'}`, children: event.isActive ? 'Active' : 'Inactive' }), _jsx("span", { className: `px-3 py-1 rounded-full text-xs font-semibold ${event.isOpen
                                                        ? 'bg-green-100 text-green-800'
                                                        : 'bg-red-100 text-red-800'}`, children: event.isOpen ? 'Open' : 'Closed' })] })] }), event.description && (_jsx("p", { className: "text-sm text-gray-600 mb-3", children: event.description })), _jsxs("div", { className: "space-y-2 text-sm text-gray-700 mb-4", children: [event.category === 'game' && (_jsxs("div", { children: ["\uD83D\uDCB0 ", _jsx("strong", { children: "Tokens:" }), " ", event.tokenCost] })), event.category === 'stage_program' && (_jsxs("div", { children: ["\uD83C\uDF9F\uFE0F ", _jsx("strong", { children: "Free Entry" })] })), event.location && (_jsxs("div", { children: ["\uD83D\uDCCD ", _jsx("strong", { children: "Location:" }), " ", event.location] })), event.maxParticipants && (_jsxs("div", { children: ["\uD83D\uDC65 ", _jsx("strong", { children: "Participants:" }), " ", event.currentParticipants, "/", event.maxParticipants] })), _jsxs("div", { children: ["\uD83D\uDCCA ", _jsx("strong", { children: "Total:" }), " ", event.totalParticipations, " |", _jsx("strong", { className: "text-yellow-600", children: " Pending:" }), " ", event.pendingParticipations] })] }), _jsxs("div", { className: "mb-4", children: [_jsx("div", { className: "text-xs font-semibold text-gray-600 mb-1", children: "Event Admins:" }), _jsx("div", { className: "flex flex-wrap gap-1", children: event.adminNames.map((name, idx) => (_jsx("span", { className: "px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs", children: name }, idx))) })] }), event.gameRules && (_jsxs("div", { className: "mb-4 p-3 bg-gray-50 rounded-lg", children: [_jsx("div", { className: "text-xs font-semibold text-gray-600 mb-1", children: "Rules:" }), _jsx("p", { className: "text-xs text-gray-700", children: event.gameRules })] })), _jsxs("div", { className: "flex gap-2 flex-wrap", children: [_jsx("button", { onClick: () => showQRCode(event), className: "flex-1 bg-purple-50 text-purple-700 px-3 py-2 rounded text-sm font-medium hover:bg-purple-100 transition-colors", children: "\uD83D\uDCF1 QR Code" }), _jsx("button", { onClick: () => toggleEventStatus(event._id, event.isOpen), className: `flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${event.isOpen
                                                ? 'bg-red-50 text-red-700 hover:bg-red-100'
                                                : 'bg-green-50 text-green-700 hover:bg-green-100'}`, children: event.isOpen ? '⏸️ Close' : '▶️ Open' }), _jsx("button", { onClick: () => handleEditClick(event), className: "flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded text-sm font-medium hover:bg-blue-100 transition-colors", children: "\u270F\uFE0F Edit" }), _jsx("button", { onClick: () => handleDelete(event._id), className: "bg-red-50 text-red-700 px-3 py-2 rounded text-sm font-medium hover:bg-red-100 transition-colors", children: "\uD83D\uDDD1\uFE0F" })] })] }, event._id))) }), events.length === 0 && activeEvent && (_jsxs("div", { className: "text-center py-12", children: [_jsx("p", { className: "text-gray-500 text-lg", children: "No carnival events yet" }), _jsx("p", { className: "text-gray-400 text-sm mt-2", children: "Click \"Create Event\" to get started" })] }))] }), showModal && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", children: _jsx("div", { className: "bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto", children: _jsxs("div", { className: "p-6", children: [_jsx("h2", { className: "text-2xl font-bold mb-4", children: editingEvent ? 'Edit Event' : 'Create New Event' }), _jsxs("form", { onSubmit: handleSubmit, children: [_jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-semibold text-gray-700 mb-2", children: "Event Category *" }), _jsxs("div", { className: "flex gap-4", children: [_jsxs("label", { className: "flex items-center cursor-pointer", children: [_jsx("input", { type: "radio", value: "game", checked: formData.category === 'game', onChange: (e) => setFormData({ ...formData, category: e.target.value }), className: "mr-2", disabled: !!editingEvent }), _jsx("span", { className: "text-sm", children: "\uD83C\uDFAE Games & Miscellaneous" })] }), _jsxs("label", { className: "flex items-center cursor-pointer", children: [_jsx("input", { type: "radio", value: "stage_program", checked: formData.category === 'stage_program', onChange: (e) => setFormData({ ...formData, category: e.target.value, tokenCost: '0' }), className: "mr-2", disabled: !!editingEvent }), _jsx("span", { className: "text-sm", children: "\uD83C\uDFAD Stage Program" })] })] })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-semibold text-gray-700 mb-2", children: "Event Name *" }), _jsx("input", { type: "text", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black", required: true })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-semibold text-gray-700 mb-2", children: "Description" }), _jsx("textarea", { value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black", rows: 3 })] }), formData.category === 'game' && (_jsxs(_Fragment, { children: [_jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-semibold text-gray-700 mb-2", children: "Token Cost *" }), _jsx("input", { type: "number", value: formData.tokenCost, onChange: (e) => setFormData({ ...formData, tokenCost: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black", min: "0", required: true })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-semibold text-gray-700 mb-2", children: "Game Rules" }), _jsx("textarea", { value: formData.gameRules, onChange: (e) => setFormData({ ...formData, gameRules: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black", rows: 4, placeholder: "Explain how to play the game..." })] })] })), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-semibold text-gray-700 mb-2", children: "Event Admins * (Select one or more)" }), _jsx("div", { className: "border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto", children: users.map((user) => (_jsxs("label", { className: "flex items-center mb-2 cursor-pointer hover:bg-gray-50 p-2 rounded", children: [_jsx("input", { type: "checkbox", checked: formData.adminIds.includes(user._id), onChange: () => handleAdminSelect(user._id), className: "mr-3" }), _jsxs("div", { children: [_jsx("div", { className: "text-sm font-medium", children: user.name }), _jsxs("div", { className: "text-xs text-gray-500", children: [user.house, " | ", user.phone] })] })] }, user._id))) })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-semibold text-gray-700 mb-2", children: "Location" }), _jsx("input", { type: "text", value: formData.location, onChange: (e) => setFormData({ ...formData, location: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4 mb-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-semibold text-gray-700 mb-2", children: "Start Time" }), _jsx("input", { type: "datetime-local", value: formData.startTime, onChange: (e) => setFormData({ ...formData, startTime: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-semibold text-gray-700 mb-2", children: "End Time" }), _jsx("input", { type: "datetime-local", value: formData.endTime, onChange: (e) => setFormData({ ...formData, endTime: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black" })] })] }), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-semibold text-gray-700 mb-2", children: "Maximum Participants" }), _jsx("input", { type: "number", value: formData.maxParticipants, onChange: (e) => setFormData({ ...formData, maxParticipants: e.target.value }), className: "w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black", min: "0" })] }), _jsxs("div", { className: "flex gap-4 mt-6", children: [_jsx("button", { type: "button", onClick: () => setShowModal(false), className: "flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors", children: "Cancel" }), _jsx("button", { type: "submit", className: "flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors", children: editingEvent ? 'Update Event' : 'Create Event' })] })] })] }) }) })), showQRModal && selectedQR && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4", children: _jsxs("div", { className: "bg-white rounded-lg max-w-md w-full p-8 text-center", children: [_jsx("h3", { className: "text-2xl font-bold mb-4", children: selectedQR.name }), _jsx("p", { className: "text-gray-600 mb-6", children: "Participants scan this QR code to join" }), _jsx("div", { className: "bg-white p-6 rounded-lg inline-block border-2 border-gray-200", children: _jsx("img", { src: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${selectedQR.qrCode}`, alt: "QR Code", className: "w-64 h-64" }) }), _jsx("p", { className: "mt-4 text-xs text-gray-500 font-mono", children: selectedQR.qrCode }), _jsx("button", { onClick: () => setShowQRModal(false), className: "mt-6 px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors", children: "Close" })] }) }))] }));
};
export default CarnivalEventsPage;
