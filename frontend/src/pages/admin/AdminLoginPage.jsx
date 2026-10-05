import { useState } from 'react';
import { useSignIn } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';
import Meta from '../../components/ui/Meta';
import { toast } from 'react-hot-toast';

const AdminLoginPage = () => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;
    
    setLoading(true);
    try {
      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        navigate('/portal/admin');
      } else {
        toast.error('Additional verification required in Clerk');
      }
    } catch (err) {
      toast.error(err.errors?.[0]?.message || 'Invalid email or password. (Make sure passwords are enabled in Clerk)');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-[#f6efe6] p-4 dark:bg-[#0d0d0d]">
      <Meta title="Admin login" description="Private admin sign in." />
      
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-[#1a1a1a] dark:shadow-none border border-ink/5 dark:border-white/5">
        <div className="bg-ink p-8 text-white dark:bg-white/5">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <h1 className="font-display text-4xl mb-2">Admin Portal</h1>
          <p className="text-white/60">Sign in with your administrator credentials</p>
        </div>

        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="mb-2 block text-sm font-semibold text-ink dark:text-white">Email address</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Mail size={18} className="text-ink/40 dark:text-white/40" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-ink/10 bg-transparent py-3 pl-11 pr-4 text-ink outline-none transition focus:border-ink dark:border-white/10 dark:text-white dark:focus:border-white"
                  placeholder="admin@luxeva.com"
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-semibold text-ink dark:text-white">Password</label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                  <Lock size={18} className="text-ink/40 dark:text-white/40" />
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-ink/10 bg-transparent py-3 pl-11 pr-4 text-ink outline-none transition focus:border-ink dark:border-white/10 dark:text-white dark:focus:border-white"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading || !isLoaded}
              className="group mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-4 font-semibold text-white transition hover:bg-ink/90 disabled:opacity-70 dark:bg-white dark:text-ink dark:hover:bg-white/90"
            >
              {loading ? 'Authenticating...' : 'Sign In to Portal'}
              {!loading && <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default AdminLoginPage;
