import React, { useState, useEffect } from 'react';
import { Layout } from '@components/Layout';
import axiosInstance from '@services/api';

interface Event {
  _id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  location?: string;
  status: 'upcoming' | 'active' | 'completed';
  isPhase2Active: boolean;
  phase2StartDate?: string;
  maxPoints: number;
  bannerImage?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const Events: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    location: '',
    status: 'upcoming' as 'upcoming' | 'active' | 'completed',
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
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingEvent) {
        await axiosInstance.put(`/events/${editingEvent._id}`, formData);
      } else {
        await axiosInstance.post('/events', formData);
      }
      resetForm();
      loadEvents();
      alert(`Event ${editingEvent ? 'updated' : 'created'} successfully!`);
    } catch (error: any) {
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

  const handleEdit = (event: Event) => {
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

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to delete this event?')) return;
    
    try {
      await axiosInstance.delete(`/events/${eventId}`);
      loadEvents();
      alert('Event deleted successfully!');
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to delete event');
    }
  };

  const updateStatus = async (eventId: string, newStatus: 'upcoming' | 'active' | 'completed') => {
    try {
      await axiosInstance.patch(`/events/${eventId}/status`, { status: newStatus });
      loadEvents();
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  const togglePhase2 = async (eventId: string, currentStatus: boolean) => {
    try {
      await axiosInstance.patch(`/events/${eventId}/phase2`, {
        isPhase2Active: !currentStatus,
      });
      loadEvents();
      alert(`Phase 2 ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to toggle Phase 2');
    }
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      upcoming: 'bg-yellow-100 text-yellow-800',
      active: 'bg-green-100 text-green-800',
      completed: 'bg-gray-100 text-gray-800',
    };
    return badges[status as keyof typeof badges] || 'bg-gray-100 text-gray-800';
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">🎪 Events Management</h1>
            <p className="text-gray-600 text-sm mt-1">Create and manage carnival events</p>
          </div>
          <button className="btn-primary" onClick={() => setShowModal(true)}>
            + Create Event
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="bg-white p-12 rounded-lg shadow text-center">
            <div className="text-6xl mb-4">🎪</div>
            <h3 className="text-xl font-bold mb-2">No Events Yet</h3>
            <p className="text-gray-600 mb-4">Create your first carnival event to get started</p>
            <button className="btn-primary" onClick={() => setShowModal(true)}>
              Create First Event
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {events.map(event => (
              <div key={event._id} className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold">{event.name}</h3>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(event.status)}`}>
                        {event.status.charAt(0).toUpperCase() + event.status.slice(1)}
                      </span>
                      {event.isPhase2Active && (
                        <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          🎮 Phase 2 Active
                        </span>
                      )}
                    </div>
                    {event.description && (
                      <p className="text-gray-600 text-sm mb-3">{event.description}</p>
                    )}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div>
                        <span className="text-gray-500">📅 Start:</span>
                        <div className="font-medium">{new Date(event.startDate).toLocaleDateString()}</div>
                      </div>
                      <div>
                        <span className="text-gray-500">🏁 End:</span>
                        <div className="font-medium">{new Date(event.endDate).toLocaleDateString()}</div>
                      </div>
                      {event.location && (
                        <div>
                          <span className="text-gray-500">📍 Location:</span>
                          <div className="font-medium">{event.location}</div>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-500">⭐ Max Points:</span>
                        <div className="font-medium">{event.maxPoints}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2 pt-4 border-t">
                  <select 
                    className="px-3 py-2 border rounded text-sm"
                    value={event.status}
                    onChange={(e) => updateStatus(event._id, e.target.value as any)}
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                  </select>

                  <button 
                    className={`px-4 py-2 rounded text-sm font-medium transition ${
                      event.isPhase2Active 
                        ? 'bg-purple-600 text-white hover:bg-purple-700' 
                        : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                    onClick={() => togglePhase2(event._id, event.isPhase2Active)}
                  >
                    {event.isPhase2Active ? '🎮 Disable Phase 2' : '🎮 Enable Phase 2'}
                  </button>

                  <div className="flex-1"></div>

                  <button 
                    className="px-4 py-2 border border-blue-300 text-blue-600 rounded text-sm hover:bg-blue-50"
                    onClick={() => handleEdit(event)}
                  >
                    ✏️ Edit
                  </button>

                  <button 
                    className="px-4 py-2 border border-red-300 text-red-600 rounded text-sm hover:bg-red-50"
                    onClick={() => handleDelete(event._id)}
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-bold mb-4">
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Event Name *</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Vakshesa Carnival 2025"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Description</label>
                  <textarea
                    className="input w-full"
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Brief description of the event..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Start Date *</label>
                    <input
                      type="date"
                      className="input w-full"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">End Date *</label>
                    <input
                      type="date"
                      className="input w-full"
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Location</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="e.g., Parish Hall"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">Status</label>
                    <select
                      className="input w-full"
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    >
                      <option value="upcoming">Upcoming</option>
                      <option value="active">Active</option>
                      <option value="completed">Completed</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">Max Points</label>
                    <input
                      type="number"
                      className="input w-full"
                      value={formData.maxPoints}
                      onChange={(e) => setFormData({ ...formData, maxPoints: Number(e.target.value) })}
                      min="100"
                      step="100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">Banner Image URL</label>
                  <input
                    type="text"
                    className="input w-full"
                    value={formData.bannerImage}
                    onChange={(e) => setFormData({ ...formData, bannerImage: e.target.value })}
                    placeholder="https://example.com/banner.jpg"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  className="flex-1 px-4 py-2 border rounded hover:bg-gray-50"
                  onClick={resetForm}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 btn-primary"
                  onClick={handleSubmit}
                  disabled={!formData.name || !formData.startDate || !formData.endDate}
                >
                  {editingEvent ? 'Update Event' : 'Create Event'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Events;
