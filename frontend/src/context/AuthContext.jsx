import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getCurrentUserRequest, loginRequest } from "../services/auth.service";
import { TOKEN_STORAGE_KEY, getApiErrorMessage } from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(
    () => localStorage.getItem(TOKEN_STORAGE_KEY) || "",
  );
  const [user, setUser] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken("");
    setUser(null);
  }, []);

  useEffect(() => {
    async function restoreSession() {
      const savedToken = localStorage.getItem(TOKEN_STORAGE_KEY);

      if (!savedToken) {
        setIsAuthLoading(false);
        return;
      }

      setToken(savedToken);

      try {
        const currentUser = await getCurrentUserRequest();
        setUser(currentUser);
      } catch {
        logout();
      } finally {
        setIsAuthLoading(false);
      }
    }

    restoreSession();
  }, [logout]);

  const login = useCallback(async (email, password) => {
    try {
      const payload = await loginRequest({ email, password });

      localStorage.setItem(TOKEN_STORAGE_KEY, payload.token);
      setToken(payload.token);
      setUser(payload.user);

      return payload;
    } catch (error) {
      throw new Error(getApiErrorMessage(error, "Login failed"));
    }
  }, []);

  const mergeUser = useCallback((partialUser) => {
    setUser((currentUser) => {
      if (!currentUser) {
        return currentUser;
      }

      return {
        ...currentUser,
        ...partialUser,
      };
    });
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isAuthLoading,
      isAuthenticated: Boolean(token && user),
      login,
      logout,
      mergeUser,
    }),
    [isAuthLoading, login, logout, mergeUser, token, user],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthContext;
