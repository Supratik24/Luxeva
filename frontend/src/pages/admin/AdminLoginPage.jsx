import { SignIn } from "@clerk/clerk-react";
import Meta from "../../components/ui/Meta";

const AdminLoginPage = () => {
  return (
    <section className="flex min-h-screen items-center justify-center bg-[#f6efe6] p-4 dark:bg-[#0d0d0d]">
      <Meta title="Admin login" description="Private admin sign in." />
      <div className="flex w-full flex-col items-center max-w-md">
        <div className="mb-8 text-center">
          <p className="eyebrow">Private route</p>
          <h1 className="mt-3 font-display text-5xl">Admin login</h1>
        </div>
        <SignIn 
          routing="path" 
          path="/portal/admin/login" 
          fallbackRedirectUrl="/portal/admin" 
        />
      </div>
    </section>
  );
};

export default AdminLoginPage;

