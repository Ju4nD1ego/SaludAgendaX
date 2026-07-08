import React from 'react';
import { Link } from 'react-router-dom';
import {
  HeartPulse,
  ShieldCheck,
  Zap,
  ClipboardCheck,
  User,
  IdCard,
  Building2,
  Mail,
  Lock,
} from 'lucide-react';

function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 relative overflow-hidden p-4 md:p-8">

      {/* Fondos decorativos difuminados */}
      <div className="absolute top-[-15%] right-[-10%] w-[32rem] h-[32rem] bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-40"></div>
      <div className="absolute bottom-[-15%] left-[-10%] w-[32rem] h-[32rem] bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40"></div>

      {/* TARJETA PRINCIPAL */}
      <div className="flex flex-col md:flex-row w-full max-w-5xl bg-white rounded-3xl shadow-2xl shadow-blue-900/10 overflow-hidden z-10">

        {/* ========================================================= */}
        {/* PANEL IZQUIERDO */}
        {/* ========================================================= */}
        <div className="w-full md:w-5/12 bg-gradient-to-br from-blue-800 via-blue-700 to-blue-500 p-10 text-white flex flex-col justify-between relative overflow-hidden">

          <div
            className="absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }}
          />
          <div className="absolute -top-10 -left-16 w-56 h-56 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute bottom-10 -right-10 w-40 h-40 rounded-full bg-blue-300/20 blur-2xl" />

          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center border border-white/20">
                <HeartPulse size={22} className="text-white" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">SaludAgendaX</h1>
            </div>

            <h2 className="text-3xl font-bold leading-tight mt-8 mb-3">
              Únete a nuestra red<br />de cuidado médico.
            </h2>
            <p className="text-blue-100 font-light text-sm mb-10 max-w-xs">
              Crea tu cuenta una sola vez y agenda tus citas en segundos, cuando lo necesites.
            </p>

            {/* Pasos del proceso, más dinámico que una lista plana */}
            <div className="space-y-4">
              <StepItem
                icon={<User size={16} />}
                title="Regístrate"
                desc="Con tus datos personales y de documento."
              />
              <StepItem
                icon={<ShieldCheck size={16} />}
                title="Valida tu EPS"
                desc="Verificación automática con tu aseguradora."
              />
              <StepItem
                icon={<ClipboardCheck size={16} />}
                title="Agenda tu cita"
                desc="Elige especialidad, médico y horario."
              />
            </div>
          </div>

          <div className="relative z-10 mt-8 pt-6 border-t border-white/15 flex items-center gap-2">
            <Zap size={14} className="text-blue-200" />
            <p className="text-blue-100 text-xs">Registro en menos de 2 minutos</p>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PANEL DERECHO */}
        {/* ========================================================= */}
        <div className="w-full md:w-7/12 p-8 md:p-12">
          <div className="flex justify-between items-center mb-6">
            <span className="text-slate-400 text-sm">¿Ya tienes cuenta?</span>
            <Link
              to="/login"
              className="btn btn-sm btn-outline border-slate-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 rounded-full px-6"
            >
              Iniciar Sesión
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-1">Crear Cuenta de Paciente</h2>
          <p className="text-slate-400 text-sm mb-6">
            Ingresa tus datos tal como aparecen en tu documento de identidad.
          </p>

          <form className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Nombre Completo */}
            <div className="form-control md:col-span-2">
              <label className="label py-1">
                <span className="label-text font-semibold text-slate-600 text-sm">Nombre Completo</span>
              </label>
              <div className="relative">
                <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Ej: Juan Pérez"
                  className="input input-bordered w-full pl-10 bg-slate-50 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800"
                  required
                />
              </div>
            </div>

            {/* Tipo de Documento */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-semibold text-slate-600 text-sm">Tipo de Documento</span>
              </label>
              <select
                className="select select-bordered w-full bg-slate-50 border-slate-300 focus:border-blue-500 text-slate-700"
                defaultValue=""
              >
                <option value="" disabled>Seleccionar...</option>
                <option value="CC">Cédula de Ciudadanía</option>
                <option value="TI">Tarjeta de Identidad</option>
                <option value="CE">Cédula de Extranjería</option>
              </select>
            </div>

            {/* Número de Documento */}
            <div className="form-control">
              <label className="label py-1">
                <span className="label-text font-semibold text-slate-600 text-sm">Número de Documento</span>
              </label>
              <div className="relative">
                <IdCard size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="1002345678"
                  className="input input-bordered w-full pl-10 bg-slate-50 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800"
                  required
                />
              </div>
            </div>

            {/* Selector de EPS */}
            <div className="form-control md:col-span-2">
              <label className="label py-1">
                <span className="label-text font-semibold text-slate-600 text-sm">Entidad Aseguradora (EPS)</span>
              </label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                <select
                  className="select select-bordered w-full pl-10 bg-slate-50 border-slate-300 focus:border-blue-500 text-slate-700"
                  defaultValue=""
                >
                  <option value="" disabled>Selecciona tu EPS</option>
                  <option value="sura">EPS Sura</option>
                  <option value="sanitas">EPS Sanitas</option>
                  <option value="nueva_eps">Nueva EPS</option>
                  <option value="salud_total">Salud Total</option>
                  <option value="particular">Particular / Sin EPS</option>
                </select>
              </div>
            </div>

            {/* Correo Electrónico */}
            <div className="form-control md:col-span-2">
              <label className="label py-1">
                <span className="label-text font-semibold text-slate-600 text-sm">Correo Electrónico</span>
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  placeholder="juan@ejemplo.com"
                  className="input input-bordered w-full pl-10 bg-slate-50 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800"
                  required
                />
              </div>
            </div>

            {/* Contraseña */}
            <div className="form-control md:col-span-2">
              <label className="label py-1">
                <span className="label-text font-semibold text-slate-600 text-sm">Contraseña</span>
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  className="input input-bordered w-full pl-10 bg-slate-50 border-slate-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-slate-800"
                  required
                />
              </div>
            </div>

            {/* Botón de Registro */}
            <div className="md:col-span-2 mt-2">
              <button
                type="submit"
                className="btn bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white border-none w-full text-base tracking-wide shadow-lg shadow-blue-500/30"
              >
                Crear mi cuenta
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// ── Componente auxiliar: paso del proceso ────────────────────────────────────
function StepItem({ icon, title, desc }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center flex-shrink-0 border border-white/20 text-blue-100">
        {icon}
      </div>
      <div>
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs text-blue-100/80">{desc}</p>
      </div>
    </div>
  );
}

export default Register;