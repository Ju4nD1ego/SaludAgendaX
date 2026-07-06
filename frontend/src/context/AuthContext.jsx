import { createContext, useContext, useState } from 'react';

// 1. Creamos la "pizarra"
const AuthContext = createContext(null);

// 2. El "proveedor": el componente que envuelve toda la app
//    y hace la pizarra disponible para todos
export function AuthProvider({ children }) {

  // Por ahora el usuario empieza como null (no logueado)
  // Cuando el backend exista, aquí validaremos el JWT
  const [user, setUser] = useState(null);

  // Simula el login: recibe credenciales, devuelve el rol
  // Reemplazar esto por axios.post('/api/auth/login/') cuando el backend esté
  function login(email, password) {
    // ── Mock: decidimos el rol según el email ──────────────────────
    // En producción esto vendrá del backend en el token JWT
    let mockUser = null;

    if (email === 'admin@saludagendax.com') {
      mockUser = { name: 'Carlos Admin', email, role: 'admin' };
    } else if (email === 'medico@saludagendax.com') {
      mockUser = { name: 'Dra. Torres', email, role: 'medico' };
    } else {
      // Cualquier otro email → paciente
      mockUser = { name: 'Ana García', email, role: 'paciente' };
    }
    // ───────────────────────────────────────────────────────────────

    setUser(mockUser);   // Escribimos en la pizarra
    return mockUser.role; // Devolvemos el rol para que Login sepa a dónde redirigir
  }

  function logout() {
    setUser(null); // Borramos la pizarra
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// 3. Hook personalizado para leer la pizarra fácilmente
//    En vez de escribir useContext(AuthContext) en cada componente,
//    escribimos simplemente useAuth()
export function useAuth() {
  return useContext(AuthContext);
}