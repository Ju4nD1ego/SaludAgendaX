import { useState, useMemo, useEffect } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  Clock,
  MapPin,
  User,
  X,
  Stethoscope,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { mapAppointment } from '../../utils/appointments';

const HORAS = Array.from({ length: 11 }, (_, i) => i + 7);

const estadoStyles = {
  confirmada: { chip: 'bg-blue-50 border-blue-300 text-blue-700 hover:bg-blue-100', dot: 'bg-blue-500',  label: 'Confirmada' },
  pendiente:  { chip: 'bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100', dot: 'bg-amber-500', label: 'Pendiente'  },
  cancelada:  { chip: 'bg-red-50 border-red-300 text-red-700 hover:bg-red-100', dot: 'bg-red-500',    label: 'Cancelada'  },
  atendida:   { chip: 'bg-emerald-50 border-emerald-300 text-emerald-700 hover:bg-emerald-100', dot: 'bg-emerald-500', label: 'Atendida' },
  no_asistio: { chip: 'bg-slate-100 border-slate-300 text-slate-600 hover:bg-slate-200', dot: 'bg-slate-400', label: 'No Asistió' },
};

function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function getLunesDeSemana(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() + (day === 0 ? -6 : 1 - day));
  return d;
}
function getDiasSemana(lunes) {
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(lunes);
    d.setDate(d.getDate() + i);
    return d;
  });
}
function formatDiaCorto(date) { return date.toLocaleDateString('es-CO', { weekday: 'short' }); }
function formatDiaNumero(date) { return date.getDate(); }
function formatMesAnio(date) { return date.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' }); }
function formatFechaCompleta(dateStr) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'long' });
}
function esHoy(date) { return toISODate(date) === toISODate(new Date()); }

function displayName(user) {
  if (!user) return 'Doctor';
  const fullName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
  return fullName || user.username;
}

