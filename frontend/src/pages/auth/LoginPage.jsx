import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import Meta from "../../components/ui/Meta";
import { useAuth } from "../../contexts/AuthContext";

const LoginPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [values, setValues] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await login(values);
      navigate(location.state?.from?.pathname || "/dashboard");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section-shell py-12">
      <Meta title="Login" description="Sign in to your account." />
      <div className="mx-auto max-w-lg">
        <form onSubmit={handleSubmit} className="glass rounded-[2rem] p-8 shadow-soft">
          <p className="eyebrow">Welcome back</p>
          <h1 className="mt-3 font-display text-5xl">Login</h1>
          <div className="mt-8 space-y-4">
            <input value={values.email} onChange={(e) => setValues((s) => ({ ...s, email: e.target.value }))} type="email" placeholder="Email" className="w-full rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10" />
            <input value={values.password} onChange={(e) => setValues((s) => ({ ...s, password: e.target.value }))} type="password" placeholder="Password" className="w-full rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10" />
          </div>
          <div className="mt-4 flex items-center justify-between text-sm">
            <Link to="/forgot-password" className="text-olive">Forgot password?</Link>
            <Link to="/signup" className="text-olive">Create account</Link>
          </div>
          <button type="submit" disabled={submitting} className="mt-8 w-full rounded-full bg-ink px-6 py-4 text-sm font-semibold text-white">
            {submitting ? "Signing in..." : "Login"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default LoginPage;

