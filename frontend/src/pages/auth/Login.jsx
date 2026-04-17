import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLang } from '../../contexts/LangContext';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

export default function Login() {
  const { login } = useAuth();
  const { t } = useLang();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const user = await login(email, password);
      const redirect = params.get('redirect');
      if (redirect) navigate(redirect);
      else if (user.role === 'admin') navigate('/admin/dashboard');
      else if (user.role === 'vendor') navigate('/vendor/dashboard');
      else if (user.role === 'employee') navigate('/employee/claims');
      else navigate('/client/dashboard');
    } catch (err) {
      const d = err.response?.data?.detail;
      setError(typeof d === 'string' ? d : Array.isArray(d) ? d.map(e => e.msg).join(', ') : 'Erreur de connexion');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-20 pb-10" data-testid="login-page">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <img src="/logo.png" alt="Washop" className="h-16 w-16 rounded-xl mx-auto mb-4 object-cover" />
          <h1 className="text-2xl font-bold">{t.auth.login_title}</h1>
        </div>
        <form onSubmit={handleSubmit} className="glass p-6 space-y-4">
          {error && <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm" data-testid="login-error">{error}</div>}
          <div>
            <label className="text-sm text-gray-400 mb-1 block">{t.auth.email}</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required data-testid="login-email" />
          </div>
          <div>
            <label className="text-sm text-gray-400 mb-1 block">{t.auth.password}</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required data-testid="login-password" />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500">{showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full flex items-center justify-center gap-2" data-testid="login-submit">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null} {loading ? t.common.loading : t.auth.login_btn}
          </button>
          <div className="flex justify-between text-sm">
            <Link to="/forgot-password" className="text-[#25D366] hover:underline">{t.auth.forgot}</Link>
          </div>
          <p className="text-center text-sm text-gray-400">{t.auth.no_account} <Link to="/register" className="text-[#25D366] hover:underline font-medium">{t.nav.register}</Link></p>
        </form>
      </div>
    </div>
  );
}
