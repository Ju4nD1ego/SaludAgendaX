import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Este componente envuelve rutas que requieren estar logueado.
// Si no hay usuario en el contexto, redirige a /login.
// Si se especifica un `allowedRoles`, también valida que el rol coincida.
export default function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();

  // Caso 1: no hay usuario logueado → afuera
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Caso 2: hay usuario, pero su rol no está permitido en esta ruta
  // Ej: un paciente intentando entrar a /admin/dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  // Caso 3: todo bien, deja pasar
  return children;
}