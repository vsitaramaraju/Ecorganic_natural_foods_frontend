import {
  createContext,
  useState,
  useCallback,
  useEffect,
  useMemo
} from "react";
import { SESSION_EXPIRED_EVENT } from "../utils/authEvents";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // --------------------------------------------------
  // Restore authentication from localStorage
  // --------------------------------------------------
  useEffect(() => {
    const restoreAuth = () => {
      try {
        const savedToken = localStorage.getItem("token");
        const savedUser = localStorage.getItem("user");

        if (savedToken && savedUser) {
          const parsedUser = JSON.parse(savedUser);

          setToken(savedToken);
          setUser(parsedUser);
        } else {
          setToken(null);
          setUser(null);
        }
      } catch {
        // Clear corrupted authentication data
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        setToken(null);
        setUser(null);
      } finally {
        // Only allow ProtectedRoute to run after
        // authentication has been completely restored.
        setIsLoading(false);
      }
    };

    restoreAuth();
  }, []);

  // --------------------------------------------------
  // Login
  // --------------------------------------------------
  const login = useCallback((userData, tokenValue) => {
    localStorage.setItem("token", tokenValue);
    localStorage.setItem("user", JSON.stringify(userData));

    setToken(tokenValue);
    setUser(userData);
  }, []);

  // --------------------------------------------------
  // Logout
  // --------------------------------------------------
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);

    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);

  // --------------------------------------------------
  // Server rejected the saved token (expired/invalid)
  // --------------------------------------------------
  // Logging out makes ProtectedRoute send the user to /login on protected pages;
  // on public pages they simply appear logged out.
  useEffect(() => {
    window.addEventListener(SESSION_EXPIRED_EVENT, logout);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, logout);
  }, [logout]);

  // --------------------------------------------------
  // Authentication state
  // --------------------------------------------------
  const isAuthenticated = useMemo(() => Boolean(token && user), [token, user]);

  // --------------------------------------------------
  // Admin state
  // --------------------------------------------------
  const isAdmin = useMemo(
    () => Boolean(user && String(user.role || "").toUpperCase() === "ADMIN"),
    [user]
  );

  // --------------------------------------------------
  // Context value
  // --------------------------------------------------
  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated,
      isAdmin,
      login,
      logout
    }),
    [user, token, isLoading, isAuthenticated, isAdmin, login, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
