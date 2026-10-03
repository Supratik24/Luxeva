import { SignUp, SignedIn, SignedOut } from "@clerk/clerk-react";
import { Navigate } from "react-router-dom";
import Meta from "../../components/ui/Meta";

const SignupPage = () => {
  return (
    <section className="flex min-h-screen items-center justify-center bg-[#f6efe6] p-4 dark:bg-[#0d0d0d]">
      <Meta title="Create account" description="Create a Luxeva customer account." />
      <SignedIn>
        <Navigate to="/" replace />
      </SignedIn>
      <SignedOut>
        <div className="flex w-full flex-col items-center max-w-md">
          <div className="mb-8 text-center">
            <p className="eyebrow">Join Luxeva</p>
            <h1 className="mt-3 font-display text-5xl">Create account</h1>
          </div>
          <SignUp 
            routing="path" 
            path="/signup" 
            signInUrl="/login" 
            forceRedirectUrl="/" 
          />
        </div>
      </SignedOut>
    </section>
  );
};

export default SignupPage;
