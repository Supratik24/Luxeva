import { SignIn, SignedIn, SignedOut } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import Meta from "../../components/ui/Meta";

const LoginPage = () => (
  <section className="flex min-h-screen items-center justify-center bg-[#f6efe6] p-4 dark:bg-[#0d0d0d]">
    <Meta title="Login" description="Sign in to your Luxeva account." />
    <SignedIn>
      <Navigate to="/dashboard" replace />
    </SignedIn>
    <SignedOut>
      <SignIn
        routing="path"
        path="/login"
        signUpUrl="/signup"
        forceRedirectUrl="/dashboard"
      />
    </SignedOut>
  </section>
);

export default LoginPage;
