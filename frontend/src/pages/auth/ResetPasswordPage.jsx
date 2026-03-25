import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Meta from "../../components/ui/Meta";
import api, { endpoints } from "../../services/api";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const [password, setPassword] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    await api.post(endpoints.auth.resetPassword(token), { password });
    navigate("/login");
  };

  return (
    <section className="section-shell py-12">
      <Meta title="Set new password" description="Set a new password for your account." />
      <div className="mx-auto max-w-lg">
        <form onSubmit={handleSubmit} className="glass rounded-[2rem] p-8 shadow-soft">
          <p className="eyebrow">Security</p>
          <h1 className="mt-3 font-display text-5xl">Choose a new password</h1>
          <input value={password} onChange={(e) => setPassword(e.target.value)} type="password" placeholder="New password" className="mt-8 w-full rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10" />
          <button type="submit" className="mt-6 w-full rounded-full bg-ink px-6 py-4 text-sm font-semibold text-white">
            Update password
          </button>
        </form>
      </div>
    </section>
  );
};

export default ResetPasswordPage;
