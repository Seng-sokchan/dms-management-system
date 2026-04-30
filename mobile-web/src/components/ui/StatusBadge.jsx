import { clsx } from 'clsx';

const STATUS_STYLES = {
  NEW_ORDER: { bg: 'bg-primary-50', text: 'text-primary-600', label: 'New' },
  OWNER_PREPARING: { bg: 'bg-warning-50', text: 'text-warning-600', label: 'Preparing' },
  SENT_TO_LOGISTICS_SUPPLIER: { bg: 'bg-purple-50', text: 'text-purple-600', label: 'To Logistics' },
  SUPPLIER_ORDER_READY: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Ready' },
  OUT_FOR_DELIVERY: { bg: 'bg-orange-50', text: 'text-orange-600', label: 'Delivering' },
  RECEIVED_BY_CUSTOMER: { bg: 'bg-success-50', text: 'text-success-600', label: 'Delivered' },
  PAID: { bg: 'bg-success-50', text: 'text-success-600', label: 'Paid' },
  UNPAID: { bg: 'bg-danger-50', text: 'text-danger-600', label: 'Unpaid' },
};

export default function StatusBadge({ status, className }) {
  const style = STATUS_STYLES[status] || { bg: 'bg-gray-100', text: 'text-gray-600', label: status };

  return (
    <span className={clsx(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      style.bg, style.text, className
    )}>
      {style.label}
    </span>
  );
}
