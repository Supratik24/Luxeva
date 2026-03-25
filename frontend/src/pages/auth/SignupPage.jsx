import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import Meta from "../../components/ui/Meta";
import { useAuth } from "../../contexts/AuthContext";

const SignupPage = () => {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [values, setValues] = useState({ name: "", email: "", password: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    try {
      await signup(values);
      navigate("/dashboard");
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
                onChange={(e) => setValues((s) => ({ ...s, [field]: e.target.value }))}
                type={field === "password" ? "password" : field === "email" ? "email" : "text"}
                placeholder={field}
                className="w-full rounded-2xl border border-ink/10 bg-transparent px-4 py-3 text-sm capitalize outline-none dark:border-white/10"
              />
            ))}
          </div>
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

