import { useState, useEffect } from 'react';
import {
  Truck, User, Phone, Plus, ChevronRight, MapPin,
  Package, CheckCircle2
} from 'lucide-react';
import QRCode from 'qrcode';
import { deliveryApi, trucksApi, ordersApi } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SearchBar from '../components/ui/SearchBar';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import Input from '../components/ui/Input';
import { CardSkeleton } from '../components/ui/Skeleton';

const TABS = [
  { key: 'deliveries', label: 'Active', icon: Package },
  { key: 'agents', label: 'Agents', icon: User },
  { key: 'trucks', label: 'Trucks', icon: Truck },
];

export default function DeliveryPage() {
  const [tab, setTab] = useState('deliveries');
  const [agents, setAgents] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAgentForm, setShowAgentForm] = useState(false);
  const [showTruckForm, setShowTruckForm] = useState(false);
  const [showConfirm, setShowConfirm] = useState(null);
  const [confirmQrImage, setConfirmQrImage] = useState('');
  const [generatingQr, setGeneratingQr] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [agentForm, setAgentForm] = useState({ name: '', phone: '', company: '' });
  const [truckForm, setTruckForm] = useState({ plate_number: '', model: '', delivery_agent_id: '' });

  useEffect(() => {
    Promise.all([
      deliveryApi.getAll().catch(() => ({ data: { data: [] } })),
      trucksApi.getAll().catch(() => ({ data: { data: [] } })),
      ordersApi.getAll({ status: 'OUT_FOR_DELIVERY' }).catch(() => ({ data: { data: [] } })),
    ]).then(([agentRes, truckRes, orderRes]) => {
      const a = agentRes.data?.data || agentRes.data || [];
      const t = truckRes.data?.data || truckRes.data || [];
      const o = orderRes.data?.data || orderRes.data || [];
      setAgents(Array.isArray(a) ? a : []);
      setTrucks(Array.isArray(t) ? t : []);
      setActiveOrders(
        (Array.isArray(o) ? o : []).filter(ord =>
          (ord.status_name || ord.status) === 'OUT_FOR_DELIVERY'
        )
      );
    }).finally(() => setLoading(false));
  }, []);

  const handleConfirmDelivery = async () => {
    if (!showConfirm) return;
    setSubmitting(true);
    try {
      await ordersApi.updateStatus(showConfirm.id, {
        status: 'RECEIVED_BY_CUSTOMER',
      });
      setActiveOrders(prev => prev.filter(o => o.id !== showConfirm.id));
      setShowConfirm(null);
      setConfirmQrImage('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to confirm');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGenerateConfirmQr = async () => {
    if (!showConfirm) return;
    setGeneratingQr(true);
    try {
      const payload = `ORDER:${showConfirm.id}`;
      const qrImage = await QRCode.toDataURL(payload, { width: 320, margin: 1 });
      setConfirmQrImage(qrImage);
    } catch {
      alert('Failed to generate QR code');
    } finally {
      setGeneratingQr(false);
    }
  };

  useEffect(() => {
    if (!showConfirm) return;
    handleGenerateConfirmQr();
  }, [showConfirm]);

  const handleCreateAgent = async () => {
    if (!agentForm.name) return;
    setSubmitting(true);
    try {
      await deliveryApi.create(agentForm);
      const res = await deliveryApi.getAll();
      setAgents(res.data?.data || res.data || []);
      setShowAgentForm(false);
      setAgentForm({ name: '', phone: '', company: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateTruck = async () => {
    if (!truckForm.plate_number) return;
    setSubmitting(true);
    try {
      await trucksApi.create(truckForm);
      const res = await trucksApi.getAll();
      setTrucks(res.data?.data || res.data || []);
      setShowTruckForm(false);
      setTruckForm({ plate_number: '', model: '', delivery_agent_id: '' });
    } catch (err) {
      alert(err.response?.data?.message || 'Failed');
    } finally {
      setSubmitting(false);
    }
  };

  const filterItems = (items, key) =>
    items.filter(item => {
      const name = item.name || item.plate_number || '';
      return !search || name.toLowerCase().includes(search.toLowerCase());
    });

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <h1 className="text-xl font-bold mb-3">Delivery</h1>

        {/* Tab Bar */}
        <div className="flex bg-surface-tertiary rounded-xl p-1 gap-1 mb-3">
          {TABS.map(t => (
            <button
              key={t.key}
              onClick={() => { setTab(t.key); setSearch(''); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all
                ${tab === t.key
                  ? 'bg-surface text-primary-600 shadow-sm'
                  : 'text-text-secondary hover:text-text-primary'
                }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>

        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder={`Search ${tab}...`}
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-4 space-y-2.5">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)

        ) : tab === 'deliveries' ? (
          /* Active Deliveries */
          activeOrders.length === 0 ? (
            <EmptyState
              icon={Truck}
              title="No active deliveries"
              description="Orders ready for delivery will appear here"
            />
          ) : (
            filterItems(activeOrders, 'customer_name').map(order => (
              <Card key={order.id}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl shrink-0 ${
                    (order.status_name || order.status) === 'OUT_FOR_DELIVERY'
                      ? 'bg-warning-50' : 'bg-primary-50'
                  }`}>
                    <Truck className={`w-5 h-5 ${
                      (order.status_name || order.status) === 'OUT_FOR_DELIVERY'
                        ? 'text-warning-600' : 'text-primary-600'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold">Order #{order.id}</span>
                      <StatusBadge status={order.status_name || order.status} />
                    </div>
                    <p className="text-sm text-text-secondary truncate">
                      {order.customer_name || `Customer #${order.customer_id}`}
                    </p>
                    {order.delivery_address && (
                      <p className="text-xs text-text-tertiary flex items-center gap-1 mt-1 truncate">
                        <MapPin className="w-3 h-3 shrink-0" /> {order.delivery_address}
                      </p>
                    )}
                    <div className="mt-2">
                      <Button
                        size="sm"
                        icon={CheckCircle2}
                        onClick={(e) => { e.stopPropagation(); setShowConfirm(order); }}
                      >
                        Confirm delivery
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )

        ) : tab === 'agents' ? (
          /* Delivery Agents */
          <>
            <div className="flex justify-end mb-1">
              <Button size="sm" icon={Plus} onClick={() => setShowAgentForm(true)}>Add Agent</Button>
            </div>
            {filterItems(agents).length === 0 ? (
              <EmptyState icon={User} title="No agents" description="Add delivery agents" />
            ) : (
              filterItems(agents).map(agent => (
                <Card key={agent.id}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary-50 flex items-center justify-center shrink-0">
                      <span className="text-sm font-semibold text-primary-600">
                        {(agent.name || '?')[0].toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{agent.name}</p>
                      {agent.phone && (
                        <p className="text-xs text-text-tertiary flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3" /> {agent.phone}
                        </p>
                      )}
                      {agent.company && (
                        <p className="text-xs text-text-tertiary mt-0.5">{agent.company}</p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-text-tertiary">
                        {trucks.filter(t => t.delivery_agent_id === agent.id).length} trucks
                      </p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </>

        ) : (
          /* Trucks */
          <>
            <div className="flex justify-end mb-1">
              <Button size="sm" icon={Plus} onClick={() => setShowTruckForm(true)}>Add Truck</Button>
            </div>
            {filterItems(trucks).length === 0 ? (
              <EmptyState icon={Truck} title="No trucks" description="Add trucks to your fleet" />
            ) : (
              filterItems(trucks).map(truck => {
                const agent = agents.find(a => a.id === truck.delivery_agent_id);
                return (
                  <Card key={truck.id}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-surface-tertiary flex items-center justify-center shrink-0">
                        <Truck className="w-5 h-5 text-text-tertiary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">
                          {truck.plate_number}
                        </p>
                        {truck.model && (
                          <p className="text-xs text-text-tertiary">{truck.model}</p>
                        )}
                        {agent && (
                          <p className="text-xs text-text-tertiary flex items-center gap-1 mt-0.5">
                            <User className="w-3 h-3" /> {agent.name}
                          </p>
                        )}
                      </div>
                    </div>
                  </Card>
                );
              })
            )}
          </>
        )}
      </div>

      {/* Delivery Confirmation Modal */}
      <Modal
        open={!!showConfirm}
        onClose={() => {
          setShowConfirm(null);
          setConfirmQrImage('');
        }}
        title={`Confirm Delivery — #${showConfirm?.id || ''}`}
      >
        {showConfirm && (
          <div className="space-y-4">
            <div className="bg-surface-secondary rounded-xl p-3">
              <p className="text-xs text-text-tertiary mb-1">Customer Name</p>
              <p className="text-sm font-medium">{showConfirm.customer_name || 'Customer'}</p>
              {showConfirm.delivery_address && (
                <p className="text-xs text-text-tertiary mt-1">{showConfirm.delivery_address}</p>
              )}
            </div>

            <div className="bg-surface-secondary rounded-xl p-4 text-center">
              <p className="text-sm font-medium mb-2">Order Identification QR</p>
              <p className="text-xs text-text-secondary mb-3">Customer scans this QR to verify order #{showConfirm.id}</p>
              <div className="bg-white rounded-xl p-3 inline-block border border-border">
                {confirmQrImage ? (
                  <img src={confirmQrImage} alt="Order identification QR" className="w-44 h-44" />
                ) : (
                  <div className="w-44 h-44 flex items-center justify-center text-xs text-text-tertiary">
                    {generatingQr ? 'Generating QR...' : 'QR unavailable'}
                  </div>
                )}
              </div>
            </div>

            <Button
              size="full"
              loading={submitting}
              icon={CheckCircle2}
              onClick={handleConfirmDelivery}
            >
              Confirm delivery
            </Button>
          </div>
        )}
      </Modal>

      {/* Add Agent Modal */}
      <Modal open={showAgentForm} onClose={() => setShowAgentForm(false)} title="New Delivery Agent">
        <div className="space-y-4">
          <Input label="Name" placeholder="Agent name" value={agentForm.name}
            onChange={e => setAgentForm(p => ({ ...p, name: e.target.value }))} required />
          <Input label="Phone" placeholder="Phone number" value={agentForm.phone}
            onChange={e => setAgentForm(p => ({ ...p, phone: e.target.value }))} />
          <Input label="Company" placeholder="Company name" value={agentForm.company}
            onChange={e => setAgentForm(p => ({ ...p, company: e.target.value }))} />
          <Button size="full" loading={submitting} onClick={handleCreateAgent}>Create Agent</Button>
        </div>
      </Modal>

      {/* Add Truck Modal */}
      <Modal open={showTruckForm} onClose={() => setShowTruckForm(false)} title="New Truck">
        <div className="space-y-4">
          <Input label="Plate Number" placeholder="e.g. PP-1234" value={truckForm.plate_number}
            onChange={e => setTruckForm(p => ({ ...p, plate_number: e.target.value }))} required />
          <Input label="Model" placeholder="e.g. Toyota Hilux" value={truckForm.model}
            onChange={e => setTruckForm(p => ({ ...p, model: e.target.value }))} />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-text-secondary">Delivery Agent</label>
            <select
              value={truckForm.delivery_agent_id}
              onChange={e => setTruckForm(p => ({ ...p, delivery_agent_id: e.target.value }))}
              className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none
                focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
            >
              <option value="">Select agent...</option>
              {agents.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
          </div>
          <Button size="full" loading={submitting} onClick={handleCreateTruck}>Add Truck</Button>
        </div>
      </Modal>
    </div>
  );
}
