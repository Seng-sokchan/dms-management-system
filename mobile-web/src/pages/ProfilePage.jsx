import { useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  User, Mail, Shield, LogOut,
  Globe, Bell, HelpCircle, Info
} from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';

function LanguageSwipeSwitch({ language, setLanguage, t }) {
  const startXRef = useRef(null);
  const SWIPE_THRESHOLD = 24;
  const isKhmer = language === 'km';

  const onPointerDown = (event) => {
    startXRef.current = event.clientX;
  };

  const onPointerUp = (event) => {
    if (startXRef.current === null) return;
    const deltaX = event.clientX - startXRef.current;
    startXRef.current = null;

    if (Math.abs(deltaX) < SWIPE_THRESHOLD) return;
    if (deltaX > 0) setLanguage('km');
    if (deltaX < 0) setLanguage('en');
  };

  return (
    <button
      type="button"
      onClick={() => setLanguage(isKhmer ? 'en' : 'km')}
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      className="relative w-[120px] h-9 rounded-full border border-primary-200/70 bg-gradient-to-r from-primary-50 to-indigo-50 p-1 shadow-[0_8px_18px_-14px_rgba(37,99,235,0.45)] select-none"
      aria-label={t('common.language')}
      title={t('common.language')}
    >
      <span
        className={`absolute top-1 h-7 w-[56px] rounded-full bg-white border border-primary-100 shadow-[0_10px_20px_-16px_rgba(15,23,42,0.8)] transition-transform duration-200 ${isKhmer ? 'translate-x-[58px]' : 'translate-x-0'}`}
      />
      <span className="relative z-10 flex items-center justify-between h-full px-2 text-[11px] font-semibold">
        <span className={isKhmer ? 'text-text-tertiary' : 'text-primary-700'}>EN</span>
        <span className={isKhmer ? 'text-primary-700' : 'text-text-tertiary'}>{t('common.khmer')}</span>
      </span>
    </button>
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const initials = user?.name
    ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : 'U';

  const menuItems = [
    { icon: Bell, label: t('profile.notifications'), desc: t('profile.manageAlerts') },
    {
      type: 'language',
      icon: Globe,
      label: t('common.language'),
      desc: language === 'en' ? `${t('common.english')} / ${t('common.khmer')}` : `${t('common.khmer')} / ${t('common.english')}`,
    },
    { icon: HelpCircle, label: t('profile.helpSupport'), desc: t('profile.getAssistance') },
    { icon: Info, label: t('profile.about'), desc: t('profile.version') },
  ];

  return (
    <div className="p-4 space-y-4">
      {/* Profile Card */}
      <Card className="flex flex-col items-center py-8">
        <div className="w-20 h-20 rounded-full bg-primary-600 flex items-center justify-center mb-3">
          <span className="text-2xl font-bold text-white">{initials}</span>
        </div>
        <h2 className="text-lg font-bold">{user?.name || t('common.user')}</h2>
        <p className="text-sm text-text-secondary capitalize">{user?.role_name || user?.role || t('common.member')}</p>
        {user?.email && (
          <p className="text-xs text-text-tertiary mt-1 flex items-center gap-1">
            <Mail className="w-3 h-3" /> {user.email}
          </p>
        )}
      </Card>

      {/* Account Info */}
      <Card padding={false}>
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">{t('profile.account')}</p>
        </div>
        <div className="divide-y divide-border">
          <div className="flex items-center gap-3 px-4 py-3.5">
            <User className="w-4.5 h-4.5 text-text-tertiary" />
            <div className="flex-1">
              <p className="text-sm">{t('profile.username')}</p>
            </div>
            <span className="text-sm text-text-secondary">{user?.username || '—'}</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-3.5">
            <Shield className="w-4.5 h-4.5 text-text-tertiary" />
            <div className="flex-1">
              <p className="text-sm">{t('profile.role')}</p>
            </div>
            <span className="text-sm text-text-secondary capitalize">{user?.role_name || user?.role || '—'}</span>
          </div>
        </div>
      </Card>

      {/* Settings Menu */}
      <Card padding={false}>
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">{t('profile.settings')}</p>
        </div>
        <div className="divide-y divide-border">
          {menuItems.map(({ type, icon: Icon, label, desc }) => (
            <div
              key={label}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
            >
              <Icon className="w-4.5 h-4.5 text-text-tertiary" />
              <div className="flex-1">
                <p className="text-sm">{label}</p>
                <p className="text-xs text-text-tertiary">{desc}</p>
              </div>
              {type === 'language' ? (
                <LanguageSwipeSwitch language={language} setLanguage={setLanguage} t={t} />
              ) : null}
            </div>
          ))}
        </div>
      </Card>

      {/* Logout */}
      <Button
        variant="danger"
        size="full"
        icon={LogOut}
        onClick={logout}
      >
        {t('profile.signOut')}
      </Button>
    </div>
  );
}
