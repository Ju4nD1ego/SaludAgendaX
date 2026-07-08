import { NavLink, useNavigate } from 'react-router-dom';
import {
  HeartPulse,
  LayoutDashboard,
  CalendarDays,
  ClipboardList,
  UserCircle,
  LogOut,
  Users,
  Stethoscope,
  BarChart3,
  CalendarCheck,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

// Opciones de navegación por rol
// Cuando agregues más páginas, solo añades aquí
const navItems = {
  paciente: [
    { to: '/patient/home',         icon: <LayoutDashboard size={20} />, label: 'Inicio'    },
    { to: '/patient/calendar', icon: <CalendarDays size={20} />, label: 'Mis Citas' },
    { to: '/patient/history',      icon: <ClipboardList  size={20} />, label: 'Historial'  },
    { to: '/patient/profile',      icon: <UserCircle     size={20} />, label: 'Mi Perfil'  },
  ],
  admin: [
    { to: '/admin/dashboard', icon: <LayoutDashboard size={20} />, label: 'Dashboard'  },
    { to: '/admin/citas',     icon: <CalendarCheck   size={20} />, label: 'Citas'      },
    { to: '/admin/pacientes', icon: <Users           size={20} />, label: 'Pacientes'  },
    { to: '/admin/medicos',   icon: <Stethoscope     size={20} />, label: 'Médicos'    },
    { to: '/admin/reportes',  icon: <BarChart3       size={20} />, label: 'Reportes'   },
  ],
  medico: [
    { to: '/medico/agenda',  icon: <CalendarDays size={20} />, label: 'Mi Agenda'  },
    { to: '/medico/profile', icon: <UserCircle   size={20} />, label: 'Mi Perfil'  },
  ],
};

const roleLabel = {
  paciente: 'Paciente',
  admin:    'Administrador',
  medico:   'Médico',
};

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate         = useNavigate();

  // Si por alguna razón no hay usuario, usamos paciente por defecto
  const role = user?.role ?? 'paciente';
  const items = navItems[role] ?? navItems.paciente;

  function handleLogout() {
    logout();
    navigate('/login');
  }

  return (
    <aside className="w-64 min-h-screen bg-gradient-to-b from-blue-700 to-blue-500 flex flex-col shadow-xl flex-shrink-0">

      {/* ── Logo ─────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-6 py-6 border-b border-blue-400/40">
        <HeartPulse className="text-white" size={28} />
        <span className="text-white font-bold text-xl tracking-tight">
          SaludAgendaX
        </span>
      </div>

      {/* ── Navegación ───────────────────────────────── */}
      <nav className="flex-1 px-4 py-6 flex flex-col gap-1">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-white text-blue-700 shadow-md'
                  : 'text-blue-100 hover:bg-white/15 hover:text-white'
              }`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* ── Usuario + Logout ──────────────────────────── */}
      <div className="px-4 pb-6 pt-4 border-t border-blue-400/40">
        <div className="flex items-center gap-3 px-4 py-3 mb-2">
          <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center">
            <UserCircle className="text-white" size={22} />
          </div>
          <div className="overflow-hidden">
            {/* Ahora viene del contexto real, no del mock hardcodeado */}
            <p className="text-white text-sm font-semibold truncate">
              {user?.name ?? 'Usuario'}
            </p>
            <p className="text-blue-200 text-xs">{roleLabel[role]}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-blue-100 hover:bg-white/15 hover:text-white transition-all duration-200"
        >
          <LogOut size={20} />
          Cerrar Sesión
        </button>
      </div>
    </aside>
  );
}