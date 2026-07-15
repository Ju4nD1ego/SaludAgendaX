import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search,
  Stethoscope,
  Building2,
  MapPin,
  CalendarClock,
  RotateCcw,
  UserCheck,
  UserX,
  X,
  Clock,
} from 'lucide-react';
import api from '../../api/client';
import { doctorDisplayName } from '../../utils/appointments';

const filtrosVacios = { q: '', specialty: '', isActive: '' };

function buildQueryString(filtros) {
  const params = new URLSearchParams();
  if (filtros.q.trim()) params.set('q', filtros.q.trim());
  if (filtros.specialty) params.set('specialty', filtros.specialty);
  if (filtros.isActive) params.set('is_active', filtros.isActive);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

// HH:MM:SS -> HH:MM
function formatHora(hhmmss) {
  return hhmmss?.slice(0, 5) ?? '';
}

export default function AdminMedicos() {
  const [filtros, setFiltros] = useState(filtrosVacios);
  const [medicos, setMedicos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [citasHoyPorMedico, setCitasHoyPorMedico] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [procesandoId, setProcesandoId] = useState(null);
  const [medicoSeleccionado, setMedicoSeleccionado] = useState(null);

  // Catálogo de especialidades para el filtro.
  useEffect(() => {
    let active = true;
    api.get('/specialties/')
      .then(({ data }) => { if (active) setEspecialidades(data); })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  // Carga de citas de hoy, una sola vez, para calcular la carga de cada médico.
  useEffect(() => {
    let active = true;
    const hoyISO = toISODate(new Date());
    api.get(`/appointments/?date=${hoyISO}`)
      .then(({ data }) => {
        if (!active) return;
        const conteo = {};
        data
          .filter((apt) => apt.status !== 'cancelada')
          .forEach((apt) => {
            conteo[apt.doctor] = (conteo[apt.doctor] ?? 0) + 1;
          });
        setCitasHoyPorMedico(conteo);
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  const buscar = useCallback((filtrosActuales) => {
    setLoading(true);
    setError('');
    api.get(`/doctors/${buildQueryString(filtrosActuales)}`)
      .then(({ data }) => setMedicos(data))
      .catch(() => setError('No se pudieron cargar los médicos. Intenta de nuevo.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    buscar(filtrosVacios);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => buscar(filtros), filtros.q ? 400 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.q, filtros.specialty, filtros.isActive]);

  function actualizarFiltro(campo, valor) {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  }

  function limpiarFiltros() {
    setFiltros(filtrosVacios);
  }

  const hayFiltrosActivos = filtros.q !== '' || filtros.specialty !== '' || filtros.isActive !== '';

  const stats = useMemo(() => ({
    total: medicos.length,
    activos: medicos.filter((m) => m.is_active_doctor).length,
    inactivos: medicos.filter((m) => !m.is_active_doctor).length,
  }), [medicos]);

  async function handleCambiarEstado(medico) {
    setProcesandoId(medico.id);
    setError('');
    const accion = medico.is_active_doctor ? 'deactivate' : 'activate';
    try {
      const { data } = await api.post(`/doctors/${medico.id}/${accion}/`);
      setMedicos((prev) => prev.map((m) => (m.id === medico.id ? data : m)));
      setMedicoSeleccionado((prev) => (prev && prev.id === medico.id ? data : prev));
    } catch {
      setError('No se pudo actualizar el estado del médico.');
    } finally {
      setProcesandoId(null);
    }
  }

  function resumenHorario(schedules) {
    if (!schedules || schedules.length === 0) return null;
    const visibles = schedules.slice(0, 3);
    const restantes = schedules.length - visibles.length;
    return (
      <div className="flex flex-wrap gap-1">
        {visibles.map((s) => (
          <span
            key={s.id}
            className="text-[11px] font-medium text-slate-500 bg-slate-100 rounded-full px-2 py-0.5 whitespace-nowrap"
          >
            {s.day_of_week_display.slice(0, 3)} {formatHora(s.start_time)}–{formatHora(s.end_time)}
          </span>
        ))}
        {restantes > 0 && (
          <span className="text-[11px] font-medium text-slate-400">+{restantes} más</span>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">

      {/* ── Encabezado ────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Stethoscope className="text-blue-600" size={24} />
          Médicos
        </h1>
        <p className="text-slate-500 mt-1">Consulta el estado, especialidad y agenda semanal de cada médico.</p>
      </div>

      {error && (
        <div className="alert alert-error mb-4 py-2 text-sm">{error}</div>
      )}

      {/* ── Tarjetas de resumen ───────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mt-1">Total</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{stats.activos}</p>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mt-1">Activos</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-slate-400">{stats.inactivos}</p>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mt-1">Inactivos</p>
        </div>
      </div>

      {/* ── Panel de filtros ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">
              Buscar
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Nombre o especialidad..."
                value={filtros.q}
                onChange={(e) => actualizarFiltro('q', e.target.value)}
                className="input input-bordered input-sm w-full pl-8 bg-slate-50 border-slate-300 text-slate-700"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">
              Especialidad
            </label>
            <select
              value={filtros.specialty}
              onChange={(e) => actualizarFiltro('specialty', e.target.value)}
              className="select select-bordered select-sm w-full bg-slate-50 border-slate-300 text-slate-700"
            >
              <option value="">Todas</option>
              {especialidades.map((esp) => (
                <option key={esp.id} value={esp.id}>{esp.name}</option>
              ))}
            </select>
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">
                Estado
              </label>
              <select
                value={filtros.isActive}
                onChange={(e) => actualizarFiltro('isActive', e.target.value)}
                className="select select-bordered select-sm w-full bg-slate-50 border-slate-300 text-slate-700"
              >
                <option value="">Todos</option>
                <option value="true">Activos</option>
                <option value="false">Inactivos</option>
              </select>
            </div>
            {hayFiltrosActivos && (
              <button
                onClick={limpiarFiltros}
                className="btn btn-ghost btn-sm text-slate-400 hover:text-red-600 gap-1"
                title="Limpiar filtros"
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Resultados ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">
            Resultados
            {!loading && <span className="text-slate-400 font-normal"> · {medicos.length}</span>}
          </h3>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-400 text-sm">Buscando médicos...</div>
        ) : medicos.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Stethoscope size={32} className="mb-2" />
            <p className="text-sm">No se encontraron médicos con esos filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-slate-500 font-semibold text-xs uppercase">Médico</th>
                  <th className="text-slate-500 font-semibold text-xs uppercase">Especialidad</th>
                  <th className="text-slate-500 font-semibold text-xs uppercase">Consultorio</th>
                  <th className="text-slate-500 font-semibold text-xs uppercase">Horario semanal</th>
                  <th className="text-slate-500 font-semibold text-xs uppercase">Citas hoy</th>
                  <th className="text-slate-500 font-semibold text-xs uppercase">Estado</th>
                  <th className="text-slate-500 font-semibold text-xs uppercase">Acción</th>
                </tr>
              </thead>
              <tbody>
                {medicos.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/60 transition-colors">
                    <td>
                      <button
                        onClick={() => setMedicoSeleccionado(m)}
                        className="font-medium text-slate-700 hover:text-blue-600 hover:underline text-left"
                      >
                        {doctorDisplayName(m)}
                      </button>
                    </td>
                    <td className="text-slate-600 text-sm">{m.specialty.name}</td>
                    <td className="text-slate-600 text-sm">
                      <span className="flex items-center gap-1.5">
                        <MapPin size={13} className="text-slate-400" />
                        {m.consultorio || 'Por confirmar'}
                      </span>
                    </td>
                    <td className="min-w-[220px]">
                      {resumenHorario(m.schedules) ?? (
                        <span className="text-xs text-slate-400">Sin horario configurado</span>
                      )}
                    </td>
                    <td className="text-slate-700 text-sm font-semibold text-center">
                      {citasHoyPorMedico[m.id] ?? 0}
                    </td>
                    <td>
                      <span className={`badge badge-sm ${m.is_active_doctor ? 'badge-success' : 'badge-ghost'}`}>
                        {m.is_active_doctor ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      <button
                        onClick={() => handleCambiarEstado(m)}
                        disabled={procesandoId === m.id}
                        className={`btn btn-ghost btn-xs gap-1 disabled:opacity-50 ${
                          m.is_active_doctor ? 'text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {m.is_active_doctor ? <UserX size={13} /> : <UserCheck size={13} />}
                        {procesandoId === m.id
                          ? 'Procesando...'
                          : m.is_active_doctor ? 'Desactivar' : 'Activar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal: detalle de médico ──────────────────────────────────── */}
      {medicoSeleccionado && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setMedicoSeleccionado(null)}
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setMedicoSeleccionado(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X size={18} />
            </button>

            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border mb-4 ${
              medicoSeleccionado.is_active_doctor
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}>
              {medicoSeleccionado.is_active_doctor ? 'Activo' : 'Inactivo'}
            </span>

            <h3 className="text-lg font-bold text-slate-800 mb-1">{doctorDisplayName(medicoSeleccionado)}</h3>
            <p className="text-sm text-slate-500 mb-5">{medicoSeleccionado.specialty.name}</p>

            <div className="space-y-3 mb-5">
              <div className="flex items-center gap-3 text-sm">
                <MapPin size={16} className="text-slate-400 flex-shrink-0" />
                <span className="text-slate-700">{medicoSeleccionado.consultorio || 'Consultorio por confirmar'}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Building2 size={16} className="text-slate-400 flex-shrink-0" />
                <span className="text-slate-700">{medicoSeleccionado.user.email}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <CalendarClock size={16} className="text-slate-400 flex-shrink-0" />
                <span className="text-slate-700">
                  {citasHoyPorMedico[medicoSeleccionado.id] ?? 0} citas hoy
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 mb-1">
              <Clock size={14} className="text-slate-400" />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Horario semanal</p>
            </div>
            {medicoSeleccionado.schedules.length === 0 ? (
              <p className="text-sm text-slate-400">Sin horario configurado.</p>
            ) : (
              <ul className="space-y-1.5 mb-2">
                {medicoSeleccionado.schedules.map((s) => (
                  <li key={s.id} className="flex justify-between text-sm">
                    <span className="text-slate-600">{s.day_of_week_display}</span>
                    <span className="text-slate-700 font-medium">
                      {formatHora(s.start_time)}–{formatHora(s.end_time)}
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <button
              onClick={() => handleCambiarEstado(medicoSeleccionado)}
              disabled={procesandoId === medicoSeleccionado.id}
              className={`btn btn-sm w-full mt-4 border-none text-white disabled:opacity-60 ${
                medicoSeleccionado.is_active_doctor
                  ? 'bg-gradient-to-r from-red-600 to-red-500'
                  : 'bg-gradient-to-r from-emerald-600 to-emerald-500'
              }`}
            >
              {procesandoId === medicoSeleccionado.id
                ? 'Procesando...'
                : medicoSeleccionado.is_active_doctor ? 'Desactivar médico' : 'Activar médico'}
            </button>
            <button
              onClick={() => setMedicoSeleccionado(null)}
              className="btn btn-outline btn-sm w-full mt-2 border-slate-300 text-slate-600 hover:bg-slate-50"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
