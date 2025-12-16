import React, { useState, useEffect } from 'react';
import { Layout } from '../components/Layout';
import axiosInstance from '../services/api';

interface CarnivalEvent {
  _id: string;
  carnivalEventId: string;
  name: string;
  description?: string;
  category: 'game' | 'stage_program';
  type: string;
  participationType?: 'individual' | 'group' | 'both';
  adminIds: string[];
  adminNames: string[];
  tokenCost: number;
  gameRules?: string;
  qrCode: string;
  startTime?: string;
  endTime?: string;
  duration?: number;
  maxParticipants?: number;
  currentParticipants: number;
  isActive: boolean;
  isOpen: boolean;
  location?: string;
  createdBy: string;
  creatorName: string;
  totalParticipations: number;
  pendingParticipations: number;
  createdAt: string;
}

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  house: string;
  role: string;
}

const CarnivalEventsPage: React.FC = () => {
  const [events, setEvents] = useState<CarnivalEvent[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeEvent, setActiveEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CarnivalEvent | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQR, setSelectedQR] = useState<{ name: string; qrCode: string } | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: 'game' as 'game' | 'stage_program',
    type: 'game',
    participationType: 'individual' as 'individual' | 'group' | 'both',
    adminIds: [] as string[],
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
    } catch (error: any) {
      console.error('Load data error:', error);
      alert('Failed to load data: ' + (error.response?.data?.message || error.message));
    } finally {
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

  const handleEditClick = (event: CarnivalEvent) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || formData.adminIds.length === 0) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      if (editingEvent) {
        await axiosInstance.put(`/carnival-admin/events/${editingEvent._id}`, formData);
        alert('Event updated successfully!');
      } else {
        await axiosInstance.post('/carnival-admin/events', {
          ...formData,
          carnivalEventId: activeEvent._id,
        });
        alert('Event created successfully!');
      }

      setShowModal(false);
      loadData();
    } catch (error: any) {
      console.error('Submit error:', error);
      alert('Failed to save event: ' + (error.response?.data?.message || error.message));
    }
  };

  const toggleEventStatus = async (eventId: string, currentStatus: boolean) => {
    if (confirm(`Are you sure you want to ${currentStatus ? 'close' : 'open'} this event?`)) {
      try {
        await axiosInstance.patch(`/carnival-admin/events/${eventId}/toggle`, {
          isOpen: !currentStatus,
        });
        alert(`Event ${!currentStatus ? 'opened' : 'closed'} successfully!`);
        loadData();
      } catch (error: any) {
        alert('Failed to toggle event: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleDelete = async (eventId: string) => {
    if (confirm('Are you sure you want to delete this event? This action cannot be undone.')) {
      try {
        await axiosInstance.delete(`/carnival-admin/events/${eventId}`);
        alert('Event deleted successfully!');
        loadData();
      } catch (error: any) {
        alert('Failed to delete event: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const showQRCode = (event: CarnivalEvent) => {
    setSelectedQR({ name: event.name, qrCode: event.qrCode });
    setShowQRModal(true);
  };

  const handleAdminSelect = (userId: string) => {
    setFormData(prev => ({
      ...prev,
      adminIds: prev.adminIds.includes(userId)
        ? prev.adminIds.filter(id => id !== userId)
        : [...prev.adminIds, userId],
    }));
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="text-xl">Loading...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Carnival Events</h1>
            {activeEvent && (
              <p className="text-sm text-gray-600 mt-1">
                Managing events for: {activeEvent.name}
              </p>
            )}
          </div>
          <button
            onClick={handleCreateClick}
            className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            + Create Event
          </button>
        </div>

        {!activeEvent && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">
              ⚠️ No active carnival event. Please activate Phase 2 from the Events page to create carnival events.
            </p>
          </div>
        )}

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div key={event._id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{event.name}</h3>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                    event.category === 'game' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {event.category === 'game' ? '🎮 Game' : '🎭 Stage Program'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    event.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {event.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    event.isOpen 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {event.isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
              </div>

              {/* Description */}
              {event.description && (
                <p className="text-sm text-gray-600 mb-3">{event.description}</p>
              )}

              {/* Details */}
              <div className="space-y-2 text-sm text-gray-700 mb-4">
                {event.category === 'game' && (
                  <div>💰 <strong>Tokens:</strong> {event.tokenCost}</div>
                )}
                {event.category === 'stage_program' && (
                  <div>🎟️ <strong>Free Entry</strong></div>
                )}
                {event.location && (
                  <div>📍 <strong>Location:</strong> {event.location}</div>
                )}
                {event.maxParticipants && (
                  <div>
                    👥 <strong>Participants:</strong> {event.currentParticipants}/{event.maxParticipants}
                  </div>
                )}
                <div>
                  📊 <strong>Total:</strong> {event.totalParticipations} | 
                  <strong className="text-yellow-600"> Pending:</strong> {event.pendingParticipations}
                </div>
              </div>

              {/* Admins */}
              <div className="mb-4">
                <div className="text-xs font-semibold text-gray-600 mb-1">Event Admins:</div>
                <div className="flex flex-wrap gap-1">
                  {event.adminNames.map((name, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Game Rules */}
              {event.gameRules && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs font-semibold text-gray-600 mb-1">Rules:</div>
                  <p className="text-xs text-gray-700">{event.gameRules}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => showQRCode(event)}
                  className="flex-1 bg-purple-50 text-purple-700 px-3 py-2 rounded text-sm font-medium hover:bg-purple-100 transition-colors"
                >
                  📱 QR Code
                </button>
                <button
                  onClick={() => toggleEventStatus(event._id, event.isOpen)}
                  className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                    event.isOpen
                      ? 'bg-red-50 text-red-700 hover:bg-red-100'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}
                >
                  {event.isOpen ? '⏸️ Close' : '▶️ Open'}
                </button>
                <button
                  onClick={() => handleEditClick(event)}
                  className="flex-1 bg-blue-50 text-blue-700 px-3 py-2 rounded text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                  ✏️ Edit
                </button>
                <button
                  onClick={() => handleDelete(event._id)}
                  className="bg-red-50 text-red-700 px-3 py-2 rounded text-sm font-medium hover:bg-red-100 transition-colors"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>

        {events.length === 0 && activeEvent && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No carnival events yet</p>
            <p className="text-gray-400 text-sm mt-2">Click "Create Event" to get started</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-2xl font-bold mb-4">
                {editingEvent ? 'Edit Event' : 'Create New Event'}
              </h2>
              <form onSubmit={handleSubmit}>
                {/* Event Category */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Event Category *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        value="game"
                        checked={formData.category === 'game'}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                        className="mr-2"
                        disabled={!!editingEvent}
                      />
                      <span className="text-sm">🎮 Games & Miscellaneous</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        value="stage_program"
                        checked={formData.category === 'stage_program'}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as any, tokenCost: '0' })}
                        className="mr-2"
                        disabled={!!editingEvent}
                      />
                      <span className="text-sm">🎭 Stage Program</span>
                    </label>
                  </div>
                </div>

                {/* Name */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Event Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                    required
                  />
                </div>

                {/* Description */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                    rows={3}
                  />
                </div>

                {/* Token Cost (only for games) */}
                {formData.category === 'game' && (
                  <>
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Token Cost *
                      </label>
                      <input
                        type="number"
                        value={formData.tokenCost}
                        onChange={(e) => setFormData({ ...formData, tokenCost: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                        min="0"
                        required
                      />
                    </div>

                    {/* Game Rules */}
                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Game Rules
                      </label>
                      <textarea
                        value={formData.gameRules}
                        onChange={(e) => setFormData({ ...formData, gameRules: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                        rows={4}
                        placeholder="Explain how to play the game..."
                      />
                    </div>
                  </>
                )}

                {/* Admin Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Event Admins * (Select one or more)
                  </label>
                  <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                    {users.map((user) => (
                      <label key={user._id} className="flex items-center mb-2 cursor-pointer hover:bg-gray-50 p-2 rounded">
                        <input
                          type="checkbox"
                          checked={formData.adminIds.includes(user._id)}
                          onChange={() => handleAdminSelect(user._id)}
                          className="mr-3"
                        />
                        <div>
                          <div className="text-sm font-medium">{user.name}</div>
                          <div className="text-xs text-gray-500">{user.house} | {user.phone}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Location */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Location
                  </label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                  />
                </div>

                {/* Timing */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Start Time
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      End Time
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                    />
                  </div>
                </div>

                {/* Max Participants */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Maximum Participants
                  </label>
                  <input
                    type="number"
                    value={formData.maxParticipants}
                    onChange={(e) => setFormData({ ...formData, maxParticipants: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                    min="0"
                  />
                </div>

                {/* Actions */}
                <div className="flex gap-4 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
                  >
                    {editingEvent ? 'Update Event' : 'Create Event'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* QR Code Modal */}
      {showQRModal && selectedQR && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-8 text-center">
            <h3 className="text-2xl font-bold mb-4">{selectedQR.name}</h3>
            <p className="text-gray-600 mb-6">Participants scan this QR code to join</p>
            <div className="bg-white p-6 rounded-lg inline-block border-2 border-gray-200">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${selectedQR.qrCode}`}
                alt="QR Code"
                className="w-64 h-64"
              />
            </div>
            <p className="mt-4 text-xs text-gray-500 font-mono">{selectedQR.qrCode}</p>
            <button
              onClick={() => setShowQRModal(false)}
              className="mt-6 px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default CarnivalEventsPage;
