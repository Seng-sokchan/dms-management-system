import { NavLink } from 'react-router-dom';
import {
  ShoppingCart, ClipboardList, CheckCircle2, Truck, ScanLine, DollarSign, User
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';

const customerNavItems = [
  { to: '/customer-orders', icon: ShoppingCart, labelKey: 'nav.customerOrders' },
  { to: '/confirm-order', icon: ScanLine, labelKey: 'nav.confirmOrder' },
  { to: '/payments', icon: DollarSign, labelKey: 'nav.payments' },
  { to: '/profile', icon: User, labelKey: 'nav.profile' },
];

const defaultNavItems = [
  { to: '/customer-orders', icon: ShoppingCart, labelKey: 'nav.customerOrders' },
  { to: '/owner-preparing', icon: ClipboardList, labelKey: 'nav.ownerPreparing' },
  { to: '/logistics-supplier', icon: CheckCircle2, labelKey: 'nav.logisticsSupplier' },
  { to: '/delivery', icon: Truck, labelKey: 'nav.delivery' },
  { to: '/payments', icon: DollarSign, labelKey: 'nav.payments' },
  { to: '/profile', icon: User, labelKey: 'nav.profile' },
];

const ownerNavItems = [
  { to: '/owner-preparing', icon: ClipboardList, labelKey: 'nav.ownerPreparing' },
  { to: '/profile', icon: User, labelKey: 'nav.profile' },
];

const logisticsNavItems = [
  { to: '/logistics-supplier', icon: CheckCircle2, labelKey: 'nav.logisticsSupplier' },
  { to: '/profile', icon: User, labelKey: 'nav.profile' },
];

const deliveryNavItems = [
  { to: '/delivery', icon: Truck, labelKey: 'nav.delivery' },
  { to: '/profile', icon: User, labelKey: 'nav.profile' },
];

export default function BottomNav() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const roleName = String(user?.role_name || user?.role || '').toLowerCase();

  let navItems = defaultNavItems;
  if (roleName === 'admin') {
    navItems = defaultNavItems; // Admin can see all menus.
  } else if (roleName === 'customer') {
    navItems = customerNavItems;
  } else if (roleName === 'owner') {
    navItems = ownerNavItems;
  } else if (roleName === 'logistics') {
    navItems = logisticsNavItems;
  } else if (roleName === 'delivery') {
    navItems = deliveryNavItems;
  }

  return (
    <>
      {/* Bottom Nav Bar */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-surface/90 backdrop-blur-xl border-t border-border/75 shadow-[0_-14px_34px_-26px_rgba(15,23,42,0.55)] safe-bottom">
        <div className="flex items-center justify-around px-2.5 pt-2.5 pb-1 max-w-[460px] mx-auto">
          {navItems.map(({ to, icon: Icon, labelKey }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) => clsx(
                'flex flex-col items-center gap-0.5 px-2.5 py-1.5 rounded-xl transition-colors min-w-[56px]',
                isActive ? 'text-primary-600' : 'text-text-tertiary hover:text-text-secondary'
              )}
            >
              {({ isActive }) => (
                <>
                  <div className={clsx('p-1 rounded-lg transition-colors', isActive && 'bg-primary-50 shadow-[0_8px_18px_-14px_rgba(37,99,235,0.8)]')}>
                    <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.8} />
                  </div>
                  <span className="text-[10px] font-semibold tracking-[0.01em]">{t(labelKey)}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </>
  );
}
