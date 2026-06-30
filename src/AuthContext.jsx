import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [role, setRole] = useState(() => sessionStorage.getItem('fundiq_role') || null);

  function login(password) {
    if (password === import.meta.env.VITE_ADMIN_PASSWORD) {
      sessionStorage.setItem('fundiq_role', 'admin');
      setRole('admin');
      return 'admin';
    }
    if (password === import.meta.env.VITE_VIEWER_PASSWORD) {
      sessionStorage.setItem('fundiq_role', 'viewer');
      setRole('viewer');
      return 'viewer';
    }
    return null;
  }

  function logout() {
    sessionStorage.removeItem('fundiq_role');
    setRole(null);
  }

  return (
    <AuthContext.Provider value={{ role, isViewer: role === 'viewer', isAdmin: role === 'admin', login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
