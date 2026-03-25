import { Check, Eye, EyeOff, X } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import GoogleAuthButton from "../../components/common/GoogleAuthButton";
import Meta from "../../components/ui/Meta";
import { useAuth } from "../../contexts/AuthContext";
import {
  getPasswordError,
  normalizeEmail,
  validateEmail,
  validatePasswordStrength,
  validatePhone
} from "../../utils/authValidation";

const SignupPage = () => {
  const navigate = useNavigate();
  const { signup, googleLogin } = useAuth();
  const [values, setValues] = useState({ name: "", email: "", password: "", confirmPassword: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const nextErrors = {};

    if (!values.name.trim()) {
      nextErrors.name = "Name is required";
    }

    if (!validateEmail(values.email)) {
      nextErrors.email = "Please enter a valid email address";
    }

    if (values.phone && !validatePhone(values.phone)) {
      nextErrors.phone = "Please enter a valid phone number";
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
    const validationErrors = validateForm();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length) {
      return;
    }

    setSubmitting(true);
    try {
      await signup({
        ...values,
        name: values.name.trim(),
        email: normalizeEmail(values.email),
        phone: values.phone.trim()
      });
      navigate("/dashboard");
    } catch (apiError) {
      setErrors((current) => ({
        ...current,
        form: apiError?.response?.data?.details?.[0]?.msg || apiError?.response?.data?.message || "Signup failed"
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignup = async (credential) => {
    setSubmitting(true);
    setErrors({});

    try {
      await googleLogin(credential);
      navigate("/dashboard");
    } catch (apiError) {
      setErrors((current) => ({
        ...current,
        form: apiError?.response?.data?.message || "Google sign-up failed"
      }));
    } finally {
      setSubmitting(false);
    }
  };

  const passwordChecks = validatePasswordStrength(values.password);

  return (
    <section className="section-shell py-12">
      <Meta title="Create account" description="Create a Luxeva customer account." />
      <div className="mx-auto max-w-lg">
        <form onSubmit={handleSubmit} className="glass rounded-[2rem] p-8 shadow-soft">
          <p className="eyebrow">Join Luxeva</p>
          <h1 className="mt-3 font-display text-5xl">Create account</h1>
          <div className="mt-8 space-y-4">
            <div>
              <input
                value={values.name}
                onChange={(e) => setValues((s) => ({ ...s, name: e.target.value }))}
                type="text"
                placeholder="Name"
                className="w-full rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm capitalize outline-none dark:border-white/10"
              />
              {errors.name ? <p className="mt-2 text-xs text-[#b42318] dark:text-[#ff8a80]">{errors.name}</p> : null}
            </div>
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
                value={values.phone}
                onChange={(e) => setValues((s) => ({ ...s, phone: e.target.value }))}
                type="tel"
                placeholder="Phone"
                className="w-full rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10"
              />
              {errors.phone ? <p className="mt-2 text-xs text-[#b42318] dark:text-[#ff8a80]">{errors.phone}</p> : null}
            </div>
            <div>
              <div className="relative">
                <input
                  value={values.password}
                  onChange={(e) => setValues((s) => ({ ...s, password: e.target.value }))}
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
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
          <p className="mt-4 text-sm">Already have an account? <Link to="/login" className="text-olive">Login</Link></p>
          <button type="submit" disabled={submitting} className="mt-8 w-full rounded-full bg-ink px-6 py-4 text-sm font-semibold text-white">
            {submitting ? "Creating..." : "Create account"}
          </button>
          <div className="mt-6 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-ink/40 dark:text-white/40">
            <span className="h-px flex-1 bg-ink/10 dark:bg-white/10" />
            <span>Or</span>
            <span className="h-px flex-1 bg-ink/10 dark:bg-white/10" />
          </div>
          <div className="mt-6">
            <GoogleAuthButton text="signup_with" onCredential={handleGoogleSignup} />
          </div>
        </form>
      </div>
    </section>
  );
};

export default SignupPage;
