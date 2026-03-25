import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import Meta from "../../components/ui/Meta";
import { useAuth } from "../../contexts/AuthContext";

const SignupPage = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [values, setValues] = useState({ name: "", email: "", password: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const validateForm = () => {
    if (!values.name.trim()) {
      return "Name is required";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim().toLowerCase())) {
      return "Please enter a valid email address";
    }

    if (values.password.length < 6) {
      return "Password must be at least 6 characters long";
    }

    return "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      await signup({
        ...values,
        name: values.name.trim(),
        email: values.email.trim().toLowerCase(),
        phone: values.phone.trim()
      });
      navigate("/dashboard");
    } catch (apiError) {
      setError(apiError?.response?.data?.details?.[0]?.msg || apiError?.response?.data?.message || "Signup failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="section-shell py-12">
      <Meta title="Create account" description="Create a Luxeva customer account." />
      <div className="mx-auto max-w-lg">
        <form onSubmit={handleSubmit} className="glass rounded-[2rem] p-8 shadow-soft">
          <p className="eyebrow">Join Luxeva</p>
          <h1 className="mt-3 font-display text-5xl">Create account</h1>
          <div className="mt-8 space-y-4">
            {["name", "email", "phone", "password"].map((field) => (
              <input
                key={field}
                value={values[field]}
                onChange={(e) =>
                  setValues((s) => ({
                    ...s,
                    [field]: field === "email" ? e.target.value.toLowerCase() : e.target.value
                  }))
                }
                type={field === "password" ? "password" : field === "email" ? "email" : "text"}
                placeholder={field}
                autoCapitalize={field === "email" ? "none" : "words"}
                spellCheck={field === "email" ? "false" : "true"}
                className={`w-full rounded-2xl border bg-transparent px-4 py-3 text-sm outline-none dark:border-white/10 ${
                  field === "email"
                    ? "border-ink/10 lowercase dark:border-white/10"
                    : "border-ink/10 capitalize dark:border-white/10"
                }`}
              />
            ))}
          </div>
          {error ? <p className="mt-4 text-sm text-[#b42318] dark:text-[#ff8a80]">{error}</p> : null}
          <p className="mt-4 text-sm">Already have an account? <Link to="/login" className="text-olive">Login</Link></p>
          <button type="submit" disabled={submitting} className="mt-8 w-full rounded-full bg-ink px-6 py-4 text-sm font-semibold text-white">
            {submitting ? "Creating..." : "Create account"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default SignupPage;
