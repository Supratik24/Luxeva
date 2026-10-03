
import {
  useAuth as useClerkAuth,
  useClerk,
  useUser,
  useSignUp
} from "@clerk/clerk-react";
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState
} from "react";
import toast from "react-hot-toast";
import api, {
  endpoints,
  setAuthTokenGetter
} from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const { isLoaded, isSignedIn, getToken } = useClerkAuth();
  const { user: clerkUser } = useUser();
  const clerk = useClerk();
  const { signUp, setActive } = useSignUp();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Make the Clerk session token available to backend API requests.
  useEffect(() => {
    setAuthTokenGetter(async () => {
      if (!isSignedIn) {
        return null;
      }

      return getToken();
    });
  }, [getToken, isSignedIn]);

  // Create a Clerk account and send an email verification code.
  const signup = async ({ name, email, password }) => {
    if (!signUp) {
      throw new Error("Clerk is not ready. Please try again.");
    }

    const nameParts = name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(" ");

    const result = await signUp.create({
      emailAddress: email,
      password,
      firstName,
      ...(lastName ? { lastName } : {})
    });

    await signUp.prepareEmailAddressVerification({
      strategy: "email_code"
    });

    return result;
  };

  // Verify the email OTP and activate the Clerk session.
  const verifySignupOtp = async ({ otp }) => {
    if (!signUp) {
      throw new Error("Clerk is not ready. Please try again.");
    }

    const result = await signUp.attemptEmailAddressVerification({
      code: otp.trim()
    });

    if (result.status !== "complete" || !result.createdSessionId) {
      throw new Error(
        `Email verification is not complete. Status: ${result.status}`
      );
    }

    await setActive({ session: result.createdSessionId });

    return result;
  };

  // Start Google OAuth through Clerk.
  // This function expects a Clerk OAuth flow, not a Google Identity Services
  // credential. See the Google button note below.
  const googleLogin = async () => {
    await signUp.authenticateWithRedirect({
      strategy: "oauth_google",
      redirectUrl: "/sso-callback",
      redirectUrlComplete: "/dashboard"
    });
  };

  // Sync the signed-in Clerk user with the Luxeva backend.
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
          email:
            clerkUser.primaryEmailAddress?.emailAddress || "",
          name:
            [clerkUser.firstName, clerkUser.lastName]
              .filter(Boolean)
              .join(" ")
              .trim() ||
            clerkUser.username ||
            "User",
          phone:
            clerkUser.primaryPhoneNumber?.phoneNumber || "",
          avatar: clerkUser.imageUrl || ""
        });

        if (!cancelled) {
          setUser(data.user);
        }
      } catch (error) {
        if (!cancelled) {
          toast.error(
            error?.response?.data?.message ||
              "Unable to sync your account with Luxeva"
          );
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

  // Refresh the current user's backend profile.
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

  // Update the user profile.
  const updateProfile = async (profile) => {
    const { data } = await api.put(
      endpoints.auth.profile,
      profile
    );

    setUser(data.user);
    toast.success("Profile updated");

    return data;
  };

  // Add an address.
  const addAddress = async (address) => {
    const { data } = await api.post(
      endpoints.auth.addresses,
      address
    );

    toast.success("Address added");

    return data;
  };

  // Update an address.
  const updateAddress = async (addressId, address) => {
    const { data } = await api.put(
      `${endpoints.auth.addresses}/${addressId}`,
      address
    );

    toast.success("Address updated");

    return data;
  };

  // Delete an address and return the updated address list.
  const deleteAddress = async (addressId) => {
    await api.delete(
      `${endpoints.auth.addresses}/${addressId}`
    );

    toast.success("Address deleted");

    const { data } = await api.get(
      endpoints.auth.addresses
    );

    return {
      addresses: data.addresses || []
    };
  };

  // Sign out through Clerk.
  const logout = async () => {
    await clerk.signOut({ redirectUrl: "/" });
    setUser(null);
  };

  const value = useMemo(
    () => ({
      user,
      loading: !isLoaded || loading,
      isAuthenticated: Boolean(isSignedIn),
      isAdmin: user?.role === "admin",

      signup,
      verifySignupOtp,
      googleLogin,

      logout,
      updateProfile,
      addAddress,
      updateAddress,
      deleteAddress,
      refreshProfile
    }),
    [isLoaded, isSignedIn, loading, user]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used within AuthProvider"
    );
  }

  return context;
};