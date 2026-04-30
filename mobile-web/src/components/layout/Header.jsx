import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Bell, LogOut } from 'lucide-react';

export default function Header() {
  const { user, logout } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  return (
    <header className="sticky top-0 z-40 bg-surface/86 backdrop-blur-xl border-b border-border/70 shadow-[0_10px_30px_-28px_rgba(15,23,42,0.75)] safe-top">
      <div className="flex items-center justify-between px-4 py-3.5">
        {/* User info */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full bg-gradient-to-b from-primary-500 to-primary-700 shadow-[0_10px_18px_-12px_rgba(37,99,235,0.9)] flex items-center justify-center cursor-pointer active:scale-95 transition-transform"
          >
            <span className="text-xs font-semibold text-white">{initials}</span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold tracking-[0.01em] text-text-primary truncate">
              {user?.name || t('common.user')}
            </p>
            <p className="text-xs text-text-tertiary capitalize">
              {user?.role_name || user?.role || t('common.member')}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => navigate('/notifications')}
            className="p-2 rounded-xl hover:bg-surface-tertiary transition-colors relative"
            aria-label={t('header.notifications')}
            title={t('header.notifications')}
          >
            <Bell className="w-5 h-5 text-text-secondary" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full ring-2 ring-surface" />
          </button>
          <button
            onClick={logout}
            className="p-2 rounded-xl hover:bg-surface-tertiary transition-colors"
            aria-label={t('header.logout')}
            title={t('header.logout')}
          >
            <LogOut className="w-5 h-5 text-text-secondary" />
          </button>
        </div>
      </div>
    </header>
  );
}
