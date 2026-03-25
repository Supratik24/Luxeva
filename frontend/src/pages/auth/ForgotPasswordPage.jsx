import { useNavigate } from "react-router-dom";
import { useState } from "react";
import toast from "react-hot-toast";
import Meta from "../../components/ui/Meta";
import api, { endpoints } from "../../services/api";
import { normalizeEmail, validateEmail } from "../../utils/authValidation";

const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!validateEmail(email)) {
      setError("Please enter a valid email address");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const normalizedEmail = normalizeEmail(email);
      const { data } = await api.post(endpoints.auth.forgotPassword, { email: normalizedEmail });
      toast.success(`OTP sent to phone ending ${data.maskedPhone}`);
      navigate(`/reset-password?email=${encodeURIComponent(normalizedEmail)}`);
    } catch (apiError) {
      setError(apiError?.response?.data?.message || "Failed to send reset OTP");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section-shell py-12">
      <Meta title="Forgot password" description="Request a password reset." />
      <div className="mx-auto max-w-lg">
        <form onSubmit={handleSubmit} className="glass rounded-[2rem] p-8 shadow-soft">
          <p className="eyebrow">Account support</p>
          <h1 className="mt-3 font-display text-5xl">Reset password</h1>
          <p className="mt-4 text-sm text-ink/65 dark:text-white/65">
            Enter your email and we will send a reset OTP to the phone number saved on that account.
          </p>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value.toLowerCase())}
            type="email"
            placeholder="Email"
            autoCapitalize="none"
            spellCheck="false"
            className="mt-8 w-full rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm lowercase outline-none dark:border-white/10"
          />
          {error ? <p className="mt-3 text-sm text-[#b42318] dark:text-[#ff8a80]">{error}</p> : null}
          <button type="submit" disabled={submitting} className="mt-6 w-full rounded-full bg-ink px-6 py-4 text-sm font-semibold text-white">
            {submitting ? "Sending OTP..." : "Send reset OTP"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default ForgotPasswordPage;
