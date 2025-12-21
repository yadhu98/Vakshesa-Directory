import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
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
const ProtectedRoute = ({ element }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? element : _jsx(Navigate, { to: "/login" });
};
function App() {
    return (_jsx(Router, { children: _jsxs(Routes, { children: [_jsx(Route, { path: "/login", element: _jsx(Login, {}) }), _jsx(Route, { path: "/dashboard", element: _jsx(ProtectedRoute, { element: _jsx(Dashboard, {}) }) }), _jsx(Route, { path: "/register-user", element: _jsx(ProtectedRoute, { element: _jsx(RegisterUser, {}) }) }), _jsx(Route, { path: "/users", element: _jsx(ProtectedRoute, { element: _jsx(Users, {}) }) }), _jsx(Route, { path: "/families", element: _jsx(ProtectedRoute, { element: _jsx(Families, {}) }) }), _jsx(Route, { path: "/stalls", element: _jsx(ProtectedRoute, { element: _jsx(Stalls, {}) }) }), _jsx(Route, { path: "/leaderboard", element: _jsx(ProtectedRoute, { element: _jsx(Leaderboard, {}) }) }), _jsx(Route, { path: "/events", element: _jsx(ProtectedRoute, { element: _jsx(Events, {}) }) }), _jsx(Route, { path: "/carnival-events", element: _jsx(ProtectedRoute, { element: _jsx(CarnivalEvents, {}) }) }), _jsx(Route, { path: "/carnival-analytics", element: _jsx(ProtectedRoute, { element: _jsx(CarnivalAnalytics, {}) }) }), _jsx(Route, { path: "/token-recharge", element: _jsx(ProtectedRoute, { element: _jsx(TokenRecharge, {}) }) }), _jsx(Route, { path: "/stall-audit", element: _jsx(ProtectedRoute, { element: _jsx(StallAudit, {}) }) }), _jsx(Route, { path: "/settings", element: _jsx(ProtectedRoute, { element: _jsx(EventSettings, {}) }) }), _jsx(Route, { path: "/change-password", element: _jsx(ProtectedRoute, { element: _jsx(ChangePassword, {}) }) }), _jsx(Route, { path: "/register", element: _jsx(Register, {}) }), _jsx(Route, { path: "/", element: _jsx(Navigate, { to: "/login" }) })] }) }));
}
export default App;
