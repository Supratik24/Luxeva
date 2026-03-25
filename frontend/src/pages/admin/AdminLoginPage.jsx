import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Meta from "../../components/ui/Meta";
import { useAuth } from "../../contexts/AuthContext";

const AdminLoginPage = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [values, setValues] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await login(values, true);
      navigate("/portal/admin");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="flex min-h-screen items-center justify-center bg-[#f6efe6] p-4 dark:bg-[#0d0d0d]">
      <Meta title="Admin login" description="Private admin sign in." />
      <form onSubmit={handleSubmit} className="glass w-full max-w-md rounded-[2rem] p-8 shadow-soft">
        <p className="eyebrow">Private route</p>
        <h1 className="mt-3 font-display text-5xl">Admin login</h1>
        <div className="mt-8 space-y-4">
          <input value={values.email} onChange={(e) => setValues((s) => ({ ...s, email: e.target.value }))} type="email" placeholder="Admin email" className="w-full rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10" />
          <input value={values.password} onChange={(e) => setValues((s) => ({ ...s, password: e.target.value }))} type="password" placeholder="Password" className="w-full rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10" />
        </div>
        <button type="submit" disabled={submitting} className="mt-8 w-full rounded-full bg-ink px-6 py-4 text-sm font-semibold text-white">
          {submitting ? "Authenticating..." : "Enter admin portal"}
        </button>
      </form>
    </section>
  );
};

export default AdminLoginPage;

