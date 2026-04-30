import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, Users, DollarSign, TrendingUp,
  Package, Truck, ArrowRight, Clock
} from 'lucide-react';
import { dashboardApi, ordersApi } from '../services/api';
import Card from '../components/ui/Card';
import StatusBadge from '../components/ui/StatusBadge';
import Skeleton from '../components/ui/Skeleton';

function StatCard({ icon: Icon, label, value, trend, color, onClick }) {
  const colorMap = {
    blue: 'bg-primary-50 text-primary-600',
    green: 'bg-success-50 text-success-600',
    orange: 'bg-warning-50 text-warning-600',
    purple: 'bg-purple-50 text-purple-600',
  };

  return (
    <Card onClick={onClick} className="flex items-start gap-3">
      <div className={`p-2.5 rounded-xl ${colorMap[color] || colorMap.blue}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-text-secondary">{label}</p>
        <p className="text-xl font-bold text-text-primary mt-0.5">{value ?? '—'}</p>
        {trend && (
          <p className="text-xs text-success-600 flex items-center gap-0.5 mt-0.5">
            <TrendingUp className="w-3 h-3" /> {trend}
          </p>
        )}
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const [summary, setSummary] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      dashboardApi.getSummary().catch(() => ({ data: null })),
      ordersApi.getAll({ limit: 5 }).catch(() => ({ data: { data: [] } })),
    ]).then(([summaryRes, ordersRes]) => {
      const s = summaryRes.data?.data || summaryRes.data;
      setSummary(s);
      const orders = ordersRes.data?.data || ordersRes.data || [];
      setRecentOrders(Array.isArray(orders) ? orders : []);
    }).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-6 w-32" />
        <div className="grid grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-6 w-28 mt-4" />
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-20 rounded-2xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4 space-y-5">
      {/* Greeting */}
      <div>
        <h1 className="text-xl font-bold">Overview</h1>
        <p className="text-sm text-text-secondary">Your business at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          icon={ShoppingCart}
          label="Total Orders"
          value={summary?.total_orders ?? 0}
          color="blue"
          onClick={() => navigate('/orders')}
        />
        <StatCard
          icon={Users}
          label="Customers"
          value={summary?.total_customers ?? 0}
          color="purple"
          onClick={() => navigate('/customers')}
        />
        <StatCard
          icon={DollarSign}
          label="Revenue"
          value={summary?.total_revenue ? `$${Number(summary.total_revenue).toLocaleString()}` : '$0'}
          color="green"
        />
        <StatCard
          icon={Truck}
          label="Deliveries"
          value={summary?.total_deliveries ?? summary?.pending_deliveries ?? 0}
          color="orange"
        />
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 overflow-x-auto hide-scrollbar -mx-4 px-4">
        {[
          { label: 'New Order', icon: ShoppingCart, to: '/orders/create' },
          { label: 'Products', icon: Package, to: '/catalogs' },
          { label: 'Customers', icon: Users, to: '/customers' },
        ].map(({ label, icon: Icon, to }) => (
          <button
            key={to}
            onClick={() => navigate(to)}
            className="flex items-center gap-2 px-4 py-2.5 bg-surface border border-border rounded-xl text-sm font-medium whitespace-nowrap
              active:scale-[0.97] transition-transform hover:border-primary-200"
          >
            <Icon className="w-4 h-4 text-primary-600" />
            {label}
          </button>
        ))}
      </div>

      {/* Recent Orders */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold">Recent Orders</h2>
          <button
            onClick={() => navigate('/orders')}
            className="text-xs text-primary-600 font-medium flex items-center gap-0.5"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {recentOrders.length === 0 ? (
            <Card className="text-center py-8">
              <p className="text-sm text-text-secondary">No orders yet</p>
            </Card>
          ) : (
            recentOrders.map((order) => (
              <Card
                key={order.id}
                onClick={() => navigate(`/orders/${order.id}`)}
                className="space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">#{order.id}</span>
                  <StatusBadge status={order.status_name || order.status} />
                </div>
                <p className="text-sm text-text-secondary truncate">
                  {order.customer_name || `Customer #${order.customer_id}`}
                </p>
                <div className="flex items-center justify-between text-xs text-text-tertiary">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}
                  </span>
                  <span className="font-medium text-text-primary">
                    ${Number(order.total_amount || 0).toLocaleString()}
                  </span>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
