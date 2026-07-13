import { createContext, useContext, useState } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

function readStoredUser() {
  try {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

function persistSession({ access, refresh, user }) {
  localStorage.setItem('access', access);
  localStorage.setItem('refresh', refresh);
  localStorage.setItem('user', JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
  localStorage.removeItem('user');
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readStoredUser);

  async function login(email, password) {
    const { data } = await api.post('/auth/login/', { email, password });
    persistSession(data);
    setUser(data.user);
    return data.user.role;
  }

  async function register(payload) {
    const { data } = await api.post('/auth/register/', payload);
    persistSession(data);
    setUser(data.user);
    return data.user.role;
  }

  function logout() {
    clearSession();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