export default function DoctorAgenda() {
  const { user } = useAuth();
  const [vista, setVista] = useState('semana');
  const [fechaActual, setFechaActual] = useState(new Date());
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [citas, setCitas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    api.get('/appointments/')
      .then(({ data }) => {
        if (active) setCitas(data.map(mapAppointment));
      })
      .catch(() => {
        if (active) setError('No se pudo cargar tu agenda.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  const diasVisibles = useMemo(() => {
    if (vista === 'dia') return [fechaActual];
    return getDiasSemana(getLunesDeSemana(fechaActual));
  }, [vista, fechaActual]);

  const citasDelRango = useMemo(() => {
    const idsVisibles = new Set(diasVisibles.map(toISODate));
    return citas.filter(c => idsVisibles.has(c.date));
  }, [diasVisibles, citas]);

  function irAnterior() {
    const nueva = new Date(fechaActual);
    nueva.setDate(nueva.getDate() - (vista === 'dia' ? 1 : 7));
    setFechaActual(nueva);
  }
  function irSiguiente() {
    const nueva = new Date(fechaActual);
    nueva.setDate(nueva.getDate() + (vista === 'dia' ? 1 : 7));
    setFechaActual(nueva);
  }
  function irHoy() { setFechaActual(new Date()); }
  function citasEnCelda(dia, hora) {
    const fechaISO = toISODate(dia);
    return citas.filter(c => c.date === fechaISO && c.hour === hora);
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Cargando tu agenda...</div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">

      {/* ── Encabezado ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Stethoscope className="text-blue-600" size={24} />
            Mi Agenda
          </h1>
          <p className="text-slate-500 mt-1">
            Bienvenido, {displayName(user)}. Consulta tu disponibilidad y citas asignadas.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-2.5 rounded-xl shadow-sm shadow-blue-500/20">
          <CalendarDays size={16} className="text-blue-100" />
          <span className="text-sm font-medium">
            {citasDelRango.length} {citasDelRango.length === 1 ? 'cita' : 'citas'} en {vista === 'dia' ? 'este día' : 'esta semana'}
          </span>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-4 py-2 text-sm">{error}</div>
      )}

      {/* ── Controles ─────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-1">
          <button onClick={irAnterior} className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors">
            <ChevronLeft size={18} />
          </button>
          <span className="font-semibold text-slate-700 capitalize min-w-[170px] text-center">
            {formatMesAnio(fechaActual)}
          </span>
          <button onClick={irSiguiente} className="w-9 h-9 flex items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 hover:text-blue-600 transition-colors">
            <ChevronRight size={18} />
          </button>
          <button onClick={irHoy} className="ml-2 px-4 py-1.5 text-sm font-semibold rounded-lg border border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors">
            Hoy
          </button>
        </div>

        <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200">
          <button
            onClick={() => setVista('dia')}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${vista === 'dia' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Día
          </button>
          <button
            onClick={() => setVista('semana')}
            className={`px-4 py-1.5 text-sm font-semibold rounded-md transition-all ${vista === 'semana' ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Semana
          </button>
        </div>
      </div>

      {/* ── Grilla del calendario ─────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <div className="grid min-w-[600px]" style={{ gridTemplateColumns: `70px repeat(${diasVisibles.length}, 1fr)` }}>
            <div className="border-b border-r border-slate-100 bg-slate-50" />

            {diasVisibles.map((dia) => (
              <div key={toISODate(dia)} className={`flex flex-col items-center justify-center py-3 border-b border-r border-slate-100 last:border-r-0 relative ${esHoy(dia) ? 'bg-blue-50' : 'bg-slate-50'}`}>
                {esHoy(dia) && <span className="absolute top-1.5 w-1.5 h-1.5 rounded-full bg-blue-600" />}
                <span className="text-xs text-slate-400 uppercase tracking-wide">{formatDiaCorto(dia)}</span>
                <span className={`text-lg font-bold ${esHoy(dia) ? 'text-blue-600' : 'text-slate-700'}`}>{formatDiaNumero(dia)}</span>
              </div>
            ))}

            {HORAS.map((hora) => (
              <div key={hora} className="contents">
                <div className="flex items-start justify-end pr-2 pt-1 border-r border-b border-slate-100 text-xs text-slate-400 font-medium">
                  {hora}:00
                </div>
                {diasVisibles.map((dia) => {
                  const citasCelda = citasEnCelda(dia, hora);
                  return (
                    <div key={toISODate(dia) + hora} className={`min-h-[56px] border-r border-b border-slate-100 last:border-r-0 p-1 transition-colors ${esHoy(dia) ? 'bg-blue-50/30' : ''}`}>
                      {citasCelda.map((cita) => {
                        const s = estadoStyles[cita.status] ?? estadoStyles.pendiente;
                        return (
                          <button
                            key={cita.id}
                            onClick={() => setCitaSeleccionada(cita)}
                            className={`w-full text-left text-xs rounded-lg border px-2 py-1.5 mb-1 transition-all hover:shadow-sm hover:-translate-y-0.5 ${s.chip}`}
                          >
                            <p className="font-semibold truncate flex items-center gap-1">
                              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
                              {cita.patient}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Leyenda ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 mt-4 text-xs text-slate-500 flex-wrap">
        {Object.entries(estadoStyles).map(([key, s]) => (
          <span key={key} className="flex items-center gap-1.5">
            <span className={`w-2.5 h-2.5 rounded-full ${s.dot}`} /> {s.label}
          </span>
        ))}
      </div>

      {/* ── Modal de detalle ─────────────────────────────────────────── */}
      {citaSeleccionada && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => setCitaSeleccionada(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setCitaSeleccionada(null)} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
              <X size={18} />
            </button>

            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border mb-4 ${estadoStyles[citaSeleccionada.status].chip}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${estadoStyles[citaSeleccionada.status].dot}`} />
              {estadoStyles[citaSeleccionada.status].label}
            </span>

            <h3 className="text-lg font-bold text-slate-800 mb-1">{citaSeleccionada.patient}</h3>
            <p className="text-sm text-slate-500 capitalize mb-5">{formatFechaCompleta(citaSeleccionada.date)}</p>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <User size={16} className="text-slate-400 flex-shrink-0" />
                <span className="text-slate-700">{citaSeleccionada.specialty}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock size={16} className="text-slate-400 flex-shrink-0" />
                <span className="text-slate-700">{citaSeleccionada.timeLabel}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin size={16} className="text-slate-400 flex-shrink-0" />
                <span className="text-slate-700">{citaSeleccionada.consultorio}</span>
              </div>
            </div>

            <button onClick={() => setCitaSeleccionada(null)} className="btn btn-outline btn-sm w-full mt-6 border-slate-300 text-slate-600 hover:bg-slate-50">
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
