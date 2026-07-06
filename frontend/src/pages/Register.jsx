import React from 'react';
import { Link } from 'react-router-dom';
import { HeartPulse, UserPlus, Shield, Activity } from 'lucide-react';

function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-blue-50 relative overflow-hidden p-4 md:p-8">
      
      {/* Fondos decorativos difuminados */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-50"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-60"></div>

      {/* TARJETA PRINCIPAL DIVIDIDA */}
      <div className="flex flex-col md:flex-row w-full max-w-5xl bg-white rounded-2xl shadow-2xl overflow-hidden z-10">
        
        {/* PANEL IZQUIERDO (Azul Médico) */}
        <div className="w-full md:w-5/12 bg-gradient-to-br from-blue-700 to-blue-500 p-10 text-white flex flex-col justify-center relative">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-4">
              <HeartPulse size={36} className="text-blue-200" />
              <h1 className="text-3xl font-bold tracking-tight">SaludAgendaX</h1>
            </div>
            <h2 className="text-lg font-medium text-blue-100 mb-8">Únete a nuestra red de cuidado médico en línea.</h2>
            
            <div className="space-y-6 opacity-90 font-light text-sm">
              <p>✓ Registra tus datos una sola vez y agenda en segundos.</p>
              <p>✓ Validación automática con tu entidad aseguradora (EPS).</p>
              <p>✓ Historial de citas seguro y siempre accesible.</p>
            </div>
          </div>
        </div>

        {/* PANEL DERECHO (Formulario Gris/Blanco) */}
        <div className="w-full md:w-7/12 p-8 md:p-12">
          <div className="flex justify-between items-center mb-6">
            <span className="text-slate-400 text-sm">¿Ya tienes cuenta?</span>
            <Link to="/login" className="btn btn-sm btn-outline border-slate-200 text-blue-600 hover:bg-blue-50 hover:border-blue-300 rounded-full px-6">
              Iniciar Sesión
            </Link>
          </div>

          <h2 className="text-2xl font-bold text-slate-800 mb-2">Crear Cuenta de Paciente</h2>
          <p className="text-slate-500 text-sm mb-6">Ingresa tus datos personales tal como aparecen en tu documento de identidad.</p>

          <form className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Nombre Completo */}
            <div className="form-control md:col-span-2">
              <label className="label py-1"><span className="label-text font-semibold text-slate-600">Nombre Completo</span></label>
              <input type="text" placeholder="Ej: Juan Pérez" className="input input-bordered w-full bg-slate-50 border-slate-300 focus:border-blue-500 text-slate-800" required />
            </div>

            {/* Tipo de Documento */}
            <div className="form-control">
              <label className="label py-1"><span className="label-text font-semibold text-slate-600">Tipo de Documento</span></label>
              <select className="select select-bordered w-full bg-slate-50 border-slate-300 focus:border-blue-500 text-slate-700" defaultValue="">
                <option value="" disabled>Seleccionar...</option>
                <option value="CC">Cédula de Ciudadanía</option>
                <option value="TI">Tarjeta de Identidad</option>
                <option value="CE">Cédula de Extranjería</option>
              </select>
            </div>

            {/* Número de Documento */}
            <div className="form-control">
              <label className="label py-1"><span className="label-text font-semibold text-slate-600">Número de Documento</span></label>
              <input type="text" placeholder="Ejemplo: 1002345678" className="input input-bordered w-full bg-slate-50 border-slate-300 focus:border-blue-500 text-slate-800" required />
            </div>

            {/* Selector de EPS (Requisito Clave del Proyecto) */}
            <div className="form-control md:col-span-2">
              <label className="label py-1"><span className="label-text font-semibold text-slate-600">Entidad Aseguradora (EPS)</span></label>
              <select className="select select-bordered w-full bg-slate-50 border-slate-300 focus:border-blue-500 text-slate-700" defaultValue="">
                <option value="" disabled>Selecciona tu EPS</option>
                <option value="sura">EPS Sura</option>
                <option value="sanitas">EPS Sanitas</option>
                <option value="nueva_eps">Nueva EPS</option>
                <option value="salud_total">Salud Total</option>
                <option value="particular">Particular / Sin EPS</option>
              </select>
            </div>

            {/* Correo Electrónico */}
            <div className="form-control md:col-span-2">
              <label className="label py-1"><span className="label-text font-semibold text-slate-600">Correo Electrónico</span></label>
              <input type="email" placeholder="juan@ejemplo.com" className="input input-bordered w-full bg-slate-50 border-slate-300 focus:border-blue-500 text-slate-800" required />
            </div>

            {/* Contraseña */}
            <div className="form-control md:col-span-2">
              <label className="label py-1"><span className="label-text font-semibold text-slate-600">Contraseña</span></label>
              <input type="password" placeholder="Mínimo 8 caracteres" className="input input-bordered w-full bg-slate-50 border-slate-300 focus:border-blue-500 text-slate-800" required />
            </div>

            {/* Botón de Registro */}
            <div className="md:col-span-2 mt-2">
              <button type="submit" className="btn bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white border-none w-full text-base tracking-wider shadow-lg shadow-blue-500/30">
                REGISTRARME
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
}

export default Register;