import { ClerkProvider } from "@clerk/clerk-react";
import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import App from "./app/App";
import ErrorBoundary from "./components/common/ErrorBoundary";
import { AuthProvider } from "./contexts/AuthContext";
import { ShopProvider } from "./contexts/ShopContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import "./styles/index.css";

const clerkPublishableKey =
  import.meta.env.VITE_CLERK_PUBLISHABLE_KEY ||
  "pk_test_cmVuZXdlZC1uYXJ3aGFsLTQxMDUuY2xlcmsuYWNjb3VudHMuZGV2JA";

if (!clerkPublishableKey) {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <div className="min-h-screen flex items-center justify-center bg-[#111] text-white p-6 font-sans">
      <div className="max-w-md w-full bg-[#1e1e1e] p-8 rounded-3xl border border-white/10 text-center space-y-4 shadow-2xl">
        <h2 className="text-xl font-bold text-amber-400">Configuration Required</h2>
        <p className="text-sm text-white/70 leading-relaxed">
          Missing <code className="bg-black/40 px-2 py-1 rounded text-amber-300">VITE_CLERK_PUBLISHABLE_KEY</code>.
          Please add this key in your Vercel Project Settings &gt; Environment Variables and redeploy.
        </p>
      </div>
    </div>
  );
} else {
  ReactDOM.createRoot(document.getElementById("root")).render(
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <BrowserRouter>
        <ThemeProvider>
          <AuthProvider>
            <ShopProvider>
              <ErrorBoundary>
                <App />
                <Toaster
                  position="top-right"
                  toastOptions={{
                    style: {
                      borderRadius: "999px",
                      padding: "14px 18px",
                      background: "#171717",
                      color: "#fff"
                    }
                  }}
                />
              </ErrorBoundary>
            </ShopProvider>
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ClerkProvider>
  );
}
