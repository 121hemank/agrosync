import { useState, useEffect, useCallback } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import {
  LayoutDashboard, Sprout, CloudSun, ShoppingBag, Package,
  BarChart3, Bell, FileText, User, LogOut, Menu, X,
  ChevronDown, Settings, ClipboardList, TrendingUp,
  DollarSign, TrendingDown, ShieldCheck
} from 'lucide-react';
import { RootState } from '../store';
import { logout } from '../store/slices/authSlice';
import { auth, notifications } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

const farmerLinks = [
  { to: '/farmer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/farmer/farms', icon: Sprout, label: 'Farms' },
  { to: '/farmer/weather', icon: CloudSun, label: 'Weather' },
  { to: '/farmer/crop-planner', icon: ClipboardList, label: 'Crop Planner' },
  { to: '/farmer/expenses', icon: DollarSign, label: 'Expenses' },
  { to: '/farmer/prices', icon: TrendingDown, label: 'Market Prices' },
  { to: '/farmer/marketplace', icon: ShoppingBag, label: 'Marketplace' },
  { to: '/farmer/orders', icon: Package, label: 'Orders' },
  { to: '/farmer/revenue', icon: TrendingUp, label: 'Revenue' },
  { to: '/farmer/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/reports', icon: FileText, label: 'Reports' }
];

const buyerLinks = [
  { to: '/buyer/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/buyer/marketplace', icon: ShoppingBag, label: 'Marketplace' },
  { to: '/buyer/orders', icon: Package, label: 'Orders' }
];

const adminLinks = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/admin/users', icon: User, label: 'Users' },
  { to: '/admin/products', icon: ShoppingBag, label: 'Products' },
  { to: '/admin/orders', icon: Package, label: 'Orders' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/reports', icon: FileText, label: 'Reports' }
];

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useSelector((s: RootState) => s.auth);

  useEffect(() => {
    if (!user) return;
    const token = localStorage.getItem('accessToken');
    if (!token) return;

    const socket = connectSocket(token);

    socket.on('new-notification', () => {
      setUnreadCount(c => c + 1);
    });

    notifications.unreadCount().then(r => setUnreadCount(r.data.count)).catch(() => {});

    return () => { disconnectSocket(); };
  }, [user]);

  const links = user?.role === 'farmer' ? farmerLinks
    : user?.role === 'admin' ? adminLinks
    : buyerLinks;

  const handleLogout = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) await auth.logout(refreshToken).catch(() => {});
    dispatch(logout());
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-surface">
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform lg:translate-x-0 lg:static ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex items-center gap-2 px-6 h-16 border-b border-gray-200">
          <Sprout className="w-7 h-7 text-primary" />
          <span className="font-heading font-bold text-xl text-primary">AgroSync</span>
        </div>
        <nav className="p-4 space-y-1 overflow-y-auto h-[calc(100vh-64px)]">
          {links.map((link) => {
            const active = location.pathname === link.to;
            return (
              <Link key={link.to} to={link.to}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  active ? 'bg-primary text-white' : 'text-gray-600 hover:bg-gray-100'
                }`}
                onClick={() => setSidebarOpen(false)}>
                <link.icon className="w-5 h-5" />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 lg:px-6">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 ml-auto">
            <button onClick={() => { navigate('/notifications'); setUnreadCount(0); }} className="relative p-2 hover:bg-gray-100 rounded-lg">
              <Bell className="w-5 h-5 text-gray-600" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-danger text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>
            <div className="relative">
              <button onClick={() => setProfileOpen(!profileOpen)} className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white text-sm font-medium">
                  {user?.name?.charAt(0) || 'U'}
                </div>
                <span className="text-sm font-medium text-gray-700 hidden sm:block">{user?.name}</span>
                <ChevronDown className="w-4 h-4 text-gray-500" />
              </button>
              {profileOpen && (
                <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                  <button onClick={() => { navigate('/settings'); setProfileOpen(false); }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full">
                    <Settings className="w-4 h-4" /> Settings
                  </button>
                  <button onClick={() => { navigate('/profile'); setProfileOpen(false); }}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full">
                    <User className="w-4 h-4" /> Profile
                  </button>
                  <hr className="my-1" />
                  <button onClick={handleLogout}
                    className="flex items-center gap-2 px-4 py-2 text-sm text-danger hover:bg-gray-100 w-full">
                    <LogOut className="w-4 h-4" /> Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>

      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} className="fixed inset-0 bg-black/30 z-40 lg:hidden" />}
    </div>
  );
}
