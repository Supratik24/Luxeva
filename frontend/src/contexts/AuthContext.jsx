import { useAuth as useClerkAuth, useClerk, useUser } from "@clerk/clerk-react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import api, { endpoints, setAuthTokenGetter } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { isLoaded, isSignedIn, getToken } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const clerk = useClerk();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAuthTokenGetter(async () => {
      if (!isSignedIn) {
        return null;
      }

      return getToken();
    });
  }, [getToken, isSignedIn]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    if (!isSignedIn || !clerkUser) {
      setUser(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const syncProfile = async () => {
      setLoading(true);
      try {
        const { data } = await api.post(endpoints.auth.sync, {
          clerkUserId: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress || "",
          name:
            [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(" ").trim() ||
            clerkUser.username ||
            "User",
          phone: clerkUser.primaryPhoneNumber?.phoneNumber || "",
          avatar: clerkUser.imageUrl || ""
        });

        if (!cancelled) {
          setUser(data.user);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(error?.response?.data?.message || "Unable to sync your account");
          setUser(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    syncProfile();

    return () => {
      cancelled = true;
    };
  }, [clerkUser, isLoaded, isSignedIn]);

  const refreshProfile = async () => {
    if (!isSignedIn) {
      setUser(null);
      setLoading(false);
      return null;
    }

    const { data } = await api.get(endpoints.auth.me);
    setUser(data.user);
    return data.user;
  };

  const updateProfile = async (profile) => {
    const { data } = await api.put(endpoints.auth.profile, profile);
    setUser(data.user);
    toast.success("Profile updated");
    return data;
  };

  const addAddress = async (address) => {
    const { data } = await api.post(endpoints.auth.addresses, address);
    toast.success("Address added");
    return data;
  };

  const updateAddress = async (addressId, address) => {
    const { data } = await api.put(`${endpoints.auth.addresses}/${addressId}`, address);
    toast.success("Address updated");
    return data;
  };

  const deleteAddress = async (addressId) => {
    await api.delete(`${endpoints.auth.addresses}/${addressId}`);
    toast.success("Address deleted");
    return {
      addresses: (await api.get(endpoints.auth.addresses)).data.addresses || []
    };
  };

  const logout = async () => {
    await clerk.signOut({ redirectUrl: "/" });
  };

  const value = useMemo(
    () => ({
      user,
      loading: !isLoaded || loading,
      isAuthenticated: Boolean(isSignedIn),
      isAdmin: user?.role === "admin",
      logout,
      updateProfile,
      addAddress,
      updateAddress,
      deleteAddress,
      refreshProfile
    }),
    [isLoaded, isSignedIn, loading, user]
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
