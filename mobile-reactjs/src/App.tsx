
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import LoginScreen from './screens/LoginScreen';
import DirectoryScreen from './screens/DirectoryScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import RegisterScreen from './screens/RegisterScreen';
import ChangePasswordScreen from './screens/ChangePasswordScreen';
import EnhancedProfileScreen from './screens/EnhancedProfileScreen';
import FooterNav from './components/FooterNav';

// Protected Route Component
const ProtectedRoute: React.FC<{ children: React.ReactElement }> = ({ children }) => {
  const token = localStorage.getItem('authToken');
  const userData = localStorage.getItem('userData');
  
  if (!token || !userData) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

// Routes Component
const AppRoutes: React.FC = () => {
  const location = useLocation();
  const showFooter = !['/', '/register'].includes(location.pathname);
  
  return (
    <>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LoginScreen />} />
        <Route path="/register" element={<RegisterScreen />} />
        
        {/* Protected Routes */}
        <Route 
          path="/directory" 
          element={
            <ProtectedRoute>
              <DirectoryScreen />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/edit-profile" 
          element={
            <ProtectedRoute>
              <EditProfileScreen />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/change-password" 
          element={
            <ProtectedRoute>
              <ChangePasswordScreen />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/profile/:userId" 
          element={
            <ProtectedRoute>
              <EnhancedProfileScreen />
            </ProtectedRoute>
          } 
        />
        
        {/* 404 Fallback - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      {showFooter && <FooterNav />}
    </>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
};

export default App;
