import { useState, useEffect } from 'react';
import {
  Mail,
  Building2,
  Stethoscope,
  ShieldCheck,
  CalendarClock,
  Clock,
} from 'lucide-react';
import api from '../../api/client';

function formatTime12h(timeStr) {
  const [h, m] = timeStr.split(':');
  const d = new Date();
  d.setHours(Number(h), Number(m), 0, 0);
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export default function DoctorProfile() {
  const [perfil, setPerfil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/auth/me/')
      .then(({ data }) => {
        if (active) setPerfil(data);
      })
      .catch(() => {
        if (active) setError('No se pudo cargar tu perfil.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Cargando tu perfil...</div>;
  }
  if (!perfil?.doctor_profile) {
    return <div className="p-8 text-center text-red-500">{error || 'No se pudo cargar tu perfil.'}</div>;
  }

  const { doctor_profile: doctor } = perfil;
  const nombre = `${perfil.first_name} ${perfil.last_name}`.trim() || perfil.username;
  const iniciales = nombre.split(' ').map((n) => n[0]).slice(0, 2).join('');

  const horariosPorDia = {};
  doctor.schedules.forEach((h) => {
    if (!horariosPorDia[h.day_of_week_display]) horariosPorDia[h.day_of_week_display] = [];
    horariosPorDia[h.day_of_week_display].push(h);
  });

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Mi Perfil</h1>
        <p className="text-slate-500 mt-1">Tu información profesional y horario de atención.</p>
      </div>

      {error && (
        <div className="alert alert-error mb-4 py-2 text-sm">{error}</div>
      )}

      {/* ── "Carnet" médico ───────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 rounded-2xl shadow-lg shadow-blue-500/20 p-6 mb-6 overflow-hidden">
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-10 -right-2 w-24 h-24 rounded-full bg-white/10" />

        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center flex-shrink-0 text-xl font-bold text-white border border-white/20">
            {iniciales}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white truncate">Dr(a). {nombre}</h2>
              <ShieldCheck size={16} className="text-blue-200 flex-shrink-0" />
            </div>
            <p className="text-blue-100 text-sm">{doctor.specialty.name}</p>
            <p className="text-blue-200 text-xs mt-1">
              {doctor.is_active_doctor ? 'Activo' : 'Inactivo'}
            </p>
          </div>
          <div className="text-right flex-shrink-0 hidden sm:block">
            <div className="flex items-center gap-1.5 text-blue-100 text-xs mb-1 justify-end">
              <Building2 size={12} /> Consultorio
            </div>
            <p className="text-white font-semibold text-sm">{doctor.consultorio || 'Sin asignar'}</p>
          </div>
        </div>
      </div>

      {/* ── Datos ─────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex items-center gap-2 mb-5">
          <Stethoscope size={18} className="text-blue-600" />
          <h3 className="font-semibold text-slate-800">Datos Profesionales</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              <Mail size={16} /> Correo Electrónico
            </label>
            <p className="text-slate-700 font-medium">{perfil.email}</p>
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              <Stethoscope size={16} /> Especialidad
            </label>
            <p className="text-slate-700 font-medium">{doctor.specialty.name}</p>
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              <Building2 size={16} /> Consultorio
            </label>
            <p className="text-slate-700 font-medium">{doctor.consultorio || 'Sin asignar'}</p>
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-4">
          Para actualizar estos datos, contacta a un administrativo.
        </p>
      </div>

      {/* ── Horarios ──────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center gap-2 mb-5">
          <CalendarClock size={18} className="text-blue-600" />
          <h3 className="font-semibold text-slate-800">Horario de Atención</h3>
        </div>
        {Object.keys(horariosPorDia).length === 0 ? (
          <p className="text-sm text-slate-400">Aún no tienes horarios configurados. Contacta a un administrativo.</p>
        ) : (
          <div className="space-y-3">
            {Object.entries(horariosPorDia).map(([dia, bloques]) => (
              <div key={dia} className="flex items-start gap-3">
                <span className="w-24 flex-shrink-0 text-sm font-semibold text-slate-700">{dia}</span>
                <div className="flex flex-wrap gap-2">
                  {bloques.map((b) => (
                    <span
                      key={b.id}
                      className="flex items-center gap-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-3 py-1"
                    >
                      <Clock size={12} />
                      {formatTime12h(b.start_time)} - {formatTime12h(b.end_time)}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
