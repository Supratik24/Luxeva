import { Check, Eye, EyeOff, X } from "lucide-react";
import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import Meta from "../../components/ui/Meta";
import api, { endpoints } from "../../services/api";
import {
  getPasswordError,
  normalizeEmail,
  validateEmail,
  validatePasswordStrength
} from "../../utils/authValidation";

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [values, setValues] = useState({
    email: searchParams.get("email") || "",
    otp: "",
    password: "",
    confirmPassword: ""
  });
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const nextErrors = {};

    if (!validateEmail(values.email)) {
      nextErrors.email = "Please enter a valid email address";
    }

    if (!values.otp.trim() || values.otp.trim().length < 4) {
      nextErrors.otp = "Please enter the OTP sent to your phone";
    }

    const passwordError = getPasswordError(values.password);
    if (passwordError) {
      nextErrors.password = passwordError;
    }

    if (values.confirmPassword !== values.password) {
      nextErrors.confirmPassword = "Passwords do not match";
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateForm();
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) {
      return;
    }

    setSubmitting(true);
    try {
      await api.post(endpoints.auth.resetPasswordOtp, {
        email: normalizeEmail(values.email),
        otp: values.otp.trim(),
        password: values.password
      });
      toast.success("Password updated successfully");
      navigate("/login");
    } catch (apiError) {
      setErrors((current) => ({
        ...current,
        form: apiError?.response?.data?.message || "Failed to reset password"
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const passwordChecks = validatePasswordStrength(values.password);

  return (
    <section className="section-shell py-12">
      <Meta title="Set new password" description="Set a new password for your account." />
      <div className="mx-auto max-w-lg">
        <form onSubmit={handleSubmit} className="glass rounded-[2rem] p-8 shadow-soft">
          <p className="eyebrow">Security</p>
          <h1 className="mt-3 font-display text-5xl">Reset with OTP</h1>
          <div className="mt-8 space-y-4">
            <div>
              <input
                value={values.email}
                onChange={(e) => setValues((s) => ({ ...s, email: e.target.value.toLowerCase() }))}
                type="email"
                placeholder="Email"
                autoCapitalize="none"
                spellCheck="false"
                className="w-full rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm lowercase outline-none dark:border-white/10"
              />
              {errors.email ? <p className="mt-2 text-xs text-[#b42318] dark:text-[#ff8a80]">{errors.email}</p> : null}
            </div>
            <div>
              <input
                value={values.otp}
                onChange={(e) => setValues((s) => ({ ...s, otp: e.target.value }))}
                type="text"
                placeholder="OTP"
                className="w-full rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10"
              />
              {errors.otp ? <p className="mt-2 text-xs text-[#b42318] dark:text-[#ff8a80]">{errors.otp}</p> : null}
            </div>
            <div>
              <div className="relative">
                <input
                  value={values.password}
                  onChange={(e) => setValues((s) => ({ ...s, password: e.target.value }))}
                  type={showPassword ? "text" : "password"}
                  placeholder="New password"
                  className="w-full rounded-2xl border border-ink/10 bg-transparent px-4 py-3 pr-12 text-sm outline-none dark:border-white/10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/50 dark:text-white/60"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password ? <p className="mt-2 text-xs text-[#b42318] dark:text-[#ff8a80]">{errors.password}</p> : null}
              <div className="mt-3 grid gap-2 rounded-[1.25rem] border border-ink/10 p-3 text-xs dark:border-white/10">
                {[
                  ["At least 8 characters", passwordChecks.minLength],
                  ["One uppercase letter", passwordChecks.upper],
                  ["One lowercase letter", passwordChecks.lower],
                  ["One number", passwordChecks.number],
                  ["One special character", passwordChecks.special]
                ].map(([label, passed]) => (
                  <div key={label} className={`flex items-center gap-2 ${passed ? "text-olive" : "text-ink/55 dark:text-white/55"}`}>
                    {passed ? <Check size={14} /> : <X size={14} />}
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <div className="relative">
                <input
                  value={values.confirmPassword}
                  onChange={(e) => setValues((s) => ({ ...s, confirmPassword: e.target.value }))}
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm password"
                  className="w-full rounded-2xl border border-ink/10 bg-transparent px-4 py-3 pr-12 text-sm outline-none dark:border-white/10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((value) => !value)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-ink/50 dark:text-white/60"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.confirmPassword ? (
                <p className="mt-2 text-xs text-[#b42318] dark:text-[#ff8a80]">{errors.confirmPassword}</p>
              ) : null}
            </div>
          </div>
          {errors.form ? <p className="mt-4 text-sm text-[#b42318] dark:text-[#ff8a80]">{errors.form}</p> : null}
          <button type="submit" disabled={submitting} className="mt-6 w-full rounded-full bg-ink px-6 py-4 text-sm font-semibold text-white">
            {submitting ? "Updating..." : "Update password"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default ResetPasswordPage;
