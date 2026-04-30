import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Bell, ShoppingCart, Truck, DollarSign,
  CheckCircle2, AlertCircle, Package, Clock, Trash2
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';

// Mock notifications — replace with real API when backend supports it
const MOCK_NOTIFICATIONS = [
  {
    id: 1,
    type: 'order_new',
    title: 'New order received',
    body: 'Order #1024 from Sok Dara — $340.00',
    time: new Date(Date.now() - 5 * 60 * 1000),
    read: false,
    link: '/orders/1024',
  },
  {
    id: 2,
    type: 'delivery',
    title: 'Delivery completed',
    body: 'Order #1020 delivered to Chan Maly',
    time: new Date(Date.now() - 2 * 60 * 60 * 1000),
    read: false,
    link: '/orders/1020',
  },
  {
    id: 3,
    type: 'payment',
    title: 'Payment received',
    body: 'Received $520.00 via KHQR for Order #1023',
    time: new Date(Date.now() - 5 * 60 * 60 * 1000),
    read: true,
    link: '/payments',
  },
  {
    id: 4,
    type: 'order_status',
    title: 'Order status updated',
    body: 'Order #1019 is now out for delivery',
    time: new Date(Date.now() - 24 * 60 * 60 * 1000),
    read: true,
    link: '/orders/1019',
  },
  {
    id: 5,
    type: 'alert',
    title: 'Low stock alert',
    body: '3 items in "Beverages" catalog are running low',
    time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    read: true,
    link: '/catalogs',
  },
];

const TYPE_CONFIG = {
  order_new: { icon: ShoppingCart, bg: 'bg-primary-50', color: 'text-primary-600' },
  order_status: { icon: Package, bg: 'bg-blue-50', color: 'text-blue-600' },
  delivery: { icon: Truck, bg: 'bg-success-50', color: 'text-success-600' },
  payment: { icon: DollarSign, bg: 'bg-success-50', color: 'text-success-600' },
  alert: { icon: AlertCircle, bg: 'bg-warning-50', color: 'text-warning-600' },
};

function formatTimeAgo(date) {
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const unreadCount = useMemo(
    () => notifications.filter(n => !n.read).length,
    [notifications]
  );

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = (id) => {
    setNotifications(prev => prev.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const grouped = useMemo(() => {
    const today = [];
    const earlier = [];
    const now = new Date();
    notifications.forEach(n => {
      const diffHours = (now.getTime() - n.time.getTime()) / (1000 * 60 * 60);
      if (diffHours < 24) today.push(n);
      else earlier.push(n);
    });
    return { today, earlier };
  }, [notifications]);

  return (
    <div className="min-h-dvh bg-surface-secondary">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-xl hover:bg-surface-tertiary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold">Notifications</h1>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              className="text-xs text-primary-600 font-medium px-2 py-1 rounded-lg hover:bg-primary-50"
            >
              Mark all read
            </button>
          )}
        </div>
      </div>

      {notifications.length === 0 ? (
        <EmptyState
          icon={Bell}
          title="All caught up"
          description="No notifications to show"
        />
      ) : (
        <div className="pb-8">
          {/* Today */}
          {grouped.today.length > 0 && (
            <div>
              <div className="px-4 pt-4 pb-2">
                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Today</p>
              </div>
              <div className="space-y-1 px-4">
                {grouped.today.map(n => {
                  const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.alert;
                  const Icon = config.icon;
                  return (
                    <div
                      key={n.id}
                      onClick={() => {
                        markRead(n.id);
                        if (n.link) navigate(n.link);
                      }}
                      className={`flex items-start gap-3 p-3 rounded-xl transition-colors cursor-pointer
                        ${n.read ? 'bg-transparent hover:bg-surface-tertiary' : 'bg-primary-50/40 hover:bg-primary-50/60'}`}
                    >
                      <div className={`p-2 rounded-xl shrink-0 ${config.bg}`}>
                        <Icon className={`w-4.5 h-4.5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm truncate ${n.read ? 'font-medium' : 'font-semibold'}`}>
                            {n.title}
                          </p>
                          {!n.read && (
                            <span className="w-2 h-2 rounded-full bg-primary-600 shrink-0 mt-1.5" />
                          )}
                        </div>
                        <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{n.body}</p>
                        <p className="text-xs text-text-tertiary mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTimeAgo(n.time)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Earlier */}
          {grouped.earlier.length > 0 && (
            <div>
              <div className="px-4 pt-4 pb-2">
                <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">Earlier</p>
              </div>
              <div className="space-y-1 px-4">
                {grouped.earlier.map(n => {
                  const config = TYPE_CONFIG[n.type] || TYPE_CONFIG.alert;
                  const Icon = config.icon;
                  return (
                    <div
                      key={n.id}
                      onClick={() => {
                        markRead(n.id);
                        if (n.link) navigate(n.link);
                      }}
                      className="flex items-start gap-3 p-3 rounded-xl hover:bg-surface-tertiary transition-colors cursor-pointer"
                    >
                      <div className={`p-2 rounded-xl shrink-0 ${config.bg}`}>
                        <Icon className={`w-4.5 h-4.5 ${config.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{n.title}</p>
                        <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{n.body}</p>
                        <p className="text-xs text-text-tertiary mt-1">{formatTimeAgo(n.time)}</p>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); removeNotification(n.id); }}
                        className="p-1 rounded-lg hover:bg-danger-50 text-text-tertiary hover:text-danger-500 shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
