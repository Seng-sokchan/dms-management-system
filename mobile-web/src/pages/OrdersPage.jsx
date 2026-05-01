import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Filter, Clock, ChevronRight } from 'lucide-react';
import { ordersApi, unwrapApiData, getApiErrorMessage } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SearchBar from '../components/ui/SearchBar';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import { CardSkeleton } from '../components/ui/Skeleton';

const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'NEW_ORDER', label: 'New' },
  { key: 'OWNER_PREPARING', label: 'Preparing' },
  { key: 'OUT_FOR_DELIVERY', label: 'Delivering' },
  { key: 'RECEIVED_BY_CUSTOMER', label: 'Delivered' },
];

export default function OrdersPage({ workflowMode = 'all' }) {
  const [orders, setOrders] = useState([]);
  const [orderGroups, setOrderGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [workflowTab, setWorkflowTab] = useState(workflowMode === 'new_orders' ? 'customer_orders' : workflowMode);
  const [assigningOrder, setAssigningOrder] = useState(null);
  const [selectedOrderGroupId, setSelectedOrderGroupId] = useState('');
  const [submittingAction, setSubmittingAction] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const canManageWorkflow = user?.role === 'Admin' || user?.role === 'Owner';
  const isNewOrdersPage = workflowMode === 'new_orders';
  const isCustomerOrdersPage = workflowMode === 'customer_orders';
  const isOwnerPreparingPage = workflowMode === 'owner_preparing';
  const isLogisticsSupplierPage = workflowMode === 'logistics_supplier';
  const lockWorkflowTab = isNewOrdersPage || isCustomerOrdersPage || isOwnerPreparingPage || isLogisticsSupplierPage;
  const shouldLoadOrderGroups = canManageWorkflow || isOwnerPreparingPage;

  const fetchOrders = () => {
    setLoading(true);
    return Promise.allSettled([
      ordersApi.getAll(),
      shouldLoadOrderGroups ? ordersApi.getOrderGroups() : Promise.resolve({ data: [] }),
    ])
      .then(([ordersResult, groupsResult]) => {
        if (ordersResult.status === 'fulfilled') {
          const data = unwrapApiData(ordersResult.value.data) || [];
          setOrders(Array.isArray(data) ? data : []);
        } else {
          setOrders([]);
        }
        if (groupsResult.status === 'fulfilled') {
          const groups = unwrapApiData(groupsResult.value.data) || [];
          setOrderGroups(Array.isArray(groups) ? groups : []);
        } else {
          setOrderGroups([]);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, [canManageWorkflow, shouldLoadOrderGroups]);

  useEffect(() => {
    if (workflowMode === 'new_orders' || workflowMode === 'customer_orders') {
      setWorkflowTab('customer_orders');
    } else if (workflowMode === 'owner_preparing') {
      setWorkflowTab('owner_preparing');
    } else if (workflowMode === 'logistics_supplier') {
      setWorkflowTab('logistics_supplier');
    } else {
      setWorkflowTab('all');
    }
  }, [workflowMode]);

  const filteredByWorkflow = orders.filter((order) => {
    if (workflowTab === 'all') return true;
    if (workflowTab === 'customer_orders') return (order.status_name || order.status) === 'NEW_ORDER';
    if (workflowTab === 'owner_preparing') return (order.status_name || order.status) === 'OWNER_PREPARING';
    if (workflowTab === 'logistics_supplier') {
      const status = order.status_name || order.status;
      return status === 'SENT_TO_LOGISTICS_SUPPLIER';
    }
    return true;
  });

  const filtered = filteredByWorkflow.filter(o => {
    const customerName = o.customerName || o.customer_name || '';
    const status = o.status_name || o.status;
    const orderId = o.id || '';
    const matchSearch = !search ||
      String(orderId).includes(search) ||
      String(customerName).toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === 'all' || status === activeFilter;
    return matchSearch && matchFilter;
  });

  const handleConfirmNewOrder = async (orderId) => {
    setSubmittingAction(true);
    try {
      if (user?.role === 'Customer') {
        await ordersApi.mobileUpdateStatus(orderId, { status: 'OWNER_PREPARING' });
      } else {
        await ordersApi.updateStatus(orderId, { status: 'OWNER_PREPARING' });
      }
      await fetchOrders();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to confirm order'));
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    setSubmittingAction(true);
    try {
      await ordersApi.delete(orderId);
      await fetchOrders();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to delete order'));
    } finally {
      setSubmittingAction(false);
    }
  };

  const openAssignDialog = (order) => {
    setAssigningOrder(order);
    setSelectedOrderGroupId(order.orderGroupId || order.order_group_id || '');
  };

  const submitAssignOrderGroup = async () => {
    if (!assigningOrder || !selectedOrderGroupId) return;
    setSubmittingAction(true);
    try {
      await ordersApi.assign(assigningOrder.id, { orderGroupId: String(selectedOrderGroupId) });
      setAssigningOrder(null);
      setSelectedOrderGroupId('');
      await fetchOrders();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to assign order group'));
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleConfirmToLogistics = async (order) => {
    if (!order?.orderGroupId && !order?.order_group_id) {
      alert('Assign order group first');
      return;
    }
    setSubmittingAction(true);
    try {
      if (user?.role === 'Customer') {
        await ordersApi.mobileUpdateStatus(order.id, { status: 'SENT_TO_LOGISTICS_SUPPLIER' });
      } else {
        await ordersApi.updateStatus(order.id, { status: 'SENT_TO_LOGISTICS_SUPPLIER' });
      }
      await fetchOrders();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to move order to logistics'));
    } finally {
      setSubmittingAction(false);
    }
  };

  const handleMarkOutForDelivery = async (order) => {
    setSubmittingAction(true);
    try {
      await ordersApi.updateStatus(order.id, { status: 'OUT_FOR_DELIVERY' });
      await fetchOrders();
    } catch (err) {
      alert(getApiErrorMessage(err, 'Failed to move order to out for delivery'));
    } finally {
      setSubmittingAction(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold">
              {isNewOrdersPage
                ? 'New Orders'
                : isCustomerOrdersPage
                  ? 'Customer Orders'
                  : isOwnerPreparingPage
                    ? 'Owner Preparing'
                    : isLogisticsSupplierPage
                      ? 'Logistics Supplier'
                      : 'Orders'}
            </h1>
            <p className="text-xs text-text-secondary">{orders.length} total</p>
          </div>
          {isCustomerOrdersPage ? (
            <Button
              size="sm"
              icon={Plus}
              onClick={() => navigate('/orders/create')}
            >
              New
            </Button>
          ) : null}
        </div>

        <SearchBar
          value={search}
          onChange={setSearch}
          placeholder="Search orders..."
        />

        {canManageWorkflow && !lockWorkflowTab ? (
          <div className="flex gap-2 mt-3 overflow-x-auto hide-scrollbar -mx-4 px-4 pb-1">
            {[
              { key: 'all', label: 'All Orders' },
              { key: 'customer_orders', label: 'Customer Orders' },
              { key: 'owner_preparing', label: 'Owner Preparing' },
              { key: 'logistics_supplier', label: 'Logistics Supplier' },
            ].map(tab => (
              <button
                key={tab.key}
                onClick={() => setWorkflowTab(tab.key)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors
                  ${workflowTab === tab.key
                    ? 'bg-primary-600 text-white'
                    : 'bg-surface border border-border text-text-secondary hover:bg-surface-tertiary'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        ) : null}

        {/* Filter chips */}
        <div className="flex gap-2 mt-3 overflow-x-auto hide-scrollbar -mx-4 px-4 pb-1">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors
                ${activeFilter === f.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-surface border border-border text-text-secondary hover:bg-surface-tertiary'
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Order List */}
      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-4 space-y-2.5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <EmptyState
            title="No orders found"
            description={search ? 'Try a different search term' : 'Create your first order to get started'}
            action={!search && isCustomerOrdersPage ? (
              <Button size="sm" icon={Plus} onClick={() => navigate('/orders/create')}>
                Create Order
              </Button>
            ) : null}
          />
        ) : (
          filtered.map(order => (
            <Card
              key={order.id}
              onClick={() => navigate(`/orders/${order.id}`)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold">Order #{order.id}</span>
                    <StatusBadge status={order.status_name || order.status} />
                  </div>
                  <p className="text-sm text-text-secondary truncate">
                    {order.customer_name || `Customer #${order.customer_id}`}
                  </p>
                  <div className="flex items-center gap-3 mt-2 text-xs text-text-tertiary">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {order.created_at ? new Date(order.created_at).toLocaleDateString() : '—'}
                    </span>
                    <span className="font-semibold text-text-primary">
                      ${Number(order.total_amount || 0).toLocaleString()}
                    </span>
                  </div>
                  {(order.status_name || order.status) === 'NEW_ORDER' && workflowTab === 'customer_orders' ? (
                    <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                      {!isNewOrdersPage ? (
                        <Button size="sm" loading={submittingAction} onClick={() => handleConfirmNewOrder(order.id)}>
                          Confirm
                        </Button>
                      ) : null}
                      <Button size="sm" variant="outline" loading={submittingAction} onClick={() => handleDeleteOrder(order.id)}>
                        Delete
                      </Button>
                    </div>
                  ) : null}
                  {(order.status_name || order.status) === 'OWNER_PREPARING' && workflowTab === 'owner_preparing' ? (
                    <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" variant="outline" loading={submittingAction} onClick={() => openAssignDialog(order)}>
                        Assign Group
                      </Button>
                      <Button
                        size="sm"
                        loading={submittingAction}
                        disabled={!order?.orderGroupId && !order?.order_group_id}
                        onClick={() => handleConfirmToLogistics(order)}
                      >
                        Confirm
                      </Button>
                    </div>
                  ) : null}
                  {(order.status_name || order.status) === 'SENT_TO_LOGISTICS_SUPPLIER' && workflowTab === 'logistics_supplier' ? (
                    <div className="mt-3 flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button size="sm" loading={submittingAction} onClick={() => handleMarkOutForDelivery(order)}>
                        Out for Delivery
                      </Button>
                    </div>
                  ) : null}
                </div>
                <ChevronRight className="w-4.5 h-4.5 text-text-tertiary mt-1 shrink-0" />
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal
        open={!!assigningOrder}
        onClose={() => {
          setAssigningOrder(null);
          setSelectedOrderGroupId('');
        }}
        title="Assign Order Group"
      >
        {assigningOrder ? (
          <div className="space-y-4">
            <p className="text-sm text-text-secondary">
              Order #{assigningOrder.id}
            </p>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-text-secondary">Order Group</label>
              <select
                value={selectedOrderGroupId}
                onChange={(e) => setSelectedOrderGroupId(e.target.value)}
                className="w-full rounded-xl border border-border bg-surface px-4 py-2.5 text-sm outline-none
                  focus:border-primary-400 focus:ring-2 focus:ring-primary-100"
              >
                <option value="">Select order group...</option>
                {orderGroups.map((group) => (
                  <option key={group.id} value={group.id}>{group.name}</option>
                ))}
              </select>
            </div>
            <Button
              size="full"
              loading={submittingAction}
              disabled={!selectedOrderGroupId}
              onClick={submitAssignOrderGroup}
            >
              Assign
            </Button>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
