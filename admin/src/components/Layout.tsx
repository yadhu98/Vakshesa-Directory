import React, { ReactNode } from 'react';
import { useAuth } from '@utils/hooks';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, 
  Menu, 
  LayoutDashboard, 
  Users, 
  UserPlus, 
  Home, 
  ShoppingCart, 
  Trophy, 
  Calendar, 
  Tent, 
  TrendingUp, 
  DollarSign, 
  FileText, 
  Settings, 
  Lock 
} from 'lucide-react';

export const Layout: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(true);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-20'} sidebar transition-all duration-300 text-white`}>
        <div className="p-4">
          <h1 className={`font-bold text-xl ${!isSidebarOpen && 'text-center'}`}>Vakshesa</h1>
        </div>

        <nav className="mt-8">
          <NavItem
            label="Dashboard"
            icon={<LayoutDashboard size={20} />}
            onClick={() => navigate('/dashboard')}
            collapsed={!isSidebarOpen}
          />
          <NavItem
            label="Users"
            icon={<Users size={20} />}
            onClick={() => navigate('/users')}
            collapsed={!isSidebarOpen}
          />
          <NavItem
            label="Register User"
            icon={<UserPlus size={20} />}
            onClick={() => navigate('/register-user')}
            collapsed={!isSidebarOpen}
          />
          <NavItem
            label="Families"
            icon={<Home size={20} />}
            onClick={() => navigate('/families')}
            collapsed={!isSidebarOpen}
          />
          <NavItem
            label="Stalls"
            icon={<ShoppingCart size={20} />}
            onClick={() => navigate('/stalls')}
            collapsed={!isSidebarOpen}
          />
          <NavItem
            label="Leaderboard"
            icon={<Trophy size={20} />}
            onClick={() => navigate('/leaderboard')}
            collapsed={!isSidebarOpen}
          />
          <NavItem
            label="Events"
            icon={<Calendar size={20} />}
            onClick={() => navigate('/events')}
            collapsed={!isSidebarOpen}
          />
          <NavItem
            label="Carnival Events"
            icon={<Tent size={20} />}
            onClick={() => navigate('/carnival-events')}
            collapsed={!isSidebarOpen}
          />
          <NavItem
            label="Carnival Analytics"
            icon={<TrendingUp size={20} />}
            onClick={() => navigate('/carnival-analytics')}
            collapsed={!isSidebarOpen}
          />
          <NavItem
            label="Token Recharge"
            icon={<DollarSign size={20} />}
            onClick={() => navigate('/token-recharge')}
            collapsed={!isSidebarOpen}
          />
          <NavItem
            label="Stall Audit"
            icon={<FileText size={20} />}
            onClick={() => navigate('/stall-audit')}
            collapsed={!isSidebarOpen}
          />
          <NavItem
            label="Event Settings"
            icon={<Settings size={20} />}
            onClick={() => navigate('/settings')}
            collapsed={!isSidebarOpen}
          />
          <NavItem
            label="Change Password"
            icon={<Lock size={20} />}
            onClick={() => navigate('/change-password')}
            collapsed={!isSidebarOpen}
          />
        </nav>

        <div className="absolute bottom-4 left-4 right-4">
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to logout?')) {
                logout();
              }
            }}
            className={`flex items-center gap-2 bg-white/20 hover:bg-white/30 p-3 rounded-lg transition-colors w-full ${
              !isSidebarOpen ? 'justify-center' : ''
            }`}
          >
            <LogOut size={20} />
            {isSidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between p-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-700 hover:text-gray-900"
            >
              <Menu size={24} />
            </button>
            <div className="text-gray-700">
              <span>Admin Panel</span>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

interface NavItemProps {
  label: string;
  icon: ReactNode;
  onClick: () => void;
  collapsed: boolean;
}

const NavItem: React.FC<NavItemProps> = ({ label, icon, onClick, collapsed }) => (
  <button
    onClick={onClick}
    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
  >
    {icon}
    {!collapsed && <span>{label}</span>}
  </button>
);
