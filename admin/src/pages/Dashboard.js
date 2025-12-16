import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
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
                const leaderboardData = await adminService.getLeaderboard(10);
                setLeaderboard(leaderboardData.data.leaderboard);
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
    return (_jsx(Layout, { children: _jsxs("div", { className: "space-y-6", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-4 gap-4", children: [_jsx(StatCard, { label: "Total Users", value: "Loading...", icon: "\uD83D\uDC65" }), _jsx(StatCard, { label: "Total Families", value: "Loading...", icon: "\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67" }), _jsx(StatCard, { label: "Total Points Awarded", value: "Loading...", icon: "\u2B50" }), _jsx(StatCard, { label: "Phase 2 Status", value: stats.phase2Active ? 'Active' : 'Inactive', icon: "\uD83D\uDE80" })] }), _jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "Top 10 Leaderboard" }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "w-full", children: [_jsx("thead", { children: _jsxs("tr", { className: "border-b", children: [_jsx("th", { className: "text-left py-2", children: "Rank" }), _jsx("th", { className: "text-left py-2", children: "Name" }), _jsx("th", { className: "text-right py-2", children: "Points" })] }) }), _jsx("tbody", { children: leaderboard.slice(0, 10).map((entry) => (_jsxs("tr", { className: "border-b hover:bg-gray-50", children: [_jsxs("td", { className: "py-2", children: ["#", entry.rank] }), _jsx("td", { className: "py-2", children: entry.userName }), _jsx("td", { className: "text-right font-bold", children: entry.totalPoints })] }, entry.userId))) })] }) })] }), chartData.length > 0 && (_jsxs("div", { className: "bg-white p-6 rounded-lg shadow", children: [_jsx("h2", { className: "text-xl font-bold mb-4", children: "Top 5 Points Distribution" }), _jsx(ResponsiveContainer, { width: "100%", height: 300, children: _jsxs(BarChart, { data: chartData, children: [_jsx(CartesianGrid, { strokeDasharray: "3 3" }), _jsx(XAxis, { dataKey: "name" }), _jsx(YAxis, {}), _jsx(Tooltip, {}), _jsx(Bar, { dataKey: "points", fill: "#667eea" })] }) })] }))] }) }));
};
const StatCard = ({ label, value, icon }) => (_jsx("div", { className: "dashboard-card p-6", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [_jsx("p", { className: "text-gray-500 text-sm", children: label }), _jsx("p", { className: "text-3xl font-bold mt-2", children: value })] }), _jsx("div", { className: "text-4xl", children: icon })] }) }));
export default Dashboard;
