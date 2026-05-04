import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { authAPI } from "../services/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem("access_token"));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadProfile = async () => {
    const savedToken = localStorage.getItem("access_token");
    if (!savedToken) {
      setUser(null);
      setLoading(false);
      return;
    }

    try {
      // Keep UI state in sync with server-side account status/role.
      const result = await authAPI.me();
      if (result.success) {
        setUser(result.data);
      } else {
        setUser(null);
      }
    } catch {
      localStorage.removeItem("access_token");
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const login = async (email, password) => {
    const result = await authAPI.login({ email, password });
    if (result.success) {
      localStorage.setItem("access_token", result.data.access_token);
      setToken(result.data.access_token);
      setUser(result.data.user);
    }
    return result;
  };

  const register = async (payload) => {
    const result = await authAPI.register(payload);
    return result;
  };

  const registerSeller = async (payload) => {
    const result = await authAPI.registerSeller(payload);
    return result;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch {
      // noop
    }
    localStorage.removeItem("access_token");
    setToken(null);
    setUser(null);
  };

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login,
      register,
      registerSeller,
      logout,
      setUser,
      refreshProfile: loadProfile,
      isAuthenticated: Boolean(token),
      hasRole: (roles = []) => (user ? roles.includes(user.role) : false)
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return context;
};
