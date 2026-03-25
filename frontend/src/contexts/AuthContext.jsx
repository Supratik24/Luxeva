import { createContext, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api, { endpoints } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("luxeva_token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

  const getApiErrorMessage = (error, fallback) =>
    error?.response?.data?.details?.[0]?.msg || error?.response?.data?.message || fallback;

  const fetchProfile = async () => {
    if (!localStorage.getItem("luxeva_token")) {
      setLoading(false);
      return;
    }

    try {
      const { data } = await api.get(endpoints.auth.me);
      setUser(data.user);
    } catch (error) {
      localStorage.removeItem("luxeva_token");
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const persistSession = (payload) => {
    localStorage.setItem("luxeva_token", payload.token);
    setToken(payload.token);
    setUser(payload.user);
  };

  const login = async (values, admin = false) => {
    try {
      const payload = {
        ...values,
        email: String(values.email || "").trim().toLowerCase()
      };
      const { data } = await api.post(admin ? endpoints.auth.adminLogin : endpoints.auth.login, payload);
      persistSession(data);
      toast.success(admin ? "Admin access granted" : "Welcome back");
      return data;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Login failed"));
      throw error;
    }
  };

  const signup = async (values) => {
    try {
      const payload = {
        ...values,
        name: String(values.name || "").trim(),
        email: String(values.email || "").trim().toLowerCase(),
        phone: String(values.phone || "").trim()
      };
      const { data } = await api.post(endpoints.auth.signup, payload);
      toast.success(`Signup OTP sent to ${data.maskedPhone}`);
      return data;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Signup failed"));
      throw error;
    }
  };

  const verifySignupOtp = async (values) => {
    try {
      const payload = {
        email: String(values.email || "").trim().toLowerCase(),
        otp: String(values.otp || "").trim()
      };
      const { data } = await api.post(endpoints.auth.verifySignupOtp, payload);
      persistSession(data);
      toast.success("Account verified");
      return data;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "OTP verification failed"));
      throw error;
    }
  };

  const googleLogin = async (credential) => {
    try {
      const { data } = await api.post(endpoints.auth.google, { credential });
      persistSession(data);
      toast.success("Signed in with Google");
      return data;
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Google sign-in failed"));
      throw error;
    }
  };

  const logout = async () => {
    try {
      await api.post(endpoints.auth.logout);
    } catch (error) {
      // Ignore network logout errors and clear the client session.
    } finally {
      localStorage.removeItem("luxeva_token");
      setToken(null);
      setUser(null);
      toast.success("Signed out");
    }
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      isAuthenticated: Boolean(token && user),
      isAdmin: user?.role === "admin",
      login,
      googleLogin,
      signup,
      verifySignupOtp,
      logout,
      refreshProfile: fetchProfile,
      setUser
    }),
    [loading, token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
