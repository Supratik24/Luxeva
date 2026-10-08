import { useState } from 'react';
import { useSignIn } from '@clerk/clerk-react';
import { useNavigate } from 'react-router-dom';
import { Lock, Mail, ArrowRight, ShieldCheck, KeyRound } from 'lucide-react';
import Meta from '../../components/ui/Meta';
import { toast } from 'react-hot-toast';

const AdminLoginPage = () => {
  const { isLoaded, signIn, setActive } = useSignIn();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;
    
    setLoading(true);
    try {
      let result;
      // If the user didn't enter a password, jump straight to OTP
      if (!password) {
        result = await signIn.create({
          identifier: email,
          strategy: 'email_code',
        });
      } else {
        // Try password first
        result = await signIn.create({
          identifier: email,
          password,
        });
      }

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        navigate('/portal/admin');
      } else if (result.status === 'needs_second_factor' || result.status === 'needs_first_factor') {
        setPendingVerification(true);
        toast.success(password ? "Verification required. Check your email." : "OTP code sent to your email!");
      }
    } catch (err) {
      const errCode = err.errors?.[0]?.code;
      // If passwords are not enabled, automatically fallback to sending an OTP
      if (errCode === 'strategy_for_user_invalid') {
        try {
          await signIn.create({
            identifier: email,
            strategy: 'email_code',
          });
          setPendingVerification(true);
          toast.success("Password login disabled. OTP code sent to your email instead!");
        } catch (otpErr) {
          toast.error(otpErr.errors?.[0]?.message || 'Failed to send OTP');
        }
      } else {
        toast.error(err.errors?.[0]?.message || 'Invalid email or password.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!isLoaded) return;
    
    setLoading(true);
    try {
      let result;
      if (signIn.status === 'needs_second_factor') {
        result = await signIn.attemptSecondFactor({ strategy: 'email_code', code });
      } else {
        result = await signIn.attemptFirstFactor({ strategy: 'email_code', code });
      }

      if (result.status === 'complete') {
        await setActive({ session: result.createdSessionId });
        toast.success("Admin authenticated successfully!");
        navigate('/portal/admin');
      } else {
        toast.error("OTP accepted, but further verification required.");
      }
    } catch (err) {
      toast.error(err.errors?.[0]?.message || 'Invalid OTP code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-[#f6efe6] p-4 dark:bg-[#0D0F14]">
      <Meta title="Admin login" description="Private admin sign in." />
      
      <div className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl dark:bg-[#1E2028] dark:shadow-none border border-ink/5 dark:border-white/10">
        <div className="bg-ink p-8 text-white dark:bg-white dark:text-ink">
          <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <h1 className="font-display text-4xl mb-2">Admin Portal</h1>
          <p className="text-white/75">
            {pendingVerification ? "Enter the OTP sent to your email" : "Sign in with your administrator credentials"}
          </p>
        </div>

        <div className="p-8">
          {!pendingVerification ? (
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
                    placeholder="supratiksangram9@gmail.com"
                  />
                </div>
              </div>

              <div>
                <label className="mb-2 block text-sm font-semibold text-ink dark:text-white">Password (optional)</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <Lock size={18} className="text-ink/40 dark:text-white/40" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-ink/10 bg-transparent py-3 pl-11 pr-4 text-ink outline-none transition focus:border-ink dark:border-white/10 dark:text-white dark:focus:border-white"
                    placeholder="Leave blank for OTP"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !isLoaded}
                className="group mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-4 font-semibold text-white dark:text-ink transition hover:bg-ink/90 disabled:opacity-70 dark:bg-white dark:hover:bg-white/90"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
                {!loading && <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />}
              </button>
            </form>
          ) : (
            <form onSubmit={handleVerify} className="space-y-5">
              <div>
                <label className="mb-2 block text-sm font-semibold text-ink dark:text-white">OTP Code</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                    <KeyRound size={18} className="text-ink/40 dark:text-white/40" />
                  </div>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full rounded-2xl border border-ink/10 bg-transparent py-3 pl-11 pr-4 text-ink outline-none transition focus:border-ink dark:border-white/10 dark:text-white dark:focus:border-white"
                    placeholder="123456"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || !isLoaded}
                className="group mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-ink py-4 font-semibold text-white dark:text-ink transition hover:bg-ink/90 disabled:opacity-70 dark:bg-white dark:hover:bg-white/90"
              >
                {loading ? 'Verifying...' : 'Verify OTP'}
                {!loading && <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />}
              </button>
              
              <button
                type="button"
                onClick={() => setPendingVerification(false)}
                className="mt-4 w-full text-sm font-medium text-ink/60 hover:text-ink dark:text-white/60 dark:hover:text-white"
              >
                Go back
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default AdminLoginPage;
