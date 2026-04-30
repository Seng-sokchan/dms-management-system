import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Clock, User, MapPin, Phone,
  Package, DollarSign, Truck, CheckCircle2
} from 'lucide-react';
import { ordersApi } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import Skeleton from '../components/ui/Skeleton';

const STATUS_STEPS = [
  { key: 'NEW_ORDER', label: 'New Order', icon: Package },
  { key: 'OWNER_PREPARING', label: 'Preparing', icon: Clock },
  { key: 'SENT_TO_LOGISTICS_SUPPLIER', label: 'To Logistics', icon: Truck },
  { key: 'SUPPLIER_ORDER_READY', label: 'Ready', icon: CheckCircle2 },
  { key: 'OUT_FOR_DELIVERY', label: 'Delivering', icon: Truck },
  { key: 'RECEIVED_BY_CUSTOMER', label: 'Delivered', icon: CheckCircle2 },
];

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadOrder = async () => {
      setLoading(true);
      try {
        // Backend currently does not expose GET /orders/:id for mobile.
        // Use list endpoint and resolve selected record by id.
        const listRes = await ordersApi.getAll();
        const rows = listRes.data?.data || listRes.data || [];
        const selected = (Array.isArray(rows) ? rows : []).find((row) => String(row.id) === String(id));
        if (!selected) {
          setOrder(null);
        } else {
          setOrder(selected);
        }
      } catch {
        setOrder(null);
      } finally {
        setLoading(false);
      }
    };
    loadOrder();
  }, [id, navigate]);

  if (loading) {
    return (
      <div className="p-4 space-y-4">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-32 rounded-2xl" />
        <Skeleton className="h-48 rounded-2xl" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="p-4">
        <Card className="text-center py-8">
          <p className="text-sm text-text-secondary mb-3">Order detail not found</p>
          <Button size="sm" onClick={() => navigate('/customer-orders', { replace: true })}>
            Back to Customer Orders
          </Button>
        </Card>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.findIndex(
    s => s.key === (order.status_name || order.status)
  );

  return (
    <div className="pb-4">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => navigate(-1)}
            className="p-1.5 rounded-xl hover:bg-surface-tertiary transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex-1">
            <h1 className="text-base font-semibold">Order #{order.id}</h1>
          </div>
          <StatusBadge status={order.status_name || order.status} />
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Status Timeline */}
        <Card>
          <h3 className="text-sm font-semibold mb-4">Order Progress</h3>
          <div className="space-y-0">
            {STATUS_STEPS.map((step, i) => {
              const isCompleted = i <= currentStepIndex;
              const isCurrent = i === currentStepIndex;
              const Icon = step.icon;
              return (
                <div key={step.key} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0
                      ${isCurrent ? 'bg-primary-600 text-white' :
                        isCompleted ? 'bg-success-500 text-white' :
                        'bg-surface-tertiary text-text-tertiary'}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    {i < STATUS_STEPS.length - 1 && (
                      <div className={`w-0.5 h-6 my-1 ${isCompleted ? 'bg-success-500' : 'bg-surface-tertiary'}`} />
                    )}
                  </div>
                  <div className="pt-0.5">
                    <p className={`text-sm font-medium ${isCurrent ? 'text-primary-600' : isCompleted ? 'text-text-primary' : 'text-text-tertiary'}`}>
                      {step.label}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Customer Info */}
        <Card>
          <h3 className="text-sm font-semibold mb-3">Customer</h3>
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5 text-sm">
              <User className="w-4 h-4 text-text-tertiary shrink-0" />
              <span>{order.customer_name || `Customer #${order.customer_id}`}</span>
            </div>
            {order.customer_phone && (
              <div className="flex items-center gap-2.5 text-sm">
                <Phone className="w-4 h-4 text-text-tertiary shrink-0" />
                <a href={`tel:${order.customer_phone}`} className="text-primary-600">{order.customer_phone}</a>
              </div>
            )}
            {order.delivery_address && (
              <div className="flex items-center gap-2.5 text-sm">
                <MapPin className="w-4 h-4 text-text-tertiary shrink-0" />
                <span className="text-text-secondary">{order.delivery_address}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Order Items */}
        <Card>
          <h3 className="text-sm font-semibold mb-3">Items</h3>
          {order.items?.length > 0 ? (
            <div className="space-y-3">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.item_name || item.name}</p>
                    <p className="text-xs text-text-tertiary">Qty: {item.quantity || item.ordered_qty}</p>
                  </div>
                  <span className="font-semibold">${Number(item.price || item.unit_price || 0).toLocaleString()}</span>
                </div>
              ))}
              <div className="border-t border-border pt-3 flex items-center justify-between">
                <span className="text-sm font-semibold">Total</span>
                <span className="text-lg font-bold text-primary-600">
                  ${Number(order.total_amount || 0).toLocaleString()}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-text-secondary">No items listed</p>
          )}
        </Card>

        {/* Payment Info */}
        <Card>
          <h3 className="text-sm font-semibold mb-3">Payment</h3>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm">
              <DollarSign className="w-4 h-4 text-text-tertiary" />
              <span>{order.payment_method || 'Not specified'}</span>
            </div>
            <StatusBadge status={order.payment_status || 'UNPAID'} />
          </div>
        </Card>
      </div>
    </div>
  );
}
