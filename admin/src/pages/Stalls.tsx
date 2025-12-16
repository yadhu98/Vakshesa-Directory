import React, { useState, useEffect } from 'react';
import { Layout } from '@components/Layout';
import axiosInstance from '@services/api';
import toast, { Toaster } from 'react-hot-toast';

interface CarnivalEvent {
  _id: string;
  name: string;
  status: string;
  isPhase2Active: boolean;
}

interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  house: string;
}

interface Stall {
  _id: string;
  carnivalEventId: string;
  name: string;
  description?: string;
  category: 'game' | 'stage_program';
  type: string;
  adminIds: string[];
  adminNames: string[];
  tokenCost: number;
  gameRules?: string;
  participationType: 'individual' | 'group' | 'both';
  qrCode: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  maxParticipants?: number;
  currentParticipants: number;
  isActive: boolean;
  isOpen: boolean;
  totalParticipations: number;
  pendingParticipations: number;
  createdAt: string;
}

const Stalls: React.FC = () => {
  const [stalls, setStalls] = useState<Stall[]>([]);
  const [carnivals, setCarnivals] = useState<CarnivalEvent[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingStall, setEditingStall] = useState<Stall | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedQR, setSelectedQR] = useState<{ name: string; qrCode: string } | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deletingStall, setDeletingStall] = useState<Stall | null>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [forceDelete, setForceDelete] = useState(false);
  const [loadingParticipants, setLoadingParticipants] = useState(false);

  const [formData, setFormData] = useState({
    carnivalEventId: '',
    name: '',
    description: '',
    category: 'game' as 'game' | 'stage_program',
    type: 'game',
    adminIds: [] as string[],
    tokenCost: '5',
    gameRules: '',
    participationType: 'individual' as 'individual' | 'group' | 'both',
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
      const activeCarnival = allEvents.filter((e: CarnivalEvent) => 
        e.status === 'active' || e.status === 'upcoming'
      );
      console.log('Filtered active/upcoming carnivals:', activeCarnival);
      setCarnivals(activeCarnival);
    } catch (error: any) {
      console.error('Load data error:', error);
      toast.error('Failed to load data: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClick = () => {
    if (carnivals.length === 0) {
      toast.warning('No active or upcoming carnivals. Please create a carnival event first.');
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

  const handleEditClick = (stall: Stall) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.carnivalEventId || formData.adminIds.length === 0) {
      toast.warning('Please fill in all required fields');
      return;
    }

    try {
      if (editingStall) {
        await axiosInstance.put(`/carnival-admin/events/${editingStall._id}`, formData);
        toast.success('Stall updated successfully!');
      } else {
        await axiosInstance.post('/carnival-admin/events', formData);
        toast.success('Stall created successfully!');
      }

      setShowModal(false);
      loadData();
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error('Failed to save stall: ' + (error.response?.data?.message || error.message));
    }
  };

  const toggleStallStatus = async (stallId: string, currentStatus: boolean) => {
    if (confirm(`Are you sure you want to ${currentStatus ? 'close' : 'open'} this stall?`)) {
      try {
        await axiosInstance.patch(`/carnival-admin/events/${stallId}/toggle`, {
          isOpen: !currentStatus,
        });
        toast.success(`Stall ${!currentStatus ? 'opened' : 'closed'} successfully!`);
        loadData();
      } catch (error: any) {
        toast.error('Failed to toggle stall: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleToggleActive = async (stallId: string, currentStatus: boolean) => {
    const action = currentStatus ? 'deactivate' : 'activate';
    if (confirm(`Are you sure you want to ${action} this stall?`)) {
      try {
        await axiosInstance.put(`/carnival-admin/events/${stallId}/active`, {
          isActive: !currentStatus
        });
        toast.success(`Stall ${action}d successfully!`);
        loadData();
      } catch (error: any) {
        toast.error(`Failed to ${action} stall: ` + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleDeleteClick = async (stallId: string) => {
    const stall = stalls.find(s => s._id === stallId);
    if (!stall) return;

    setDeletingStall(stall);
    setForceDelete(false);

    // If stall has participations, load them
    if (stall.totalParticipations > 0) {
      setLoadingParticipants(true);
      try {
        const response = await axiosInstance.get(`/carnival-admin/events/${stallId}/participations`);
        setParticipants(response.data.participations || []);
      } catch (error: any) {
        toast.error('Failed to load participants: ' + (error.response?.data?.message || error.message));
        setParticipants([]);
      } finally {
        setLoadingParticipants(false);
      }
    } else {
      setParticipants([]);
    }

    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingStall) return;

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
    } catch (error: any) {
      const message = error.response?.data?.message || error.message;
      toast.error('Failed to delete stall: ' + message);
    }
  };

  const handleRemoveParticipant = async (participationId: string) => {
    if (!deletingStall) return;

    if (confirm('Are you sure you want to remove this participant?')) {
      try {
        await axiosInstance.delete(`/carnival-admin/participations/${participationId}`);
        toast.success('Participant removed successfully!');
        
        // Reload participants
        const response = await axiosInstance.get(`/carnival-admin/events/${deletingStall._id}/participations`);
        setParticipants(response.data.participations || []);
        
        // Reload stalls to update count
        loadData();
      } catch (error: any) {
        toast.error('Failed to remove participant: ' + (error.response?.data?.message || error.message));
      }
    }
  };

  const handleUpdateScore = async (participationId: string, newScore: number) => {
    try {
      await axiosInstance.patch(`/carnival-admin/participations/${participationId}`, {
        score: newScore
      });
      toast.success('Score updated successfully!');
      
      // Update local state
      setParticipants(prev => 
        prev.map(p => p._id === participationId ? { ...p, score: newScore } : p)
      );
    } catch (error: any) {
      toast.error('Failed to update score: ' + (error.response?.data?.message || error.message));
    }
  };

  const showQRCode = (stall: Stall) => {
    setSelectedQR({ name: stall.name, qrCode: stall.qrCode });
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

  const getCarnivalName = (carnivalId: string) => {
    return carnivals.find(c => c._id === carnivalId)?.name || 'Unknown Carnival';
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
      <Toaster position="top-right" />
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Stalls Management</h1>
            <p className="text-sm text-gray-600 mt-1">
              Create and manage carnival stalls, games, and stage programs
            </p>
          </div>
          <button
            onClick={handleCreateClick}
            className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors"
          >
            + Create Stall
          </button>
        </div>

        {/* Info Banner */}
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <span className="text-blue-600 text-xl mr-3">ℹ️</span>
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">Stall Management Tips:</p>
              <ul className="list-disc list-inside space-y-1 text-blue-700">
                <li><strong>Deactivate</strong> stalls to hide them while preserving participation data</li>
                <li><strong>Delete</strong> is only available for stalls with no participation records</li>
                <li>Use <strong>Pause/Open</strong> to temporarily control stall availability</li>
              </ul>
            </div>
          </div>
        </div>

        {carnivals.length === 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p className="text-yellow-800">
              ⚠️ No active or upcoming carnivals. Please create and activate a carnival event first.
            </p>
          </div>
        )}

        {/* Stalls Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stalls.map((stall) => (
            <div key={stall._id} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
              {/* Header */}
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{stall.name}</h3>
                  <p className="text-xs text-gray-500 mb-2">{getCarnivalName(stall.carnivalEventId)}</p>
                  <div className="flex gap-2 flex-wrap">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                      stall.category === 'game' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {stall.category === 'game' ? '🎮 Game' : '🎭 Stage'}
                    </span>
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                      {stall.participationType}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    stall.isActive 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {stall.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    stall.isOpen 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {stall.isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
              </div>

              {/* Description */}
              {stall.description && (
                <p className="text-sm text-gray-600 mb-3">{stall.description}</p>
              )}

              {/* Details */}
              <div className="space-y-2 text-sm text-gray-700 mb-4">
                {stall.category === 'game' && (
                  <div>💰 <strong>Tokens:</strong> {stall.tokenCost}</div>
                )}
                {stall.category === 'stage_program' && (
                  <div>🎟️ <strong>Free Entry</strong></div>
                )}
                {stall.location && (
                  <div>📍 <strong>Location:</strong> {stall.location}</div>
                )}
                {stall.maxParticipants && (
                  <div>
                    👥 <strong>Participants:</strong> {stall.currentParticipants}/{stall.maxParticipants}
                  </div>
                )}
                <div>
                  📊 <strong>Total:</strong> {stall.totalParticipations} | 
                  <strong className="text-yellow-600"> Pending:</strong> {stall.pendingParticipations}
                </div>
              </div>

              {/* Volunteers/Admins */}
              <div className="mb-4">
                <div className="text-xs font-semibold text-gray-600 mb-1">Volunteers:</div>
                <div className="flex flex-wrap gap-1">
                  {stall.adminNames.map((name, idx) => (
                    <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                      {name}
                    </span>
                  ))}
                </div>
              </div>

              {/* Game Rules */}
              {stall.gameRules && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <div className="text-xs font-semibold text-gray-600 mb-1">Rules:</div>
                  <p className="text-xs text-gray-700 line-clamp-2">{stall.gameRules}</p>
                </div>
              )}

              {/* Status Badge */}
              <div className="mb-3">
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                  stall.isActive 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {stall.isActive ? '✓ Active' : '✗ Inactive'}
                </span>
              </div>

              {/* Actions */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => showQRCode(stall)}
                  className="flex-1 bg-purple-50 text-purple-700 px-3 py-2 rounded text-sm font-medium hover:bg-purple-100 transition-colors"
                >
                  📱 QR
                </button>
                <button
                  onClick={() => toggleStallStatus(stall._id, stall.isOpen)}
                  className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                    stall.isOpen
                      ? 'bg-red-50 text-red-700 hover:bg-red-100'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}>
                  {stall.isOpen ? '⏸️ Pause' : '▶️ Open'}
                </button>
                <button
                  onClick={() => handleToggleActive(stall._id, stall.isActive)}
                  className={`flex-1 px-3 py-2 rounded text-sm font-medium transition-colors ${
                    stall.isActive
                      ? 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                      : 'bg-green-50 text-green-700 hover:bg-green-100'
                  }`}>
                  {stall.isActive ? '🚫 Deactivate' : '✓ Activate'}
                </button>
                <button
                  onClick={() => handleEditClick(stall)}
                  className="bg-blue-50 text-blue-700 px-3 py-2 rounded text-sm font-medium hover:bg-blue-100 transition-colors"
                >
                  ✏️
                </button>
                <button
                  onClick={() => handleDeleteClick(stall._id)}
                  className="bg-red-50 text-red-700 px-3 py-2 rounded text-sm font-medium hover:bg-red-100 transition-colors"
                  title={stall.totalParticipations > 0 ? `${stall.totalParticipations} participation(s)` : 'Delete stall'}
                >
                  🗑️ Delete
                </button>
              </div>
            </div>
          ))}
        </div>

        {stalls.length === 0 && carnivals.length > 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">No stalls yet</p>
            <p className="text-gray-400 text-sm mt-2">Click "Create Stall" to get started</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg max-w-3xl w-full my-8">
            <div className="p-6 max-h-[85vh] overflow-y-auto">
              <h2 className="text-2xl font-bold mb-4">
                {editingStall ? 'Edit Stall' : 'Create New Stall'}
              </h2>
              <form onSubmit={handleSubmit}>
                {/* Carnival Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Carnival Event *
                  </label>
                  <select
                    value={formData.carnivalEventId}
                    onChange={(e) => setFormData({ ...formData, carnivalEventId: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                    required
                    disabled={!!editingStall}
                  >
                    <option value="">Select a carnival</option>
                    {carnivals.map(carnival => (
                      <option key={carnival._id} value={carnival._id}>
                        {carnival.name} ({carnival.status})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Event Category */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Category *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        value="game"
                        checked={formData.category === 'game'}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                        className="mr-2"
                        disabled={!!editingStall}
                      />
                      <span className="text-sm">🎮 Games & Activities</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        value="stage_program"
                        checked={formData.category === 'stage_program'}
                        onChange={(e) => setFormData({ ...formData, category: e.target.value as any, tokenCost: '0' })}
                        className="mr-2"
                        disabled={!!editingStall}
                      />
                      <span className="text-sm">🎭 Stage Program</span>
                    </label>
                  </div>
                </div>

                {/* Participation Type */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Participation Type *
                  </label>
                  <div className="flex gap-4">
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        value="individual"
                        checked={formData.participationType === 'individual'}
                        onChange={(e) => setFormData({ ...formData, participationType: e.target.value as any })}
                        className="mr-2"
                      />
                      <span className="text-sm">👤 Individual Only</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        value="group"
                        checked={formData.participationType === 'group'}
                        onChange={(e) => setFormData({ ...formData, participationType: e.target.value as any })}
                        className="mr-2"
                      />
                      <span className="text-sm">👥 Group Only</span>
                    </label>
                    <label className="flex items-center cursor-pointer">
                      <input
                        type="radio"
                        value="both"
                        checked={formData.participationType === 'both'}
                        onChange={(e) => setFormData({ ...formData, participationType: e.target.value as any })}
                        className="mr-2"
                      />
                      <span className="text-sm">🤝 Both</span>
                    </label>
                  </div>
                </div>

                {/* Name */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Stall/Event Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
                    required
                    placeholder="e.g., Ring Toss Game"
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
                    placeholder="Brief description of the stall/event"
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
                        placeholder="Explain how to play the game, scoring rules, etc."
                      />
                    </div>
                  </>
                )}

                {/* Volunteer/Admin Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Volunteers/Admins * (Select one or more)
                  </label>
                  <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto bg-gray-50">
                    {users.map((user) => (
                      <label key={user._id} className="flex items-center mb-2 cursor-pointer hover:bg-white p-2 rounded">
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
                  <p className="text-xs text-gray-500 mt-1">
                    Selected volunteers will get admin access to manage this stall in their mobile app
                  </p>
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
                    placeholder="e.g., Near main gate"
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
                    placeholder="Leave empty for unlimited"
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
                    {editingStall ? 'Update Stall' : 'Create Stall'}
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
            <p className="mt-4 text-xs text-gray-500 font-mono break-all">{selectedQR.qrCode}</p>
            <button
              onClick={() => setShowQRModal(false)}
              className="mt-6 px-8 py-3 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal with Participants */}
      {showDeleteModal && deletingStall && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Delete Stall</h2>
              <p className="text-sm text-gray-600 mt-1">
                {deletingStall.name}
              </p>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto flex-1">
              {loadingParticipants ? (
                <div className="text-center py-8">
                  <div className="text-lg">Loading participants...</div>
                </div>
              ) : participants.length > 0 ? (
                <>
                  {/* Warning Banner */}
                  <div className="mb-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start">
                      <span className="text-yellow-600 text-xl mr-3">⚠️</span>
                      <div className="text-sm text-yellow-800">
                        <p className="font-semibold mb-1">This stall has {participants.length} participation record(s)</p>
                        <p>You can either remove all participants individually, or use force delete to remove everything.</p>
                      </div>
                    </div>
                  </div>

                  {/* Participants List */}
                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-3">Participants ({participants.length})</h3>
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {participants.map((participant: any) => (
                        <div 
                          key={participant._id}
                          className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <div className="font-medium text-gray-900">
                              {participant.userName || participant.userId}
                            </div>
                            <div className="text-sm text-gray-600">
                              Score: {participant.score !== undefined ? participant.score : 'N/A'} | 
                              Status: <span className={`font-medium ${
                                participant.status === 'completed' ? 'text-green-600' : 
                                participant.status === 'pending' ? 'text-yellow-600' : 
                                'text-gray-600'
                              }`}>{participant.status || 'Unknown'}</span>
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {new Date(participant.createdAt).toLocaleString()}
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            {/* Score Edit */}
                            <input
                              type="number"
                              defaultValue={participant.score || 0}
                              onBlur={(e) => handleUpdateScore(participant._id, parseFloat(e.target.value) || 0)}
                              className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                              placeholder="Score"
                            />
                            
                            {/* Remove Button */}
                            <button
                              onClick={() => handleRemoveParticipant(participant._id)}
                              className="bg-red-50 text-red-700 px-3 py-1 rounded text-sm font-medium hover:bg-red-100 transition-colors"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Force Delete Checkbox */}
                  <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-4">
                    <label className="flex items-start cursor-pointer">
                      <input
                        type="checkbox"
                        checked={forceDelete}
                        onChange={(e) => setForceDelete(e.target.checked)}
                        className="mt-1 mr-3 h-5 w-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
                      />
                      <div className="text-sm">
                        <div className="font-semibold text-red-800">Force Delete</div>
                        <div className="text-red-700">
                          Delete this stall and all {participants.length} participation record(s). 
                          This action cannot be undone and will permanently remove all associated data.
                        </div>
                      </div>
                    </label>
                  </div>
                </>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <div className="flex items-start">
                    <span className="text-green-600 text-xl mr-3">✓</span>
                    <div className="text-sm text-green-800">
                      <p className="font-semibold mb-1">No participants found</p>
                      <p>This stall can be safely deleted without affecting any user data.</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Summary */}
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Deletion Summary</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li>• Stall: <strong>{deletingStall.name}</strong></li>
                  <li>• Category: <strong>{deletingStall.category}</strong></li>
                  <li>• Total Participations: <strong>{deletingStall.totalParticipations}</strong></li>
                  <li>• Current Participants: <strong>{participants.length}</strong></li>
                </ul>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setDeletingStall(null);
                  setParticipants([]);
                  setForceDelete(false);
                }}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={participants.length > 0 && !forceDelete}
                className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                  participants.length > 0 && !forceDelete
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {participants.length > 0 && forceDelete ? 'Force Delete Stall' : 'Delete Stall'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Stalls;
