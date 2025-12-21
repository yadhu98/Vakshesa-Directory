import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { Layout } from '@components/Layout';
import axiosInstance from '@services/api';
const Events = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingEvent, setEditingEvent] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        location: '',
        status: 'upcoming',
        maxPoints: 1000,
        bannerImage: '',
    });
    useEffect(() => {
        loadEvents();
    }, []);
    const loadEvents = async () => {
        try {
            const res = await axiosInstance.get('/events');
            setEvents(res.data.data.events || []);
        }
        catch (error) {
            console.error('Failed to load events:', error);
        }
        finally {
            setLoading(false);
        }
    };
    const handleSubmit = async () => {
        try {
            if (editingEvent) {
                await axiosInstance.put(`/events/${editingEvent._id}`, formData);
            }
            else {
                await axiosInstance.post('/events', formData);
            }
            resetForm();
            loadEvents();
            alert(`Event ${editingEvent ? 'updated' : 'created'} successfully!`);
        }
        catch (error) {
            alert(error.response?.data?.message || `Failed to ${editingEvent ? 'update' : 'create'} event`);
        }
    };
    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            startDate: '',
            endDate: '',
            location: '',
            status: 'upcoming',
            maxPoints: 1000,
            bannerImage: '',
        });
        setEditingEvent(null);
        setShowModal(false);
    };
    const handleEdit = (event) => {
        setEditingEvent(event);
        setFormData({
            name: event.name,
            description: event.description || '',
            startDate: event.startDate.split('T')[0],
            endDate: event.endDate.split('T')[0],
            location: event.location || '',
            status: event.status,
            maxPoints: event.maxPoints,
            bannerImage: event.bannerImage || '',
        });
        setShowModal(true);
    };
    const handleDelete = async (eventId) => {
        if (!confirm('Are you sure you want to delete this event?'))
            return;
        try {
            await axiosInstance.delete(`/events/${eventId}`);
            loadEvents();
            alert('Event deleted successfully!');
        }
        catch (error) {
            alert(error.response?.data?.message || 'Failed to delete event');
        }
    };
    const updateStatus = async (eventId, newStatus) => {
        try {
            await axiosInstance.patch(`/events/${eventId}/status`, { status: newStatus });
            loadEvents();
        }
        catch (error) {
            alert(error.response?.data?.message || 'Failed to update status');
        }
    };
    const togglePhase2 = async (eventId, currentStatus) => {
        try {
            await axiosInstance.patch(`/events/${eventId}/phase2`, {
                isPhase2Active: !currentStatus,
            });
            loadEvents();
            alert(`Phase 2 ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
        }
        catch (error) {
            alert(error.response?.data?.message || 'Failed to toggle Phase 2');
        }
    };
    const getStatusBadge = (status) => {
        const badges = {
            upcoming: 'bg-yellow-100 text-yellow-800',
            active: 'bg-green-100 text-green-800',
            completed: 'bg-gray-100 text-gray-800',
        };
        return badges[status] || 'bg-gray-100 text-gray-800';
    };
    return (_jsx(Layout, { children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "flex justify-between items-center", children: [_jsxs("div", { children: [_jsx("h1", { className: "text-2xl font-bold", children: "\uD83C\uDFAA Events Management" }), _jsx("p", { className: "text-gray-600 text-sm mt-1", children: "Create and manage carnival events" })] }), _jsx("button", { className: "btn-primary", onClick: () => setShowModal(true), children: "+ Create Event" })] }), loading ? (_jsx("div", { className: "text-center py-8", children: "Loading events..." })) : events.length === 0 ? (_jsxs("div", { className: "bg-white p-12 rounded-lg shadow text-center", children: [_jsx("div", { className: "text-6xl mb-4", children: "\uD83C\uDFAA" }), _jsx("h3", { className: "text-xl font-bold mb-2", children: "No Events Yet" }), _jsx("p", { className: "text-gray-600 mb-4", children: "Create your first carnival event to get started" }), _jsx("button", { className: "btn-primary", onClick: () => setShowModal(true), children: "Create First Event" })] })) : (_jsx("div", { className: "grid grid-cols-1 gap-4", children: events.map(event => (_jsxs("div", { className: "bg-white p-6 rounded-lg shadow hover:shadow-lg transition", children: [_jsx("div", { className: "flex items-start justify-between mb-4", children: _jsxs("div", { className: "flex-1", children: [_jsxs("div", { className: "flex items-center gap-3 mb-2", children: [_jsx("h3", { className: "text-xl font-bold", children: event.name }), _jsx("span", { className: `px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(event.status)}`, children: event.status.charAt(0).toUpperCase() + event.status.slice(1) }), event.isPhase2Active && (_jsx("span", { className: "px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800", children: "\uD83C\uDFAE Phase 2 Active" }))] }), event.description && (_jsx("p", { className: "text-gray-600 text-sm mb-3", children: event.description })), _jsxs("div", { className: "grid grid-cols-2 md:grid-cols-4 gap-3 text-sm", children: [_jsxs("div", { children: [_jsx("span", { className: "text-gray-500", children: "\uD83D\uDCC5 Start:" }), _jsx("div", { className: "font-medium", children: new Date(event.startDate).toLocaleDateString() })] }), _jsxs("div", { children: [_jsx("span", { className: "text-gray-500", children: "\uD83C\uDFC1 End:" }), _jsx("div", { className: "font-medium", children: new Date(event.endDate).toLocaleDateString() })] }), event.location && (_jsxs("div", { children: [_jsx("span", { className: "text-gray-500", children: "\uD83D\uDCCD Location:" }), _jsx("div", { className: "font-medium", children: event.location })] })), _jsxs("div", { children: [_jsx("span", { className: "text-gray-500", children: "\u2B50 Max Points:" }), _jsx("div", { className: "font-medium", children: event.maxPoints })] })] })] }) }), _jsxs("div", { className: "flex items-center gap-2 pt-4 border-t", children: [_jsxs("select", { className: "px-3 py-2 border rounded text-sm", value: event.status, onChange: (e) => updateStatus(event._id, e.target.value), children: [_jsx("option", { value: "upcoming", children: "Upcoming" }), _jsx("option", { value: "active", children: "Active" }), _jsx("option", { value: "completed", children: "Completed" })] }), _jsx("button", { className: `px-4 py-2 rounded text-sm font-medium transition ${event.isPhase2Active
                                            ? 'bg-purple-600 text-white hover:bg-purple-700'
                                            : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`, onClick: () => togglePhase2(event._id, event.isPhase2Active), children: event.isPhase2Active ? '🎮 Disable Phase 2' : '🎮 Enable Phase 2' }), _jsx("div", { className: "flex-1" }), _jsx("button", { className: "px-4 py-2 border border-blue-300 text-blue-600 rounded text-sm hover:bg-blue-50", onClick: () => handleEdit(event), children: "\u270F\uFE0F Edit" }), _jsx("button", { className: "px-4 py-2 border border-red-300 text-red-600 rounded text-sm hover:bg-red-50", onClick: () => handleDelete(event._id), children: "\uD83D\uDDD1\uFE0F Delete" })] })] }, event._id))) })), showModal && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50", children: _jsxs("div", { className: "bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: editingEvent ? 'Edit Event' : 'Create New Event' }), _jsxs("div", { className: "space-y-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Event Name *" }), _jsx("input", { type: "text", className: "input w-full", value: formData.name, onChange: (e) => setFormData({ ...formData, name: e.target.value }), placeholder: "e.g., Vakshesa Carnival 2025" })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Description" }), _jsx("textarea", { className: "input w-full", rows: 3, value: formData.description, onChange: (e) => setFormData({ ...formData, description: e.target.value }), placeholder: "Brief description of the event..." })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Start Date *" }), _jsx("input", { type: "date", className: "input w-full", value: formData.startDate, onChange: (e) => setFormData({ ...formData, startDate: e.target.value }) })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "End Date *" }), _jsx("input", { type: "date", className: "input w-full", value: formData.endDate, onChange: (e) => setFormData({ ...formData, endDate: e.target.value }) })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Location" }), _jsx("input", { type: "text", className: "input w-full", value: formData.location, onChange: (e) => setFormData({ ...formData, location: e.target.value }), placeholder: "e.g., Parish Hall" })] }), _jsxs("div", { className: "grid grid-cols-2 gap-4", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Status" }), _jsxs("select", { className: "input w-full", value: formData.status, onChange: (e) => setFormData({ ...formData, status: e.target.value }), children: [_jsx("option", { value: "upcoming", children: "Upcoming" }), _jsx("option", { value: "active", children: "Active" }), _jsx("option", { value: "completed", children: "Completed" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Max Points" }), _jsx("input", { type: "number", className: "input w-full", value: formData.maxPoints, onChange: (e) => setFormData({ ...formData, maxPoints: Number(e.target.value) }), min: "100", step: "100" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium mb-1", children: "Banner Image URL" }), _jsx("input", { type: "text", className: "input w-full", value: formData.bannerImage, onChange: (e) => setFormData({ ...formData, bannerImage: e.target.value }), placeholder: "https://example.com/banner.jpg" })] })] }), _jsxs("div", { className: "flex gap-3 mt-6", children: [_jsx("button", { className: "flex-1 px-4 py-2 border rounded hover:bg-gray-50", onClick: resetForm, children: "Cancel" }), _jsx("button", { className: "flex-1 btn-primary", onClick: handleSubmit, disabled: !formData.name || !formData.startDate || !formData.endDate, children: editingEvent ? 'Update Event' : 'Create Event' })] })] }) }))] }) }));
};
export default Events;
