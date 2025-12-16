import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, TrendingUp, Users, Coins, DollarSign } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import api from '../services/api';

interface OverviewData {
  totalParticipants: number;
  totalTransactions: number;
  completedTransactions: number;
  totalTokensExchanged: number;
  totalTokensRecharged: number;
  netTokenFlow: number;
}

interface StallRevenue {
  stallId: string;
  stallName: string;
  category: string;
  totalRevenue: number;
  participantCount: number;
  completedCount: number;
  averageTokensPerParticipant: number;
}

interface UserTransaction {
  userId: string;
  userName: string;
  userEmail: string;
  totalSpent: number;
  transactionCount: number;
}

interface Recharge {
  _id: string;
  userId: string;
  userName: string;
  userEmail: string;
  amount: number;
  adminName: string;
  adminEmail: string;
  createdAt: string;
}

const CarnivalAnalytics: React.FC = () => {
  const navigate = useNavigate();
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [stalls, setStalls] = useState<StallRevenue[]>([]);
  const [userTransactions, setUserTransactions] = useState<UserTransaction[]>([]);
  const [recharges, setRecharges] = useState<Recharge[]>([]);
  const [rechargesSummary, setRechargesSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'stalls' | 'users' | 'recharges'>('overview');

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    setLoading(true);
    try {
      const [overviewRes, stallsRes, usersRes, rechargesRes] = await Promise.all([
        api.get('/analytics/carnival/overview'),
        api.get('/analytics/carnival/stalls/gross'),
        api.get('/analytics/carnival/transactions/by-user'),
        api.get('/analytics/carnival/recharges'),
      ]);

      setOverview(overviewRes.data.overview);
      setStalls(stallsRes.data.stalls || []);
      setUserTransactions(usersRes.data.users || []);
      setRecharges(rechargesRes.data.recharges || []);
      setRechargesSummary(rechargesRes.data.summary);
      
      toast.success('Analytics data loaded successfully');
    } catch (error: any) {
      console.error('Load analytics error:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <Toaster position="top-right" />
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            title="Go back"
          >
            <ArrowLeft size={24} className="text-gray-700" />
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Carnival Analytics</h1>
        </div>
        <button
          onClick={loadAnalytics}
          className="px-5 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors font-medium min-w-[140px] flex items-center gap-2"
        >
          <RefreshCw size={18} />
          Refresh Data
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 mb-6 border-b">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-5 py-3 font-medium transition-colors min-w-[120px] ${
            activeTab === 'overview'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('stalls')}
          className={`px-5 py-3 font-medium transition-colors min-w-[120px] ${
            activeTab === 'stalls'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          Stall Revenue
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`px-5 py-3 font-medium transition-colors min-w-[120px] ${
            activeTab === 'users'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          User Spending
        </button>
        <button
          onClick={() => setActiveTab('recharges')}
          className={`px-5 py-3 font-medium transition-colors min-w-[140px] ${
            activeTab === 'recharges'
              ? 'border-b-2 border-blue-500 text-blue-600'
              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
          }`}
        >
          Token Recharges
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && overview && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <div className="text-blue-600 text-sm font-medium mb-2">Total Participants</div>
              <div className="text-3xl font-bold text-blue-900">{overview.totalParticipants}</div>
            </div>
            <div className="bg-green-50 p-6 rounded-lg border border-green-200">
              <div className="text-green-600 text-sm font-medium mb-2">Total Transactions</div>
              <div className="text-3xl font-bold text-green-900">{overview.totalTransactions}</div>
              <div className="text-sm text-green-600 mt-1">
                {overview.completedTransactions} completed
              </div>
            </div>
            <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
              <div className="text-purple-600 text-sm font-medium mb-2">Tokens Exchanged</div>
              <div className="text-3xl font-bold text-purple-900">🪙 {overview.totalTokensExchanged}</div>
            </div>
            <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
              <div className="text-yellow-600 text-sm font-medium mb-2">Tokens Recharged</div>
              <div className="text-3xl font-bold text-yellow-900">🪙 {overview.totalTokensRecharged}</div>
            </div>
            <div className="bg-indigo-50 p-6 rounded-lg border border-indigo-200">
              <div className="text-indigo-600 text-sm font-medium mb-2">Net Token Flow</div>
              <div className="text-3xl font-bold text-indigo-900">
                🪙 {overview.netTokenFlow}
              </div>
              <div className="text-sm text-indigo-600 mt-1">
                {overview.netTokenFlow > 0 ? 'Surplus' : 'Deficit'}
              </div>
            </div>
            <div className="bg-pink-50 p-6 rounded-lg border border-pink-200">
              <div className="text-pink-600 text-sm font-medium mb-2">Average per Transaction</div>
              <div className="text-3xl font-bold text-pink-900">
                🪙 {overview.totalTransactions > 0 ? Math.round(overview.totalTokensExchanged / overview.totalTransactions) : 0}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stalls Tab */}
      {activeTab === 'stalls' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stall Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participants
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Tokens
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stalls.map((stall, index) => (
                  <tr key={stall.stallId} className={index === 0 ? 'bg-yellow-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {index === 0 && '🥇'} {index === 1 && '🥈'} {index === 2 && '🥉'} #{index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{stall.stallName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {stall.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-green-600">🪙 {stall.totalRevenue}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {stall.participantCount} ({stall.completedCount} completed)
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        🪙 {Math.round(stall.averageTokensPerParticipant)}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total Spent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transactions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {userTransactions.map((user, index) => (
                  <tr key={user.userId} className={index === 0 ? 'bg-purple-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {index === 0 && '🥇'} {index === 1 && '🥈'} {index === 2 && '🥉'} #{index + 1}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{user.userName}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{user.userEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-red-600">🪙 {user.totalSpent}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.transactionCount}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Recharges Tab */}
      {activeTab === 'recharges' && (
        <div className="space-y-4">
          {rechargesSummary && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 p-6 rounded-lg border border-green-200">
                <div className="text-green-600 text-sm font-medium mb-2">Total Recharged</div>
                <div className="text-3xl font-bold text-green-900">🪙 {rechargesSummary.totalRecharged}</div>
              </div>
              <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
                <div className="text-blue-600 text-sm font-medium mb-2">Total Recharges</div>
                <div className="text-3xl font-bold text-blue-900">{rechargesSummary.totalRechargeCount}</div>
              </div>
              <div className="bg-purple-50 p-6 rounded-lg border border-purple-200">
                <div className="text-purple-600 text-sm font-medium mb-2">Average Recharge</div>
                <div className="text-3xl font-bold text-purple-900">
                  🪙 {Math.round(rechargesSummary.averageRechargeAmount)}
                </div>
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Admin
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {recharges.map((recharge) => (
                  <tr key={recharge._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {new Date(recharge.createdAt).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{recharge.userName}</div>
                      <div className="text-sm text-gray-500">{recharge.userEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-green-600">🪙 {recharge.amount}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{recharge.adminName}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CarnivalAnalytics;
