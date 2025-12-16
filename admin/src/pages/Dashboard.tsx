import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Users, Home, Star, Rocket } from 'lucide-react';
import { adminService } from '@services/api';
import { Layout } from '@components/Layout';

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalFamilies: 0,
    totalPoints: 0,
    phase2Active: false,
  });
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        // Load leaderboard
        const leaderboardData = await adminService.getLeaderboard(10);
        const leaderboardList = leaderboardData.data.leaderboard || [];
        setLeaderboard(leaderboardList);

        // Calculate total points from leaderboard
        const totalPoints = leaderboardList.reduce((sum: number, entry: any) => 
          sum + (entry.totalPoints || 0), 0
        );

        // Load users count
        const usersResponse = await adminService.getUsers();
        const totalUsers = usersResponse.data.count || usersResponse.data.users?.length || 0;

        // Load families count
        const familiesResponse = await adminService.getFamilies();
        const totalFamilies = familiesResponse.data?.length || 0;

        setStats({
          totalUsers,
          totalFamilies,
          totalPoints,
          phase2Active: false,
        });

        setLoading(false);
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return <Layout><div className="text-center py-8">Loading...</div></Layout>;
  }

  const chartData = leaderboard.slice(0, 5).map((entry) => ({
    name: entry.userName.split(' ')[0],
    points: entry.totalPoints,
  }));

  return (
    <Layout>
      <div className="space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard label="Total Users" value={stats.totalUsers} icon={<Users size={32} />} />
          <StatCard label="Total Families" value={stats.totalFamilies} icon={<Home size={32} />} />
          <StatCard label="Total Points Awarded" value={stats.totalPoints.toLocaleString()} icon={<Star size={32} />} />
          <StatCard label="Phase 2 Status" value={stats.phase2Active ? 'Active' : 'Inactive'} icon={<Rocket size={32} />} />
        </div>

        {/* Leaderboard Preview */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4">Top 10 Leaderboard</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Rank</th>
                  <th className="text-left py-2">Name</th>
                  <th className="text-right py-2">Points</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.slice(0, 10).map((entry) => (
                  <tr key={entry.userId} className="border-b hover:bg-gray-50">
                    <td className="py-2">#{entry.rank}</td>
                    <td className="py-2">{entry.userName}</td>
                    <td className="text-right font-bold">{entry.totalPoints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Chart */}
        {chartData.length > 0 && (
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4">Top 5 Points Distribution</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="points" fill="#000000" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </Layout>
  );
};

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ label, value, icon }) => (
  <div className="dashboard-card p-6">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm">{label}</p>
        <p className="text-3xl font-bold mt-2">{value}</p>
      </div>
      <div className="text-gray-900">{icon}</div>
    </div>
  </div>
);

export default Dashboard;
