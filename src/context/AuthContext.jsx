import {
  createContext,
  useState,
  useCallback,
  useEffect,
  useMemo
} from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");
    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
      } catch (_) {}
    }
    setIsLoading(false);
  }, []);

  const login = useCallback((userData, tokenValue) => {
    setUser(userData);
    setToken(tokenValue);
    localStorage.setItem("token", tokenValue);
    localStorage.setItem("user", JSON.stringify(userData));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);

  const isAuthenticated = useMemo(() => Boolean(token && user), [token, user]);

  const isAdmin = useMemo(() => user?.role === "ADMIN", [user]);

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