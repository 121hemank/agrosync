import { Routes, Route, Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from './store';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Landing from './pages/Landing';
import FarmerDashboard from './pages/farmer/Dashboard';
import FarmManagement from './pages/farmer/FarmManagement';
import Weather from './pages/farmer/Weather';
import CropPlanner from './pages/farmer/CropPlanner';
import CropCalendar from './pages/farmer/CropCalendar';
import Expenses from './pages/farmer/Expenses';
import MarketPrices from './pages/farmer/MarketPrices';
import FarmerMarketplace from './pages/farmer/Marketplace';
import FarmerOrders from './pages/farmer/Orders';
import Revenue from './pages/farmer/Revenue';
import FarmerAnalytics from './pages/farmer/Analytics';
import BuyerDashboard from './pages/buyer/Dashboard';
import BuyerMarketplace from './pages/buyer/Marketplace';
import BuyerOrders from './pages/buyer/Orders';
import AdminDashboard from './pages/admin/Dashboard';
import AdminUsers from './pages/admin/Users';
import AdminProducts from './pages/admin/Products';
import AdminOrders from './pages/admin/Orders';
import AdminAnalytics from './pages/admin/Analytics';
import Reports from './pages/Reports';
import Notifications from './pages/Notifications';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import ForgotPassword from './pages/ForgotPassword';

function ProtectedRoute({ children, roles }: { children: JSX.Element; roles?: string[] }) {
  const { user } = useSelector((s: RootState) => s.auth);
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to={`/${user.role}/dashboard`} />;
  return children;
}

export default function App() {
  const { user } = useSelector((s: RootState) => s.auth);

  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to={`/${user.role}/dashboard`} /> : <Landing />} />
      <Route path="/login" element={user ? <Navigate to={`/${user.role}/dashboard`} /> : <Login />} />
      <Route path="/register" element={user ? <Navigate to={`/${user.role}/dashboard`} /> : <Register />} />
      <Route path="/forgot-password" element={user ? <Navigate to={`/${user.role}/dashboard`} /> : <ForgotPassword />} />

      <Route element={<Layout />}>
        <Route path="/farmer/dashboard" element={<ProtectedRoute roles={['farmer']}><FarmerDashboard /></ProtectedRoute>} />
        <Route path="/farmer/farms" element={<ProtectedRoute roles={['farmer']}><FarmManagement /></ProtectedRoute>} />
        <Route path="/farmer/weather" element={<ProtectedRoute roles={['farmer']}><Weather /></ProtectedRoute>} />
        <Route path="/farmer/crop-planner" element={<ProtectedRoute roles={['farmer']}><CropPlanner /></ProtectedRoute>} />
        <Route path="/farmer/calendar" element={<ProtectedRoute roles={['farmer']}><CropCalendar /></ProtectedRoute>} />
        <Route path="/farmer/expenses" element={<ProtectedRoute roles={['farmer']}><Expenses /></ProtectedRoute>} />
        <Route path="/farmer/prices" element={<ProtectedRoute roles={['farmer']}><MarketPrices /></ProtectedRoute>} />
        <Route path="/farmer/marketplace" element={<ProtectedRoute roles={['farmer']}><FarmerMarketplace /></ProtectedRoute>} />
        <Route path="/farmer/orders" element={<ProtectedRoute roles={['farmer']}><FarmerOrders /></ProtectedRoute>} />
        <Route path="/farmer/revenue" element={<ProtectedRoute roles={['farmer']}><Revenue /></ProtectedRoute>} />
        <Route path="/farmer/analytics" element={<ProtectedRoute roles={['farmer']}><FarmerAnalytics /></ProtectedRoute>} />

        <Route path="/buyer/dashboard" element={<ProtectedRoute roles={['buyer']}><BuyerDashboard /></ProtectedRoute>} />
        <Route path="/buyer/marketplace" element={<ProtectedRoute roles={['buyer']}><BuyerMarketplace /></ProtectedRoute>} />
        <Route path="/buyer/orders" element={<ProtectedRoute roles={['buyer']}><BuyerOrders /></ProtectedRoute>} />

        <Route path="/admin/dashboard" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />
        <Route path="/admin/users" element={<ProtectedRoute roles={['admin']}><AdminUsers /></ProtectedRoute>} />
        <Route path="/admin/products" element={<ProtectedRoute roles={['admin']}><AdminProducts /></ProtectedRoute>} />
        <Route path="/admin/orders" element={<ProtectedRoute roles={['admin']}><AdminOrders /></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute roles={['admin']}><AdminAnalytics /></ProtectedRoute>} />

        <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
}
