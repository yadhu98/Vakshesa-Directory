import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '@utils/hooks';
import Login from '@pages/Login';
import Dashboard from '@pages/Dashboard';
import RegisterUser from '@pages/RegisterUser';
import Register from '@pages/Register';
import Users from '@pages/Users';
import Families from '@pages/Families';
import Stalls from '@pages/Stalls';
import Leaderboard from '@pages/Leaderboard';
import EventSettings from '@pages/EventSettings';
import Events from '@pages/Events';
import CarnivalEvents from '@pages/CarnivalEvents';
import ChangePassword from '@pages/ChangePassword';
import TokenRecharge from '@pages/TokenRecharge';
import StallAudit from '@pages/StallAudit';
import CarnivalAnalytics from '@pages/CarnivalAnalytics';

const ProtectedRoute: React.FC<{ element: JSX.Element }> = ({ element }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? element : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<ProtectedRoute element={<Dashboard />} />} />
        <Route path="/register-user" element={<ProtectedRoute element={<RegisterUser />} />} />
        <Route path="/users" element={<ProtectedRoute element={<Users />} />} />
        <Route path="/families" element={<ProtectedRoute element={<Families />} />} />
        <Route path="/stalls" element={<ProtectedRoute element={<Stalls />} />} />
        <Route path="/leaderboard" element={<ProtectedRoute element={<Leaderboard />} />} />
        <Route path="/events" element={<ProtectedRoute element={<Events />} />} />
        <Route path="/carnival-events" element={<ProtectedRoute element={<CarnivalEvents />} />} />
        <Route path="/carnival-analytics" element={<ProtectedRoute element={<CarnivalAnalytics />} />} />
        <Route path="/token-recharge" element={<ProtectedRoute element={<TokenRecharge />} />} />
        <Route path="/stall-audit" element={<ProtectedRoute element={<StallAudit />} />} />
        <Route path="/settings" element={<ProtectedRoute element={<EventSettings />} />} />
        <Route path="/change-password" element={<ProtectedRoute element={<ChangePassword />} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;
