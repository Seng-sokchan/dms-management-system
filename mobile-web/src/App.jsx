import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import OrdersPage from './pages/OrdersPage';
import OrderDetailPage from './pages/OrderDetailPage';
import CreateOrderPage from './pages/CreateOrderPage';
import PaymentsPage from './pages/PaymentsPage';
import ProfilePage from './pages/ProfilePage';
import DeliveryPage from './pages/DeliveryPage';
import ConfirmOrderPage from './pages/ConfirmOrderPage';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-surface">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-text-secondary">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  return isAuthenticated ? <Navigate to="/" replace /> : children;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={
        <GuestRoute><LoginPage /></GuestRoute>
      } />

      {/* Protected - with layout (bottom nav) */}
      <Route element={
        <ProtectedRoute><AppLayout /></ProtectedRoute>
      }>
        <Route index element={<Navigate to="/customer-orders" replace />} />
        <Route path="customer-orders" element={<OrdersPage workflowMode="customer_orders" />} />
        <Route path="owner-preparing" element={<OrdersPage workflowMode="owner_preparing" />} />
        <Route path="logistics-supplier" element={<OrdersPage workflowMode="logistics_supplier" />} />
        <Route path="delivery" element={<DeliveryPage />} />
        <Route path="confirm-order" element={<ConfirmOrderPage />} />
        <Route path="orders" element={<OrdersPage workflowMode="all" />} />
        <Route path="payments" element={<PaymentsPage />} />
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      {/* Protected - full screen (no bottom nav) */}
      <Route path="/orders/create" element={
        <ProtectedRoute><CreateOrderPage /></ProtectedRoute>
      } />
      <Route path="/orders/:id" element={
        <ProtectedRoute><OrderDetailPage /></ProtectedRoute>
      } />

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/customer-orders" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </LanguageProvider>
  );
}
