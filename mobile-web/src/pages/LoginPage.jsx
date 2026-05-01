import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { getApiErrorMessage } from '../services/api';
import { Lock, User, Package } from 'lucide-react';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, t('login.invalidCredentials')));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-dvh flex flex-col justify-center px-6 py-12 bg-surface">
      {/* Logo & Title */}
      <div className="text-center mb-10">
        <div className="w-16 h-16 rounded-2xl bg-primary-600 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-primary-200">
          <Package className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-2xl font-bold text-text-primary">DMS Mobile</h1>
        <p className="text-sm text-text-secondary mt-1">{t('login.subtitle')}</p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 max-w-sm mx-auto w-full">
        <Input
          label={t('login.username')}
          icon={User}
          placeholder={t('login.usernamePlaceholder')}
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          required
        />
        <Input
          label={t('login.password')}
          icon={Lock}
          type="password"
          placeholder={t('login.passwordPlaceholder')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        {error && (
          <div className="bg-danger-50 border border-danger-200 rounded-xl px-4 py-3">
            <p className="text-sm text-danger-600">{error}</p>
          </div>
        )}

        <Button type="submit" size="full" loading={loading}>
          {t('login.signIn')}
        </Button>
      </form>

      <p className="text-center text-xs text-text-tertiary mt-8">
        v1.0.0 &middot; Powered by DMS
      </p>
    </div>
  );
}
