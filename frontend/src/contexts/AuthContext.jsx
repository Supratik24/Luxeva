import { createContext, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api, { endpoints } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem("luxeva_token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(token));

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
    const { data } = await api.post(admin ? endpoints.auth.adminLogin : endpoints.auth.login, values);
    persistSession(data);
    toast.success(admin ? "Admin access granted" : "Welcome back");
    return data;
  };

  const signup = async (values) => {
    const { data } = await api.post(endpoints.auth.signup, values);
    persistSession(data);
    toast.success("Account created");
    return data;
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
      signup,
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

