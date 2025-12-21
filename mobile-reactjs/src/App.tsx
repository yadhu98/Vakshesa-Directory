
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';

import LoginScreen from './screens/LoginScreen';
import DirectoryScreen from './screens/DirectoryScreen';
import EditProfileScreen from './screens/EditProfileScreen';
import RegisterScreen from './screens/RegisterScreen';
import FooterNav from './components/FooterNav';
import { useLocation } from 'react-router-dom';


const AppRoutes: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const showFooter = !['/', '/register'].includes(location.pathname);
  
  return (
    <>
      <Routes>
        <Route path="/" element={<LoginScreen onLoginSuccess={() => navigate('/directory')} />} />
        <Route path="/register" element={<RegisterScreen onRegisterSuccess={() => navigate('/directory')} />} />
        <Route path="/directory" element={<DirectoryScreen />} />
        <Route path="/edit-profile" element={<EditProfileScreen />} />
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
