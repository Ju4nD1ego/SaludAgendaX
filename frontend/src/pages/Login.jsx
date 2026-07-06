import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CalendarCheck, ShieldCheck, Activity, Stethoscope, HeartPulse } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function Login() {
  const [role, setRole]       = useState('paciente');
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]     = useState('');

  const { login }  = useAuth();     // Leemos la función login de la pizarra
  const navigate   = useNavigate(); // Para redirigir después del login

  function handleSubmit(e) {
    e.preventDefault(); // Evita que el form recargue la página
    setError('');

    // Validación mínima
    if (!email || !password) {
      setError('Por favor completa todos los campos.');
      return;
    }

    // Llamamos al login del contexto y nos devuelve el rol
    const userRole = login(email, password);

    // Redirigimos según el rol
    if (userRole === 'admin') {
      navigate('/admin/dashboard');
    } else if (userRole === 'medico') {
      navigate('/medico/agenda');
    } else {
      navigate('/patient/home');
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 relative overflow-hidden p-4 md:p-8">
      
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
      <div className="absolute bottom-[-10%] right-[-5%] w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-60"></div>

      <div className="flex flex-col md:flex-row w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden z-10">
        
        {/* Panel Izquierdo — sin cambios */}
        <div className="w-full md:w-5/12 bg-gradient-to-br from-blue-700 to-blue-500 p-10 text-white flex flex-col justify-center relative overflow-hidden">
          <div className="absolute top-6 left-6 opacity-20 text-4xl leading-[10px] tracking-widest">
            ••••<br/>••••<br/>••••
          </div>
          <div className="relative z-10 mt-8">
            <div className="flex items-center gap-2 mb-2">
              <HeartPulse size={36} className="text-blue-200" />
              <h1 className="text-4xl font-bold">SaludAgendaX</h1>
            </div>
            <h2 className="text-xl font-medium text-blue-100 mb-10">Portal de Gestión Médica</h2>
            <ul className="space-y-5">
              <li className="flex items-center gap-3">
                <CalendarCheck size={22} className="text-blue-200" />
                <span className="font-light">Agendamiento en línea 24/7</span>
              </li>
              <li className="flex items-center gap-3">
                <Activity size={22} className="text-blue-200" />
                <span className="font-light">Control presupuestal y topes EPS</span>
              </li>
              <li className="flex items-center gap-3">
                <Stethoscope size={22} className="text-blue-200" />
                <span className="font-light">Disponibilidad de especialistas</span>
              </li>
              <li className="flex items-center gap-3">
                <ShieldCheck size={22} className="text-blue-200" />
                <span className="font-light">Seguridad de datos médicos</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Panel Derecho — formulario actualizado */}
        <div className="w-full md:w-7/12 p-8 md:p-12 relative">
          <div className="flex justify-between items-center mb-8">
            <div className="text-blue-600 font-bold text-lg flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm">
                ✚
              </div>
              SaludAgendaX
            </div>
            <Link to="/register" className="btn btn-sm btn-outline border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-blue-600 hover:border-slate-300 rounded-full px-6">
              Registrarse
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-6">Iniciar Sesión</h2>

          <div className="flex bg-slate-100 p-1 rounded-lg mb-6 border border-slate-200">
            <button
              type="button"
              onClick={() => setRole('paciente')}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                role === 'paciente'
                  ? 'bg-white shadow-sm text-blue-600 border border-slate-200'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              👤 Paciente
            </button>
            <button
              type="button"
              onClick={() => setRole('personal')}
              className={`flex-1 py-2 text-sm font-semibold rounded-md transition-all ${
                role === 'personal'
                  ? 'bg-white shadow-sm text-blue-600 border border-slate-200'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              🏥 Personal Médico
            </button>
          </div>

          {/* Mensaje de error */}
          {error && (
            <div className="alert alert-error mb-4 py-2 text-sm">
              {error}
            </div>
          )}

          {/* Credenciales de prueba visibles — quitar cuando esté el backend */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 mb-5 text-xs text-slate-500">
            <p className="font-semibold text-slate-600 mb-1">🧪 Credenciales de prueba:</p>
            <p>Paciente: <span className="font-mono">cualquier@email.com</span></p>
            <p>Admin: <span className="font-mono">admin@saludagendax.com</span></p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-semibold text-slate-600">Correo Electrónico</span>
              </label>
              <input
                type="email"
                placeholder="usuario@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input input-bordered w-full bg-slate-50 border-slate-300 focus:border-blue-500 text-slate-800"
              />
            </div>

            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-semibold text-slate-600">Contraseña</span>
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input input-bordered w-full bg-slate-50 border-slate-300 focus:border-blue-500 text-slate-800"
              />
            </div>

            <div className="flex justify-between items-center mt-1">
              <label className="cursor-pointer label gap-2 justify-start">
                <input type="checkbox" className="checkbox checkbox-sm checkbox-primary border-slate-400" />
                <span className="label-text text-slate-500 font-medium">Recordar usuario</span>
              </label>
              <a href="#" className="text-sm font-bold text-blue-600 hover:underline">
                ¿OLVIDASTE TU CONTRASEÑA?
              </a>
            </div>

            <button
              type="submit"
              className="btn bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white border-none mt-2 w-full text-base tracking-wider shadow-lg shadow-blue-500/30"
            >
              LOGIN
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;