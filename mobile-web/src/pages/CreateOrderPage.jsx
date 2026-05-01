import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { ordersApi, customersApi, itemsApi, unwrapApiData, getApiErrorMessage } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

function getItemUnitPrice(item, currency = 'USD') {
  if (!item) return 0;
  if (currency === 'KHR') {
    return Number(
      item.defaultUnitPriceKhr ??
      item.default_unit_price_khr ??
      0
    );
  }
  return Number(
    item.defaultUnitPriceUsd ??
    item.default_unit_price_usd ??
    item.defaultUnitPrice ??
    item.default_unit_price ??
    item.price_usd ??
    item.price ??
    0
  );
}

export default function CreateOrderPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customers, setCustomers] = useState([]);
  const [items, setItems] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState('');
  const [selectedItemId, setSelectedItemId] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [orderedQty, setOrderedQty] = useState(1);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    customersApi.getAll().then(res => {
      const data = unwrapApiData(res.data) || [];
      setCustomers(Array.isArray(data) ? data : []);
    }).catch(() => {});
  }, []);

  const isCustomerUser = String(user?.role || '').toLowerCase() === 'customer';

  useEffect(() => {
    if (!isCustomerUser || customers.length === 0) return;
    const currentUserId = String(user?.id || user?.sub || '');
    const matchedCustomer = customers.find((customer) => String(customer.userId || '') === currentUserId);
    setSelectedCustomer(matchedCustomer ? String(matchedCustomer.id) : '');
  }, [isCustomerUser, customers, user]);

  useEffect(() => {
    if (!selectedCustomer) {
      setItems([]);
      setSelectedItemId('');
      return;
    }
    itemsApi.getAll({ customerId: selectedCustomer }).then(res => {
      const data = unwrapApiData(res.data) || [];
      const nextItems = Array.isArray(data) ? data : [];
      setItems(nextItems);
      if (!nextItems.some((item) => String(item.id) === String(selectedItemId))) {
        setSelectedItemId('');
      }
    }).catch(() => {});
  }, [selectedCustomer]);

  const selectedItem = items.find((item) => String(item.id) === String(selectedItemId));
  const unitPrice = getItemUnitPrice(selectedItem, currency);
  const total = unitPrice * Number(orderedQty || 0);

  const handleSubmit = async () => {
    if (!selectedCustomer || !selectedItemId) return;
    setSubmitting(true);
    try {
      const qty = Number(orderedQty || 0);
      await ordersApi.create({
        customerId: String(selectedCustomer),
        itemId: String(selectedItemId),
        currency,
        orderedQty: qty > 0 ? qty : 1,
        unitPrice: unitPrice > 0 ? unitPrice : undefined,
      });
      navigate('/customer-orders', { replace: true });
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to create order'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-full">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-surface/80 backdrop-blur-xl border-b border-border">
        <div className="flex items-center gap-3 px-4 py-3">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-xl hover:bg-surface-tertiary">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-base font-semibold">Create Order</h1>
        </div>
      </div>

      <div className="flex-1 p-4">
        <Card className="space-y-4">
          <h2 className="text-2xl font-semibold text-text-primary">New order</h2>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Customer name</label>
            {isCustomerUser ? (
              <Input
                value={customers.find((c) => String(c.id) === String(selectedCustomer))?.name || user?.name || ''}
                readOnly
              />
            ) : (
              <select
                value={selectedCustomer}
                onChange={e => setSelectedCustomer(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none
                  focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              >
                <option value="">— Select a customer —</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Item (catalog)</label>
            <select
              value={selectedItemId}
              onChange={(e) => setSelectedItemId(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none
                focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            >
              <option value="">— Select an item —</option>
              {items.map(item => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Currency</label>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none
                focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            >
              <option value="USD">USD</option>
              <option value="KHR">KHR</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Ordered qty</label>
            <Input
              type="number"
              min="1"
              value={orderedQty}
              onChange={(e) => setOrderedQty(Math.max(1, Number(e.target.value) || 1))}
            />
          </div>

          <div className="pt-1">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm text-text-secondary">Total</span>
              <span className="text-xl font-bold">
                {currency} {total.toLocaleString(undefined, {
                  minimumFractionDigits: currency === 'USD' ? 2 : 0,
                  maximumFractionDigits: currency === 'USD' ? 2 : 0,
                })}
              </span>
            </div>
            <p className="text-xs text-text-secondary mb-3">
              Unit price: {currency} {unitPrice.toLocaleString(undefined, {
                minimumFractionDigits: currency === 'USD' ? 2 : 0,
                maximumFractionDigits: currency === 'USD' ? 2 : 0,
              })}
            </p>
            <Button
              size="full"
              loading={submitting}
              disabled={!selectedCustomer || !selectedItemId}
              onClick={handleSubmit}
            >
              Create Order
            </Button>
          </div>
        </Card>

      </div>
    </div>
  );
}
