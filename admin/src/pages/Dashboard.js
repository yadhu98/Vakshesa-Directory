import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Users, Home, Star, Rocket } from 'lucide-react';
import { adminService } from '@services/api';
import { Layout } from '@components/Layout';
const Dashboard = () => {
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalFamilies: 0,
        totalPoints: 0,
        phase2Active: false,
    });
    const [leaderboard, setLeaderboard] = useState([]);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const loadData = async () => {
            try {
                // Load leaderboard
                const leaderboardData = await adminService.getLeaderboard(10);
                const leaderboardList = leaderboardData.data.leaderboard || [];
                setLeaderboard(leaderboardList);
                // Calculate total points from leaderboard
                const totalPoints = leaderboardList.reduce((sum, entry) => sum + (entry.totalPoints || 0), 0);
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
            }
            catch (error) {
                console.error('Failed to load dashboard data:', error);
                setLoading(false);
            }
        };
        loadData();
    }, []);
    if (loading) {
        return _jsx(Layout, { children: _jsx("div", { className: "text-center py-8", children: "Loading..." }) });
    }
    const chartData = leaderboard.slice(0, 5).map((entry) => ({
        name: entry.userName.split(' ')[0],
        points: entry.totalPoints,
    }));
    return (_jsx(Layout, { children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsx(StatCard, { label: "Total Users", value: stats.totalUsers, icon: _jsx(Users, { size: 32 }) }), _jsx(StatCard, { label: "Total Families", value: stats.totalFamilies, icon: _jsx(Home, { size: 32 }) }), _jsx(StatCard, { label: "Total Points Awarded", value: stats.totalPoints.toLocaleString(), icon: _jsx(Star, { size: 32 }) }), _jsx(StatCard, { label: "Phase 2 Status", value: stats.phase2Active ? 'Active' : 'Inactive', icon: _jsx(Rocket, { size: 32 }) })] }), _jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "Top 10 Leaderboard" }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b", children: [_jsx("th", { className: "text-left py-2", children: "Rank" }), _jsx("th", { className: "text-left py-2", children: "Name" }), _jsx("th", { className: "text-right py-2", children: "Points" })] }) }), _jsx("tbody", { children: leaderboard.slice(0, 10).map((entry) => (_jsxs("tr", { className: "border-b hover:bg-gray-50", children: [_jsxs("td", { className: "py-2", children: ["#", entry.rank] }), _jsx("td", { className: "py-2", children: entry.userName }), _jsx("td", { className: "text-right font-bold", children: entry.totalPoints })] }, entry.userId))) })] }) })] }), chartData.length > 0 && (_jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "Top 5 Points Distribution" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(BarChart, { data: chartData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "name" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Bar, { dataKey: "points", fill: "#000000" })] }) })] }))] }) }));
};
const StatCard = ({ label, value, icon }) => (_jsx("div", { className: "dashboard-card p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-500 text-sm", children: label }), _jsx("p", { className: "text-3xl font-bold mt-2", children: value })] }), _jsx("div", { className: "text-gray-900", children: icon })] }) }));
export default Dashboard;
