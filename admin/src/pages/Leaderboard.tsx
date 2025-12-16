import React, { useState, useEffect } from 'react';
import { Layout } from '@components/Layout';
import { adminService } from '@services/api';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { ButtonLoader } from '@components/Loader';

interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  familyName?: string;
  totalPoints: number;
}

const Leaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [limit, setLimit] = useState(50);
  const [showClearModal, setShowClearModal] = useState(false);
  const [confirmCode, setConfirmCode] = useState('');
  const [clearLoading, setClearLoading] = useState(false);

  useEffect(() => {
    loadLeaderboard();
  }, [limit]);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const res = await adminService.getLeaderboard(limit);
      setLeaderboard(res.data.leaderboard || []);
    } catch (error) {
      console.error('Failed to load leaderboard:', error);
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ['Rank', 'Name', 'Family', 'Points'];
    const rows = leaderboard.map(entry => [
      entry.rank,
      entry.userName,
      entry.familyName || 'N/A',
      entry.totalPoints
    ]);
    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `leaderboard-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleClearLeaderboard = async () => {
    
    if (confirmCode !== 'CLEAR_LEADERBOARD') {
      toast.error('Invalid confirmation code');
      return;
    }
    
    setClearLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      
      const response = await fetch('http://localhost:5000/api/bulk/clear-leaderboard', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ confirmCode: 'CLEAR_LEADERBOARD' }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Server error: ${response.status}`);
      }

      toast.success(data.message || 'Leaderboard cleared successfully');
      setShowClearModal(false);
      setConfirmCode('');
      // Wait a moment then reload
      setTimeout(() => {
        loadLeaderboard();
      }, 500);
    } catch (error: any) {
      const errorMessage = error.message || 'Failed to clear leaderboard';
      toast.error(errorMessage);
    } finally {
      setClearLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">🏆 Leaderboard</h1>
          <div className="flex gap-2">
            <select className="input" value={limit} onChange={(e) => setLimit(Number(e.target.value))}>
              <option value={10}>Top 10</option>
              <option value={25}>Top 25</option>
              <option value={50}>Top 50</option>
              <option value={100}>Top 100</option>
            </select>
            <button className="btn-primary" onClick={exportCSV}>
              Export CSV
            </button>
            <button 
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-2"
              onClick={() => setShowClearModal(true)}
            >
              <Trash2 size={18} />
              Clear Leaderboard
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">Loading leaderboard...</div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-4 px-4 font-bold">Rank</th>
                  <th className="text-left py-4 px-4 font-bold">Name</th>
                  <th className="text-left py-4 px-4 font-bold">Family</th>
                  <th className="text-right py-4 px-4 font-bold">Points</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, idx) => (
                  <tr key={entry.userId} className={`border-b hover:bg-gray-50 ${
                    idx === 0 ? 'bg-yellow-50' : idx === 1 ? 'bg-gray-100' : idx === 2 ? 'bg-orange-50' : ''
                  }`}>
                    <td className="py-4 px-4">
                      <span className={`font-bold text-lg ${
                        idx === 0 ? 'text-yellow-600' : idx === 1 ? 'text-gray-600' : idx === 2 ? 'text-orange-600' : ''
                      }`}>
                        #{entry.rank}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-medium">{entry.userName}</td>
                    <td className="py-4 px-4 text-gray-600">{entry.familyName || 'N/A'}</td>
                    <td className="py-4 px-4 text-right font-bold text-lg">{entry.totalPoints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Clear Leaderboard Modal */}
        {showClearModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-xl font-bold mb-4 text-red-600">⚠️ Clear Leaderboard</h3>
              <div className="mb-4">
                <p className="text-gray-700 mb-4">
                  This will <strong>permanently delete all points</strong> from the leaderboard. 
                  This action cannot be undone!
                </p>
                <p className="text-gray-600 mb-4">
                  Type <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">CLEAR_LEADERBOARD</code> to confirm:
                </p>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:border-black"
                  placeholder="Type confirmation code"
                  value={confirmCode}
                  onChange={(e) => setConfirmCode(e.target.value)}
                  disabled={clearLoading}
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-2">
                  Code match: {confirmCode === 'CLEAR_LEADERBOARD' ? '✓' : '✗'}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                  onClick={() => {
                    setShowClearModal(false);
                    setConfirmCode('');
                  }}
                  disabled={clearLoading}
                >
                  Cancel
                </button>
                <button
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
                  onClick={() => {
                    console.log('Clear Leaderboard button clicked');
                    handleClearLeaderboard();
                  }}
                  disabled={clearLoading || confirmCode !== 'CLEAR_LEADERBOARD'}
                >
                  {clearLoading ? (
                    <>
                      <ButtonLoader />
                      Clearing...
                    </>
                  ) : (
                    'Clear Leaderboard'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Leaderboard;
