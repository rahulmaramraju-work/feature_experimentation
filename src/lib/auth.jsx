import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api('/me')
      .then((d) => setUser(d.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const d = await api('/auth/login', { method: 'POST', body: { email, password } });
    setUser(d.user);
    return d.user;
  }, []);

  const demoLogin = useCallback(async (email) => {
    const d = await api('/auth/demo', { method: 'POST', body: { email } });
    setUser(d.user);
    return d.user;
  }, []);

  const signup = useCallback(async (fields) => {
    const d = await api('/auth/signup', { method: 'POST', body: fields });
    setUser(d.user);
    return d.user;
  }, []);

  const logout = useCallback(async () => {
    await api('/auth/logout', { method: 'POST' });
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, demoLogin, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
