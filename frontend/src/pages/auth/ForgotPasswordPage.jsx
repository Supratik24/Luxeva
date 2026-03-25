import { useState } from "react";
import Meta from "../../components/ui/Meta";
import api, { endpoints } from "../../services/api";

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [resetToken, setResetToken] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    const { data } = await api.post(endpoints.auth.forgotPassword, { email });
    setResetToken(data.resetToken || "");
  };

  return (
    <section className="section-shell py-12">
      <Meta title="Forgot password" description="Request a password reset." />
      <div className="mx-auto max-w-lg">
        <form onSubmit={handleSubmit} className="glass rounded-[2rem] p-8 shadow-soft">
          <p className="eyebrow">Account support</p>
          <h1 className="mt-3 font-display text-5xl">Reset password</h1>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="Email" className="mt-8 w-full rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10" />
          <button type="submit" className="mt-6 w-full rounded-full bg-ink px-6 py-4 text-sm font-semibold text-white">
            Send reset link
          </button>
          {resetToken ? <p className="mt-4 text-sm text-olive">Dev reset token: {resetToken}</p> : null}
        </form>
      </div>
    </section>
  );
};

export default ForgotPasswordPage;

