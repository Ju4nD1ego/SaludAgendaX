import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Ahora login recibe también el "selectedRole" que viene del toggle
  // (paciente | personal). Esto decide qué credenciales son válidas.
  function login(email, password, selectedRole) {
    // 🔌 AQUÍ CONECTA EL BACKEND:
    // reemplazar todo este bloque por:
    // const res = await axios.post('/api/auth/login/', { email, password });
    // setUser(res.data.user);
    // return res.data.user.role;

    if (selectedRole === 'personal') {
      // Pestaña "Personal Médico": solo reconocemos admin y médico
      if (email === 'admin@saludagendax.com') {
        const mockUser = { name: 'Carlos Admin', email, role: 'admin' };
        setUser(mockUser);
        return mockUser.role;
      }
      if (email === 'medico@saludagendax.com') {
        const mockUser = { name: 'Dra. Torres', email, role: 'medico' };
        setUser(mockUser);
        return mockUser.role;
      }
      // Email no reconocido como personal médico
      return null;
    }

    // Pestaña "Paciente": bloqueamos que entren con emails de personal
    if (email === 'admin@saludagendax.com' || email === 'medico@saludagendax.com') {
      return null;
    }

    // Cualquier otro email → paciente
    const mockUser = { name: 'Ana García', email, role: 'paciente' };
    setUser(mockUser);
    return mockUser.role;
  }

  function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}