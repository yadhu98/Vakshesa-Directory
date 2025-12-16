import React, { useState, useEffect } from 'react';
import { Layout } from '@components/Layout';
import axiosInstance from '@services/api';

interface Transaction {
  _id: string;
  userId: string;
  stallId: string;
  type: 'recharge' | 'payment' | 'refund';
  amount: number;
  tokensUsed: number;
  status: string;
  description?: string;
  gameScore?: number;
  createdAt: string;
  completedAt?: string;
}

interface StallStats {
  stallId: string;
  totalVisits: number;
  totalTokensCollected: number;
  uniqueUsers: number;
  totalScore: number;
  averageScore: number;
}

const StallAudit: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stalls, setStalls] = useState<any[]>([]);
  const [selectedStall, setSelectedStall] = useState('');
  const [stallStats, setStallStats] = useState<StallStats | null>(null);
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
    } catch (error) {
      console.error('Failed to load stalls:', error);
    }
  };

  const loadTransactions = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (selectedStall) params.stallId = selectedStall;
      if (filterType !== 'all') params.type = filterType;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await axiosInstance.get('/tokens/transactions', { params });
      setTransactions(res.data.transactions || []);
    } catch (error) {
      console.error('Failed to load transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStallStats = async () => {
    try {
      const res = await axiosInstance.get(`/tokens/stall/${selectedStall}/stats`);
      setStallStats(res.data);
    } catch (error) {
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

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">📊 Stall Audit & Transactions</h1>
          <button className="btn-primary" onClick={exportCSV}>
            Export CSV
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-bold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Stall</label>
              <select className="input" value={selectedStall} onChange={(e) => setSelectedStall(e.target.value)}>
                <option value="">All Stalls</option>
                {stalls.map(s => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select className="input" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                <option value="all">All Types</option>
                <option value="recharge">Recharge</option>
                <option value="payment">Payment</option>
                <option value="refund">Refund</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select className="input" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="declined">Declined</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Start Date</label>
              <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">End Date</label>
              <input type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
            </div>
          </div>
          <button className="btn-primary mt-4" onClick={loadTransactions}>
            Apply Filters
          </button>
        </div>

        {/* Stall Statistics */}
        {stallStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600">Total Visits</div>
              <div className="text-3xl font-bold text-blue-600">{stallStats.totalVisits}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600">Tokens Collected</div>
              <div className="text-3xl font-bold text-green-600">{stallStats.totalTokensCollected}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600">Unique Users</div>
              <div className="text-3xl font-bold text-purple-600">{stallStats.uniqueUsers}</div>
            </div>
            <div className="bg-white p-6 rounded-lg shadow">
              <div className="text-sm text-gray-600">Avg Score</div>
              <div className="text-3xl font-bold text-orange-600">{stallStats.averageScore.toFixed(1)}</div>
            </div>
          </div>
        )}

        {/* Transactions Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loading ? (
            <div className="text-center py-8">Loading transactions...</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-bold">Date/Time</th>
                    <th className="text-left py-3 px-4 text-sm font-bold">Type</th>
                    <th className="text-left py-3 px-4 text-sm font-bold">User ID</th>
                    <th className="text-left py-3 px-4 text-sm font-bold">Stall</th>
                    <th className="text-right py-3 px-4 text-sm font-bold">Tokens</th>
                    <th className="text-left py-3 px-4 text-sm font-bold">Status</th>
                    <th className="text-right py-3 px-4 text-sm font-bold">Score</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(t => (
                    <tr key={t._id} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-sm">{new Date(t.createdAt).toLocaleString()}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          t.type === 'recharge' ? 'bg-green-100 text-green-800' :
                          t.type === 'payment' ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {t.type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm font-mono">{t.userId.slice(0, 8)}...</td>
                      <td className="py-3 px-4 text-sm">
                        {stalls.find(s => s._id === t.stallId)?.name || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-right font-medium">{t.tokensUsed}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-1 rounded text-xs ${
                          t.status === 'completed' ? 'bg-green-100 text-green-800' :
                          t.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold">{t.gameScore || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {transactions.length === 0 && (
                <div className="text-center py-12 text-gray-500">No transactions found</div>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default StallAudit;
