import { useState } from 'react';
import { Link, useRouter } from '@/lib/router';
import { useAuth } from '@/lib/auth';
import { useToast } from '@/lib/toast';
import { ArrowRight, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export function AuthPage({ mode }: { mode: 'login' | 'signup' }) {
  const { signIn, signUp } = useAuth();
  const { navigate } = useRouter();
  const { show } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === 'login') {
        const { error } = await signIn(email, password);
        if (error) { show(error, 'error'); return; }
        show('Welcome back!');
        navigate('/account');
      } else {
        const { error } = await signUp(email, password, fullName);
        if (error) { show(error, 'error'); return; }
        show('Account created — welcome to Maison!');
        navigate('/account');
      }
    } catch (e) {
      show(e instanceof Error ? e.message : 'Something went wrong', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (type: 'admin' | 'customer') => {
    if (type === 'admin') { setEmail('admin@maison.test'); setPassword('maison123'); }
    else { setEmail('customer@maison.test'); setPassword('maison123'); }
  };

  return (
    <div className="min-h-[calc(100vh-200px)] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="font-display text-3xl font-semibold text-ink-900">Maison</Link>
          <h1 className="font-display text-2xl font-medium text-ink-900 mt-6">
            {mode === 'login' ? 'Welcome back' : 'Create your account'}
          </h1>
          <p className="text-sm text-ink-500 mt-2">
            {mode === 'login' ? 'Sign in to your account to continue' : 'Join the Maison circle for early access and offers'}
          </p>
        </div>

        <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-soft">
          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="label">Full Name</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                  <input required value={fullName} onChange={e => setFullName(e.target.value)} className="input pl-10" placeholder="Jane Doe" />
                </div>
              </div>
            )}
            <div>
              <label className="label">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="input pl-10" placeholder="jane@email.com" />
              </div>
            </div>
            <div>
              <label className="label">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                  minLength={6}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-800" aria-label="Toggle password">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full disabled:opacity-50">
              {loading ? 'Please wait...' : <>{mode === 'login' ? 'Sign In' : 'Create Account'} <ArrowRight size={16} /></>}
            </button>
          </form>

          <div className="mt-4 text-center text-sm text-ink-500">
            {mode === 'login' ? (
              <>Don't have an account? <Link to="/signup" className="font-medium text-clay-600 hover:underline">Sign up</Link></>
            ) : (
              <>Already have an account? <Link to="/login" className="font-medium text-clay-600 hover:underline">Sign in</Link></>
            )}
          </div>
        </div>

        {/* Demo credentials */}
        {mode === 'login' && (
          <div className="mt-4 rounded-xl bg-cream-100 p-4 text-center">
            <p className="text-xs text-ink-500 mb-2">Try demo accounts:</p>
            <div className="flex gap-2 justify-center">
              <button onClick={() => fillDemo('customer')} className="rounded-lg bg-white border border-cream-300 px-3 py-1.5 text-xs text-ink-700 hover:border-ink-300 transition-colors">
                Customer
              </button>
              <button onClick={() => fillDemo('admin')} className="rounded-lg bg-white border border-cream-300 px-3 py-1.5 text-xs text-ink-700 hover:border-ink-300 transition-colors">
                Admin
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
