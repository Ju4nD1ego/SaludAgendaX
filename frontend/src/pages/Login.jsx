import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  ShieldCheck,
  Activity,
  Stethoscope,
  HeartPulse,
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Building2,
  ArrowRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [role, setRole] = useState('paciente');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    try {
      const userRole = await login(email, password);

      if (userRole === 'admin') {
        navigate('/admin/dashboard');
      } else if (userRole === 'medico') {
        navigate('/medico/agenda');
      } else {
        navigate('/patient/home');
      }
    } catch (err) {
      if (err.response) {
        setError('Credenciales inválidas. Verifica tu correo y contraseña.');
      } else {
        setError('No se pudo conectar con el servidor. ¿Está corriendo el backend?');
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden p-4 md:p-8">

      {/* Fondos decorativos difuminados */}
      <div className="absolute top-[-15%] left-[-10%] w-[32rem] h-[32rem] bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40"></div>
      <div className="absolute bottom-[-15%] right-[-10%] w-[32rem] h-[32rem] bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40"></div>

      {/* TARJETA PRINCIPAL */}
      <div className="flex flex-col md:flex-row w-full max-w-5xl bg-white rounded-3xl shadow-2xl shadow-blue-900/10 overflow-hidden z-10">

        {/* ========================================================= */}
        {/* PANEL IZQUIERDO */}
        {/* ========================================================= */}
        <div className="w-full md:w-5/12 bg-gradient-to-br from-blue-800 via-blue-700 to-blue-500 p-10 text-white flex flex-col justify-between relative overflow-hidden">

          {/* Textura de puntos sutil */}
          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />

          {/* Blobs decorativos */}
          <div className="absolute -top-10 -right-16 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-10 -left-10 w-40 h-40 rounded-full bg-blue-300/20 blur-2xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
                <HeartPulse size={22} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">SaludAgendaX</h1>
            </div>

            <h2 className="text-3xl font-bold leading-tight mt-8 mb-3">
              Tu salud,<br />a un clic de distancia.
            </h2>
            <p className="text-blue-100 font-light text-sm mb-8 max-w-xs">
              Agenda, gestiona y da seguimiento a tus citas médicas desde cualquier lugar.
            </p>

            {/* Línea de pulso cardíaco decorativa */}
            <svg viewBox="0 0 300 40" className="w-full h-8 mb-8 opacity-70">
              <polyline
                points="0,20 60,20 75,5 90,35 105,20 300,20"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            {/* Chips de features en grilla */}
            <div className="grid grid-cols-2 gap-3">
              <FeatureChip icon={<CalendarCheck size={16} />} label="Agenda 24/7" />
              <FeatureChip icon={<Activity size={16} />} label="Control EPS" />
              <FeatureChip icon={<Stethoscope size={16} />} label="Especialistas" />
              <FeatureChip icon={<ShieldCheck size={16} />} label="Datos seguros" />
            </div>
          </div>

          {/* Credibilidad al pie */}
          <div className="relative z-10 mt-8 pt-6 border-t border-white/15">
            <p className="text-blue-100 text-xs">
              <span className="font-bold text-white">+10,000</span> citas gestionadas cada mes
            </p>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PANEL DERECHO */}
        {/* ========================================================= */}
        <div className="w-full md:w-7/12 p-8 md:p-12 relative flex flex-col justify-center">

          <div className="flex justify-between items-center mb-8">
            <div className="text-blue-600 font-bold text-lg flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center">
                <HeartPulse size={16} />
              </div>
              SaludAgendaX
            </div>
            <Link
              to="/register"
              className="btn btn-sm btn-outline border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-blue-600 hover:border-slate-300 rounded-full px-6"
            >
              Registrarse
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-1">Bienvenido de vuelta</h2>
          <p className="text-slate-400 text-sm mb-6">Ingresa tus credenciales para continuar.</p>

          {/* Toggle de Roles */}
          <div className="flex bg-slate-100 p-1 rounded-xl mb-5 border border-slate-200">
            <button
              type="button"
              onClick={() => setRole('paciente')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                role === 'paciente'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <User size={15} /> Paciente
            </button>
            <button
              type="button"
              onClick={() => setRole('personal')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-sm font-semibold rounded-lg transition-all ${
                role === 'personal'
                  ? 'bg-white shadow-sm text-blue-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Building2 size={15} /> Personal Médico
            </button>
          </div>

          {error && (
            <div className="alert alert-error mb-4 py-2 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Correo con ícono */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-semibold text-slate-600 text-sm">Correo Electrónico</span>
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  placeholder="usuario@ejemplo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input input-bordered w-full pl-10 bg-slate-50 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-slate-800"
                />
              </div>
            </div>

            {/* Contraseña con ícono + toggle mostrar/ocultar */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-semibold text-slate-600 text-sm">Contraseña</span>
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input input-bordered w-full pl-10 pr-10 bg-slate-50 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-colors text-slate-800"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center mt-1">
              <label className="cursor-pointer label gap-2 justify-start p-0">
                <input type="checkbox" className="checkbox checkbox-sm checkbox-primary border-slate-400" />
                <span className="label-text text-slate-500 font-medium text-sm">Recordar usuario</span>
              </label>
              <a href="#" className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline">
                ¿OLVIDASTE TU CONTRASEÑA?
              </a>
            </div>

            <button
              type="submit"
              className="btn bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white border-none mt-2 w-full text-base tracking-wide shadow-lg shadow-blue-500/30 group"
            >
              Ingresar
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Componente auxiliar: chip de característica ──────────────────────────────
function FeatureChip({ icon, label }) {
  return (
    <div className="flex items-center gap-2 bg-white/10 backdrop-blur border border-white/15 rounded-xl px-3 py-2.5">
      <span className="text-blue-200">{icon}</span>
      <span className="text-xs font-medium text-blue-50">{label}</span>
    </div>
  );
}

export default Login;