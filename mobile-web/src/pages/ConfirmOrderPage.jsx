import { useEffect, useMemo, useState } from 'react';
import { ScanLine, CheckCircle2 } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';
import { ordersApi } from '../services/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';

const SCANNER_ELEMENT_ID = 'order-qr-reader';

function parseOrderIdFromQr(value) {
  if (!value) return null;
  const text = String(value).trim();
  if (text.startsWith('ORDER:')) {
    return text.replace('ORDER:', '').trim();
  }
  const maybeNumber = text.match(/\d+/)?.[0];
  return maybeNumber || null;
}

export default function ConfirmOrderPage() {
  const [scanner, setScanner] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [busy, setBusy] = useState(false);
  const [lastScan, setLastScan] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const orderId = useMemo(() => parseOrderIdFromQr(lastScan), [lastScan]);

  const stopScanner = async (instance = scanner) => {
    if (!instance) return;
    try {
      if (instance.isScanning) {
        await instance.stop();
      }
      await instance.clear();
    } catch {
      // Ignore scanner cleanup errors.
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    return () => {
      void stopScanner(scanner);
    };
  }, [scanner]);

  const handleScanOrder = async () => {
    setError('');
    setResult(null);
    setLastScan('');

    if (scanning) return;
    const instance = new Html5Qrcode(SCANNER_ELEMENT_ID);
    setScanner(instance);
    setScanning(true);

    try {
      await instance.start(
        { facingMode: { exact: 'environment' } },
        { fps: 10, qrbox: 240 },
        async (decodedText) => {
          setLastScan(decodedText);
          await stopScanner(instance);
        },
        () => {}
      );
    } catch {
      try {
        await instance.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: 240 },
          async (decodedText) => {
            setLastScan(decodedText);
            await stopScanner(instance);
          },
          () => {}
        );
      } catch (scanErr) {
        setScanning(false);
        setError(scanErr?.message || 'Failed to access back camera');
      }
    }
  };

  const handleConfirmOrder = async () => {
    if (!orderId) {
      setError('QR code does not contain order id');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const res = await ordersApi.mobileUpdateStatus(orderId, { status: 'RECEIVED_BY_CUSTOMER' });
      const updated = res.data?.data || res.data;
      setResult(updated || { id: orderId, status: 'RECEIVED_BY_CUSTOMER' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to confirm order');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <Card>
        <h1 className="text-xl font-bold mb-2">Confirm Order</h1>
        <p className="text-sm text-text-secondary mb-4">
          Scan customer QR code to identify order.
        </p>
        <Button size="full" icon={ScanLine} loading={scanning} onClick={handleScanOrder}>
          Scan Order
        </Button>
      </Card>

      <Card>
        <div id={SCANNER_ELEMENT_ID} className="min-h-[260px] rounded-xl overflow-hidden bg-surface-secondary" />
      </Card>

      {lastScan ? (
        <Card>
          <p className="text-xs text-text-secondary mb-1">Scanned value</p>
          <p className="text-sm font-medium break-all">{lastScan}</p>
          <p className="text-sm mt-2">
            Order ID: <span className="font-semibold">{orderId || 'Not found'}</span>
          </p>
          <div className="mt-3">
            <Button size="full" icon={CheckCircle2} loading={busy} onClick={handleConfirmOrder}>
              Confirm This Order
            </Button>
          </div>
        </Card>
      ) : null}

      {result ? (
        <Card>
          <p className="text-sm font-medium mb-2">Order confirmed</p>
          <div className="flex items-center justify-between">
            <span className="text-sm">Order #{result.id || orderId}</span>
            <StatusBadge status={result.status_name || result.status || 'RECEIVED_BY_CUSTOMER'} />
          </div>
        </Card>
      ) : null}

      {error ? (
        <Card className="bg-danger-50 border border-danger-200">
          <p className="text-sm text-danger-700">{error}</p>
        </Card>
      ) : null}
    </div>
  );
}
