import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';

// MainLayout es el "marco" de toda la app autenticada.
// Sidebar siempre visible a la izquierda.
// <Outlet /> es el hueco donde React Router pinta la página activa.
export default function MainLayout() {
  return (
    <div className="flex min-h-screen bg-slate-100">
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
}