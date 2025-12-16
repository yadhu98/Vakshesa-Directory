import React, { useState, useEffect } from 'react';
import { Layout } from '@components/Layout';
import axiosInstance from '@services/api';

interface TokenConfig {
  amountToTokenRatio: number;
  minRecharge: number;
  maxRecharge: number;
}

interface Event {
  _id: string;
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  status: 'upcoming' | 'active' | 'completed';
  isPhase2Active: boolean;
  phase2StartDate?: string;
  isActive: boolean;
}

const EventSettings: React.FC = () => {
  const [generating, setGenerating] = useState(false);
  const [code, setCode] = useState<{ code: string; expiresAt: string } | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [tokenConfig, setTokenConfig] = useState<TokenConfig>({
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
      const activeEvent = eventsList.find((e: Event) => e.status === 'active' || e.isPhase2Active);
      if (activeEvent && !selectedEventId) {
        setSelectedEventId(activeEvent._id);
      }
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoadingEvents(false);
    }
  };

  const loadTokenConfig = async (eventId: string) => {
    try {
      const res = await axiosInstance.get(`/admin/token-config/${eventId}`);
      if (res.data.config) {
        setTokenConfig({
          amountToTokenRatio: res.data.config.amountToTokenRatio,
          minRecharge: res.data.config.minRecharge,
          maxRecharge: res.data.config.maxRecharge,
        });
      }
    } catch (error: any) {
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
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to save token configuration');
    } finally {
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
        .filter((t: any) => t.type === 'recharge' && t.status === 'completed')
        .reduce((sum: number, t: any) => sum + t.tokensUsed, 0);
      const totalSpent = transactions
        .filter((t: any) => t.type === 'payment' && t.status === 'completed')
        .reduce((sum: number, t: any) => sum + t.tokensUsed, 0);

      setStats({
        totalUsers: usersRes.data.users?.length || 0,
        totalFamilies: familiesRes.data?.length || 0,
        totalStalls: stallsRes.data.stalls?.length || 0,
        totalTokensIssued: totalIssued,
        totalTokensSpent: totalSpent,
      });
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  const generateAdminCode = async () => {
    setGenerating(true);
    try {
      const res = await axiosInstance.post('/admin/admin-code');
      setCode(res.data);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to generate code');
    } finally {
      setGenerating(false);
    }
  };

  const calculateTokensForAmount = (amount: number) => {
    return Math.floor(amount * tokenConfig.amountToTokenRatio);
  };

  const calculateAmountForTokens = (tokens: number) => {
    return (tokens / tokenConfig.amountToTokenRatio).toFixed(2);
  };

  const togglePhase2 = async (eventId: string, currentStatus: boolean) => {
    try {
      await axiosInstance.patch(`/events/${eventId}/phase2`, {
        isPhase2Active: !currentStatus,
      });
      loadEvents(); // Reload events to show updated status
      alert(`Phase 2 ${!currentStatus ? 'activated' : 'deactivated'} successfully!`);
    } catch (error: any) {
      alert(error.response?.data?.message || 'Failed to toggle Phase 2');
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold">⚙️ Event Settings</h1>

        {/* Token Configuration */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-4">🎟️ Token Configuration</h2>
          <p className="text-sm text-gray-600 mb-4">
            Configure how money converts to tokens for the event
          </p>

          {/* Event Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Select Event</label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-black"
              value={selectedEventId}
              onChange={(e) => setSelectedEventId(e.target.value)}
            >
              <option value="">-- Select an Event --</option>
              {events.map((event) => (
                <option key={event._id} value={event._id}>
                  {event.name} ({event.status})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Amount to Token Ratio</label>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">₹1 =</span>
                <input
                  type="number"
                  className="input flex-1"
                  value={tokenConfig.amountToTokenRatio}
                  onChange={(e) => setTokenConfig({ ...tokenConfig, amountToTokenRatio: Number(e.target.value) })}
                  min="0.1"
                  step="0.5"
                />
                <span className="text-sm text-gray-600">tokens</span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Minimum Recharge (₹)</label>
              <input
                type="number"
                className="input"
                value={tokenConfig.minRecharge}
                onChange={(e) => setTokenConfig({ ...tokenConfig, minRecharge: Number(e.target.value) })}
                min="1"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Maximum Recharge (₹)</label>
              <input
                type="number"
                className="input"
                value={tokenConfig.maxRecharge}
                onChange={(e) => setTokenConfig({ ...tokenConfig, maxRecharge: Number(e.target.value) })}
                min="1"
              />
            </div>
          </div>

          {/* Token Calculator */}
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <h3 className="font-bold text-sm mb-3">💡 Quick Calculator</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              <div className="bg-white p-3 rounded">
                <div className="text-gray-600">₹100 =</div>
          <div className="text-xl font-bold text-blue-600">{calculateTokensForAmount(100)} tokens</div>
        </div>
        <div className="bg-white p-3 rounded">
          <div className="text-gray-600">₹500 =</div>
          <div className="text-xl font-bold text-blue-600">{calculateTokensForAmount(500)} tokens</div>
        </div>
              <div className="bg-white p-3 rounded">
                <div className="text-gray-600">100 tokens =</div>
                <div className="text-xl font-bold text-green-600">₹{calculateAmountForTokens(100)}</div>
              </div>
              <div className="bg-white p-3 rounded">
                <div className="text-gray-600">500 tokens =</div>
                <div className="text-xl font-bold text-green-600">₹{calculateAmountForTokens(500)}</div>
              </div>
            </div>
          </div>

          <button className="btn-primary mt-4">
            Save Token Configuration
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Event Statistics */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-4">📊 Event Statistics</h2>
            {loadingStats ? (
              <div className="text-center py-4 text-gray-500">Loading...</div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-gray-600">Total Users:</span>
                  <span className="font-bold text-lg">{stats.totalUsers}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-gray-600">Total Families:</span>
                  <span className="font-bold text-lg">{stats.totalFamilies}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                  <span className="text-gray-600">Total Stalls:</span>
                  <span className="font-bold text-lg">{stats.totalStalls}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                  <span className="text-gray-600">Tokens Issued:</span>
                  <span className="font-bold text-lg text-green-600">{stats.totalTokensIssued}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                  <span className="text-gray-600">Tokens Spent:</span>
                  <span className="font-bold text-lg text-blue-600">{stats.totalTokensSpent}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                  <span className="text-gray-600">Tokens Available:</span>
                  <span className="font-bold text-lg text-purple-600">{stats.totalTokensIssued - stats.totalTokensSpent}</span>
                </div>
              </div>
            )}
          </div>

          {/* Admin Code Generator */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-4">🔑 Admin Code Generator</h2>
            <p className="text-sm text-gray-600 mb-4">
              Generate a one-time validation code for new admin registrations. Code expires in 1 minute.
            </p>
            <button 
              className="btn-primary w-full mb-4" 
              onClick={generateAdminCode}
              disabled={generating}
            >
              {generating ? 'Generating...' : 'Generate New Code'}
            </button>
            {code && (
              <div className="bg-blue-50 p-4 rounded border border-blue-200">
                <div className="text-center">
                  <p className="text-sm text-gray-600 mb-2">Validation Code:</p>
                  <p className="text-3xl font-mono font-bold text-blue-600">{code.code}</p>
                  <p className="text-xs text-gray-500 mt-2">
                    Expires: {new Date(code.expiresAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Phase Controls & Money Management */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-4">🎪 Phase 2 Controls</h2>
            <p className="text-sm text-gray-600 mb-4">
              Enable or disable Phase 2 (Carnival Mode) for specific events. Only one event can have Phase 2 active at a time.
            </p>
            {loadingEvents ? (
              <div className="text-center py-4 text-gray-500">Loading events...</div>
            ) : events.length === 0 ? (
              <div className="text-center py-6 text-gray-500">
                <p className="mb-3">No events found. Create an event first.</p>
                <button 
                  className="btn-primary"
                  onClick={() => window.location.href = '/events'}
                >
                  Create Event
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {events.filter(e => e.status === 'active' || e.isPhase2Active).map((event) => (
                  <div key={event._id} className={`p-4 rounded border ${event.isPhase2Active ? 'bg-green-50 border-green-300' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-bold">{event.name}</h3>
                        <p className="text-sm text-gray-600">
                          {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
                        </p>
                        <div className="mt-2">
                          <span className={`text-xs px-2 py-1 rounded ${event.isPhase2Active ? 'bg-green-600 text-white' : 'bg-gray-300 text-gray-700'}`}>
                            {event.isPhase2Active ? '✓ Phase 2 Active' : 'Phase 2 Inactive'}
                          </span>
                        </div>
                      </div>
                      <label className="flex items-center cursor-pointer">
                        <div className="relative">
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={event.isPhase2Active}
                            onChange={() => togglePhase2(event._id, event.isPhase2Active)}
                          />
                          <div className={`block w-14 h-8 rounded-full transition ${event.isPhase2Active ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                          <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform ${event.isPhase2Active ? 'translate-x-6' : ''}`}></div>
                        </div>
                      </label>
                    </div>
                  </div>
                ))}
                {events.filter(e => e.status !== 'active' && !e.isPhase2Active).length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-800">
                      Show {events.filter(e => e.status !== 'active' && !e.isPhase2Active).length} inactive events
                    </summary>
                    <div className="space-y-2 mt-2">
                      {events.filter(e => e.status !== 'active' && !e.isPhase2Active).map((event) => (
                        <div key={event._id} className="p-3 bg-gray-50 rounded border text-sm">
                          <div className="font-medium">{event.name}</div>
                          <div className="text-xs text-gray-500">Status: {event.status}</div>
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            )}
            <button 
              className="w-full mt-4 px-4 py-2 border rounded hover:bg-gray-50 font-medium"
              onClick={() => window.location.href = '/events'}
            >
              📋 Manage All Events
            </button>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-bold mb-4">⚙️ System Controls</h2>
            <p className="text-sm text-gray-600 mb-4">
              System-wide controls and danger zone actions.
            </p>
            <div className="space-y-3">
              <button className="w-full px-4 py-2 border rounded hover:bg-gray-50" onClick={() => window.location.href = '/events'}>
                📅 View All Events
              </button>
              <button className="w-full px-4 py-2 border rounded hover:bg-gray-50 text-red-600 border-red-300 hover:bg-red-50">
                🗑️ Reset All Points (Danger)
              </button>
            </div>
          </div>
        </div>

        {/* Money Management */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-4">💰 Money & Token Management</h2>
          <p className="text-sm text-gray-600 mb-4">
            Financial overview and token dispensing controls
          </p>
          <div className="space-y-3">
            <div className="p-4 bg-green-50 rounded border border-green-200">
              <div className="text-sm text-gray-600">Estimated Revenue</div>
              <div className="text-2xl font-bold text-green-600">
                ₹{((stats.totalTokensIssued / tokenConfig.amountToTokenRatio) || 0).toFixed(2)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Based on {stats.totalTokensIssued} tokens issued
              </div>
            </div>
            <button className="w-full px-4 py-3 bg-blue-600 text-white rounded hover:bg-blue-700 font-medium" onClick={() => window.location.href = '/token-recharge'}>
              💳 Dispense Tokens (Recharge)
            </button>
            <button className="w-full px-4 py-3 border border-gray-300 rounded hover:bg-gray-50 font-medium" onClick={() => window.location.href = '/stall-audit'}>
              📊 View Token Transactions
            </button>
          </div>
        </div>

        {/* Data Export */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-4">📤 Data Export</h2>
          <p className="text-sm text-gray-600 mb-4">
            Export system data for backup or analysis.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <button className="px-4 py-2 border rounded hover:bg-gray-50">
              Export Users CSV
            </button>
            <button className="px-4 py-2 border rounded hover:bg-gray-50">
              Export Points CSV
            </button>
            <button className="px-4 py-2 border rounded hover:bg-gray-50">
              Export Families CSV
            </button>
            <button className="px-4 py-2 border rounded hover:bg-gray-50">
              Export Tokens CSV
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EventSettings;
