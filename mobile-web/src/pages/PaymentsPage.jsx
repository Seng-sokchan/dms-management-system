import { useState, useEffect, useMemo, useRef } from 'react';
import { DollarSign, QrCode, Filter, Clock, CreditCard, Banknote, ChevronRight } from 'lucide-react';
import QRCode from 'qrcode';
import { ordersApi, paymentsApi } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import SearchBar from '../components/ui/SearchBar';
import StatusBadge from '../components/ui/StatusBadge';
import EmptyState from '../components/ui/EmptyState';
import Modal from '../components/ui/Modal';
import { CardSkeleton } from '../components/ui/Skeleton';

const PAYMENT_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'PAID', label: 'Paid' },
  { key: 'UNPAID', label: 'Unpaid' },
];

const KHQR_EXPIRATION_MS = 5 * 60 * 1000;
const KHQR_CHECK_INTERVAL_MS = 5000;

/** Backend payment rows often omit paymentStatus; use linked order totals + order.paymentStatus. */
function resolvePaymentStatusFromOrder(order) {
  if (!order) return null;
  const total = Number(order.amountTotal || order.amount_total || 0);
  const paid = Number(order.amountPaid || order.amount_paid || 0);
  if (total > 0 && paid >= total - 0.02) return 'PAID';
  const named = String(order.paymentStatus || order.payment_status || '').toUpperCase();
  if (named === 'PAID') return 'PAID';
  return 'UNPAID';
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showKHQR, setShowKHQR] = useState(false);
  const [qrData, setQrData] = useState(null);
  const [qrLoading, setQrLoading] = useState(false);
  const [qrImage, setQrImage] = useState('');
  const [khqrExpiresAt, setKhqrExpiresAt] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [khqrMd5History, setKhqrMd5History] = useState([]);
  const [successTransaction, setSuccessTransaction] = useState(null);
  const [pendingPayment, setPendingPayment] = useState(null);
  const [selectedPayAmount, setSelectedPayAmount] = useState(0);
  const handledSuccessMd5Ref = useRef(null);

  const fetchPayments = () => {
    return Promise.allSettled([paymentsApi.getAll(), ordersApi.getAll()])
      .then(([paymentsResult, ordersResult]) => {
        if (paymentsResult.status === 'fulfilled') {
          const paymentData = paymentsResult.value.data?.data || paymentsResult.value.data || [];
          setPayments(Array.isArray(paymentData) ? paymentData : []);
        } else {
          setPayments([]);
        }

        if (ordersResult.status === 'fulfilled') {
          const orderData = ordersResult.value.data?.data || ordersResult.value.data || [];
          setOrders(Array.isArray(orderData) ? orderData : []);
        } else {
          // Keep payment list visible even if orders endpoint fails.
          setOrders([]);
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const normalizedPayments = useMemo(() => {
    const ordersById = new Map(orders.map((o) => [String(o.id), o]));

    const paymentRows = payments.map((payment) => {
      const amount = Number(payment.amount || 0);
      const orderIdNorm = String(payment.orderId || payment.order_id || payment.id || '');
      const linkedOrder = orderIdNorm ? ordersById.get(orderIdNorm) : null;
      const fromOrder = resolvePaymentStatusFromOrder(linkedOrder);
      return {
        ...payment,
        orderId: payment.orderId || payment.order_id || payment.id,
        customerName: payment.orderCustomerName || payment.customer_name || payment.customerName,
        paymentStatus:
          fromOrder
          ?? payment.paymentStatus
          ?? payment.payment_status
          ?? payment.status
          ?? 'UNPAID',
        methodName: payment.methodName || payment.payment_method || 'Not set',
        amount,
        createdAt: payment.createdAt || payment.created_at,
      };
    });
    const hasPaymentOrderIds = new Set(paymentRows.map((item) => String(item.orderId || item.id)));
    const unpaidOrderRows = orders
      .filter((order) => {
        const orderId = String(order.id || '');
        if (!orderId || hasPaymentOrderIds.has(orderId)) return false;
        const total = Number(order.amountTotal || order.amount_total || 0);
        const paid = Number(order.amountPaid || order.amount_paid || 0);
        return total - paid > 0;
      })
      .map((order) => {
        const total = Number(order.amountTotal || order.amount_total || 0);
        const paid = Number(order.amountPaid || order.amount_paid || 0);
        const outstanding = Math.max(0, total - paid);
        return {
          id: `order-${order.id}`,
          orderId: String(order.id),
          customerName: order.customerName || order.customer_name || `Customer #${order.customerId || order.customer_id}`,
          paymentStatus: resolvePaymentStatusFromOrder(order) || 'UNPAID',
          methodName: 'Not set',
          amount: outstanding,
          createdAt: order.createdAt || order.created_at,
          isOrderOutstanding: true,
        };
      });

    return [...paymentRows, ...unpaidOrderRows];
  }, [payments, orders]);

  const filtered = normalizedPayments.filter(p => {
    const matchSearch = !search ||
      String(p.orderId || p.id).includes(search) ||
      (p.customerName || '').toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === 'all' ||
      p.paymentStatus === activeFilter;
    return matchSearch && matchFilter;
  });

  const totalPaid = normalizedPayments
    .filter(p => p.paymentStatus === 'PAID')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const totalUnpaid = normalizedPayments
    .filter(p => p.paymentStatus === 'UNPAID')
    .reduce((sum, p) => sum + Number(p.amount || 0), 0);

  const outstandingByOrderId = useMemo(() => {
    const map = new Map();
    orders.forEach((order) => {
      const orderId = String(order.id);
      const total = Number(order.amountTotal || order.amount_total || 0);
      const paid = Number(order.amountPaid || order.amount_paid || 0);
      const outstanding = Math.max(0, total - paid);
      map.set(orderId, Number(outstanding.toFixed(2)));
    });
    return map;
  }, [orders]);

  const getSuccessfulTransaction = (payload) => {
    if (!payload || Number(payload.responseCode) !== 0 || !Array.isArray(payload.data)) {
      return null;
    }
    return payload.data.find((item) => {
      const status = String(item?.status || '').toUpperCase();
      return status === 'SUCCESS' || status === 'APPROVED' || status === 'COMPLETED';
    }) || null;
  };

  const requestKhqr = async (payment, { amountOverride } = {}) => {
    setShowKHQR(true);
    setQrLoading(true);
    setQrData(null);
    setQrImage('');
    setKhqrMd5History([]);
    setSuccessTransaction(null);
    handledSuccessMd5Ref.current = null;
    try {
      const amountToPay = amountOverride != null ? Number(amountOverride) : Number(payment.amount || 0);
      const requestPayload = {
        orderId: String(payment.orderId || payment.id),
        currency: 'USD',
      };
      // Let backend compute outstanding amount to avoid KHQR amount mismatch (400).
      const res = await paymentsApi.generateKHQR(requestPayload);
      const responsePayload = res.data?.data || res.data || {};
      const md5ForCheck = responsePayload.md5 || responsePayload.khqr || '';
      setPendingPayment(payment);
      setSelectedPayAmount(Number(responsePayload.amount || amountToPay || 0));
      setQrData(responsePayload);
      setKhqrExpiresAt(Date.now() + KHQR_EXPIRATION_MS);
      setSecondsLeft(Math.ceil(KHQR_EXPIRATION_MS / 1000));
      if (md5ForCheck) {
        setKhqrMd5History([md5ForCheck]);
      }
    } catch (err) {
      setQrData({ error: err.response?.data?.message || 'Failed to generate QR' });
      setKhqrExpiresAt(null);
      setSecondsLeft(0);
    } finally {
      setQrLoading(false);
    }  
  };

  const checkMd5List = async (md5List) => {
    if (!Array.isArray(md5List) || md5List.length === 0 || !pendingPayment) return;
    try {
      const response = await paymentsApi.checkKHQR(md5List);
      const payload = response?.data || {};
      const foundSuccess = getSuccessfulTransaction(payload);
      if (!foundSuccess) return;

      const successMd5 = String(foundSuccess?.md5 || '');
      if (!successMd5 || handledSuccessMd5Ref.current === successMd5) return;
      handledSuccessMd5Ref.current = successMd5;

      await paymentsApi.confirmKHQR({
        orderId: String(pendingPayment.orderId || pendingPayment.id),
        transaction: foundSuccess,
      });
      await fetchPayments();
      setShowKHQR(false);
      setSuccessTransaction(foundSuccess);
      setPendingPayment(null);
    } catch {
      // Keep polling silently while QR remains active.
    }
  };

  useEffect(() => {
    let active = true;
    const khqr = qrData?.khqr;
    if (!khqr) {
      setQrImage('');
      return () => {
        active = false;
      };
    }
    QRCode.toDataURL(khqr, { width: 320, margin: 1 })
      .then((dataUrl) => {
        if (active) setQrImage(dataUrl);
      })
      .catch(() => {
        if (active) setQrImage('');
      });
    return () => {
      active = false;
    };
  }, [qrData?.khqr]);

  useEffect(() => {
    if (!showKHQR || khqrMd5History.length === 0 || successTransaction) return undefined;
    void checkMd5List(khqrMd5History);
    const intervalId = setInterval(() => {
      void checkMd5List(khqrMd5History);
    }, KHQR_CHECK_INTERVAL_MS);
    return () => clearInterval(intervalId);
  }, [showKHQR, khqrMd5History, successTransaction, pendingPayment]);

  useEffect(() => {
    if (!showKHQR || !khqrExpiresAt || !pendingPayment) return undefined;
    const intervalId = setInterval(() => {
      const remainingSeconds = Math.max(0, Math.ceil((khqrExpiresAt - Date.now()) / 1000));
      setSecondsLeft(remainingSeconds);
      if (remainingSeconds <= 0 && !qrLoading) {
        setKhqrExpiresAt(null);
        void requestKhqr(pendingPayment, { amountOverride: selectedPayAmount });
      }
    }, 1000);
    return () => clearInterval(intervalId);
  }, [showKHQR, khqrExpiresAt, pendingPayment, qrLoading, selectedPayAmount]);

  const getMethodIcon = (method) => {
    if (!method) return CreditCard;
    const m = method.toLowerCase();
    if (m.includes('cash')) return Banknote;
    if (m.includes('bank') || m.includes('khqr')) return QrCode;
    return CreditCard;
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-2">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-xl font-bold">Payments</h1>
            <p className="text-xs text-text-secondary">{payments.length} records</p>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 gap-2.5 mb-3">
          <div className="bg-success-50 rounded-xl p-3">
            <p className="text-xs text-success-600 font-medium">Collected</p>
            <p className="text-lg font-bold text-success-600">
              ${totalPaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-danger-50 rounded-xl p-3">
            <p className="text-xs text-danger-600 font-medium">Outstanding</p>
            <p className="text-lg font-bold text-danger-600">
              ${totalUnpaid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        </div>

        <SearchBar value={search} onChange={setSearch} placeholder="Search payments..." />

        {/* Filter chips */}
        <div className="flex gap-2 mt-3 overflow-x-auto hide-scrollbar -mx-4 px-4 pb-1">
          {PAYMENT_FILTERS.map(f => (
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

      {/* Payment List */}
      <div className="flex-1 overflow-y-auto px-4 pt-2 pb-28 space-y-2.5">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => <CardSkeleton key={i} />)
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={DollarSign}
            title="No payments found"
            description={search ? 'Try a different search' : 'Payments will appear here'}
          />
        ) : (
          filtered.map((payment, idx) => {
            const MethodIcon = getMethodIcon(payment.payment_method);
            const isPaid = payment.paymentStatus === 'PAID';

            return (
              <Card key={payment.id || idx} onClick={() => setSelectedPayment(payment)}>
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-xl shrink-0 ${isPaid ? 'bg-success-50' : 'bg-warning-50'}`}>
                    <MethodIcon className={`w-5 h-5 ${isPaid ? 'text-success-600' : 'text-warning-600'}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold">Order #{payment.orderId || payment.id}</span>
                      <StatusBadge status={payment.paymentStatus} />
                    </div>
                    <p className="text-sm text-text-secondary truncate">
                      {payment.customerName || 'Customer —'}
                    </p>
                    <div className="flex items-center justify-between mt-2 text-xs text-text-tertiary">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : '—'}
                      </span>
                      <span className="font-semibold text-text-primary text-sm">
                        ${Number(payment.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-tertiary mt-1 shrink-0" />
                </div>
              </Card>
            );
          })
        )}
      </div>

      {/* Payment Detail Modal */}
      <Modal
        open={!!selectedPayment}
        onClose={() => setSelectedPayment(null)}
        title={`Payment — Order #${selectedPayment?.orderId || selectedPayment?.order_id || selectedPayment?.id || ''}`}
      >
        {selectedPayment && (
          <div className="space-y-4">
            {(() => {
              const orderId = String(selectedPayment.orderId || selectedPayment.order_id || selectedPayment.id || '');
              const orderOutstanding = outstandingByOrderId.get(orderId);
              const linkedOrder = orders.find((o) => String(o.id) === orderId);
              const displayStatus =
                resolvePaymentStatusFromOrder(linkedOrder)
                ?? selectedPayment.paymentStatus
                ?? 'UNPAID';
              const canPayWithBank = Number(orderOutstanding) > 0 && displayStatus !== 'PAID';
              return (
                <>
            <div className="text-center py-4">
              <p className="text-sm text-text-secondary mb-1">Amount</p>
              <p className="text-3xl font-bold">
                ${Number(selectedPayment.amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <div className="mt-2">
                <StatusBadge status={displayStatus} />
              </div>
              {Number.isFinite(orderOutstanding) ? (
                <p className="mt-2 text-xs text-text-secondary">
                  Outstanding balance: ${Number(orderOutstanding).toFixed(2)}
                </p>
              ) : null}
            </div>

            <div className="space-y-3 bg-surface-secondary rounded-xl p-4">
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Customer</span>
                <span className="font-medium">{selectedPayment.customerName || '—'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Method</span>
                <span className="font-medium">{selectedPayment.methodName || 'Not set'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-text-secondary">Date</span>
                <span className="font-medium">
                  {selectedPayment.createdAt
                    ? new Date(selectedPayment.createdAt).toLocaleString()
                    : '—'}
                </span>
              </div>
            </div>

            {displayStatus !== 'PAID' ? (
              <div className="space-y-2">
                <Button
                  size="full"
                  icon={QrCode}
                  disabled={!canPayWithBank}
                  onClick={() => {
                    setSelectedPayment(null);
                    requestKhqr(selectedPayment);
                  }}
                >
                  PAY WITH BANK
                </Button>
                {!canPayWithBank ? (
                  <p className="text-xs text-danger-600 text-center">
                    No outstanding balance for this order.
                  </p>
                ) : null}
              </div>
            ) : null}
                </>
              );
            })()}
          </div>
        )}
      </Modal>

      {/* KHQR Modal */}
      <Modal
        open={showKHQR}
        onClose={() => {
          setShowKHQR(false);
          setQrData(null);
          setQrImage('');
          setKhqrMd5History([]);
          setPendingPayment(null);
          setKhqrExpiresAt(null);
          setSecondsLeft(0);
        }}
        title="PAY WITH BANK"
      >
        <div className="text-center py-4">
          {qrLoading ? (
            <div className="flex flex-col items-center gap-3 py-8">
              <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm text-text-secondary">Generating QR code...</p>
            </div>
          ) : qrData?.error ? (
            <div className="bg-danger-50 rounded-xl p-4">
              <p className="text-sm text-danger-600">{qrData.error}</p>
            </div>
          ) : qrData ? (
            <>
              <div className="bg-white rounded-2xl p-6 inline-block mb-4 border border-border">
                {qrImage ? (
                  <img src={qrImage} alt="KHQR Code" className="w-52 h-52 mx-auto" />
                ) : (
                  <div className="w-52 h-52 bg-surface-tertiary rounded-xl flex items-center justify-center">
                    <QrCode className="w-16 h-16 text-text-tertiary" />
                  </div>
                )}
              </div>

              {selectedPayAmount > 0 && (
                <p className="text-2xl font-bold mb-1">
                  ${Number(selectedPayAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              )}
              <p className="text-sm text-text-secondary mb-4">Scan with any Bakong-supported banking app</p>
              <p className="text-xs text-text-tertiary mb-4">
                QR refreshes automatically every 5 minutes ({String(Math.floor(secondsLeft / 60)).padStart(2, '0')}:
                {String(secondsLeft % 60).padStart(2, '0')})
              </p>

              {qrData.md5 && (
                <p className="text-xs text-text-tertiary font-mono break-all px-4">
                  MD5: {qrData.md5}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-text-secondary py-8">No QR data available</p>
          )}
        </div>
      </Modal>

      <Modal open={!!successTransaction} onClose={() => setSuccessTransaction(null)} title="Payment Successful">
        <div className="text-center py-4">
          <p className="text-sm text-text-secondary mb-2">Bakong payment received.</p>
          {successTransaction?.data?.amount ? (
            <p className="text-2xl font-bold mb-3">
              {successTransaction.data.currency || 'USD'} {Number(successTransaction.data.amount).toFixed(2)}
            </p>
          ) : null}
          {successTransaction?.md5 ? (
            <p className="text-xs text-text-tertiary font-mono break-all">MD5: {successTransaction.md5}</p>
          ) : null}
          <div className="mt-5">
            <Button size="full" onClick={() => setSuccessTransaction(null)}>Done</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
