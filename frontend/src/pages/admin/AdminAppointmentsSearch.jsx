import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search,
  Filter,
  X,
  User,
  Clock,
  MapPin,
  RotateCcw,
  CalendarSearch,
} from 'lucide-react';
import api from '../../api/client';
import { mapAppointment, doctorDisplayName } from '../../utils/appointments';

const statusConfig = {
  confirmada: { label: 'Confirmada', className: 'badge-success' },
  pendiente:  { label: 'Pendiente',  className: 'badge-warning' },
  cancelada:  { label: 'Cancelada',  className: 'badge-error'   },
  atendida:   { label: 'Atendida',   className: 'badge-info'    },
  no_asistio: { label: 'No Asistió', className: 'badge-ghost'   },
};

const filtrosVacios = {
  q: '',
  dateFrom: '',
  dateTo: '',
  doctor: '',
  specialty: '',
  status: '',
};

function buildQueryString(filtros) {
  const params = new URLSearchParams();
  if (filtros.q.trim()) params.set('q', filtros.q.trim());
  if (filtros.dateFrom) params.set('date_from', filtros.dateFrom);
  if (filtros.dateTo) params.set('date_to', filtros.dateTo);
  if (filtros.doctor) params.set('doctor', filtros.doctor);
  if (filtros.specialty) params.set('specialty', filtros.specialty);
  if (filtros.status) params.set('status', filtros.status);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export default function AdminAppointmentsSearch() {
  const [filtros, setFiltros] = useState(filtrosVacios);
  const [citas, setCitas] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [especialidades, setEspecialidades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [procesandoId, setProcesandoId] = useState(null);

  // Catálogos para los selects de filtro.
  useEffect(() => {
    let active = true;
    Promise.all([api.get('/doctors/'), api.get('/specialties/')])
      .then(([medicosRes, espRes]) => {
        if (!active) return;
        setMedicos(medicosRes.data);
        setEspecialidades(espRes.data);
      })
      .catch(() => {
        if (active) setError('No se pudieron cargar los catálogos de filtro.');
      });
    return () => { active = false; };
  }, []);

  const buscar = useCallback((filtrosActuales) => {
    setLoading(true);
    setError('');
    api.get(`/appointments/${buildQueryString(filtrosActuales)}`)
      .then(({ data }) => setCitas(data.map(mapAppointment)))
      .catch(() => setError('No se pudieron cargar las citas. Intenta de nuevo.'))
      .finally(() => setLoading(false));
  }, []);

  // Carga inicial.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    buscar(filtrosVacios);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Los selects/fecha disparan búsqueda inmediata; el texto se debounce.
  useEffect(() => {
    const timer = setTimeout(() => buscar(filtros), filtros.q ? 400 : 0);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.dateFrom, filtros.dateTo, filtros.doctor, filtros.specialty, filtros.status, filtros.q]);

  function actualizarCitaLocal(id, cambios) {
    setCitas((prev) => prev.map((c) => (c.id === id ? { ...c, ...cambios } : c)));
    setCitaSeleccionada((prev) => (prev && prev.id === id ? { ...prev, ...cambios } : prev));
  }

  async function handleConfirmar(id) {
    setProcesandoId(id);
    try {
      await api.patch(`/appointments/${id}/confirm/`);
      actualizarCitaLocal(id, { status: 'confirmada' });
    } catch {
      setError('No se pudo confirmar la cita.');
    } finally {
      setProcesandoId(null);
    }
  }

  async function handleCancelar(id) {
    setProcesandoId(id);
    try {
      await api.patch(`/appointments/${id}/cancel/`);
      actualizarCitaLocal(id, { status: 'cancelada' });
    } catch {
      setError('No se pudo cancelar la cita.');
    } finally {
      setProcesandoId(null);
    }
  }

  function actualizarFiltro(campo, valor) {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  }

  function limpiarFiltros() {
    setFiltros(filtrosVacios);
  }

  const hayFiltrosActivos = useMemo(
    () => Object.values(filtros).some((v) => v !== ''),
    [filtros],
  );

  const citasOrdenadas = useMemo(
    () => [...citas].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)),
    [citas],
  );

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">

      {/* ── Encabezado ────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <CalendarSearch className="text-blue-600" size={24} />
          Búsqueda de Citas
        </h1>
        <p className="text-slate-500 mt-1">
          Filtra por fecha, médico, especialidad o estado para encontrar citas.
        </p>
      </div>

      {error && (
        <div className="alert alert-error mb-4 py-2 text-sm">{error}</div>
      )}

      {/* ── Panel de filtros ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Filter size={16} className="text-blue-600" />
          <h3 className="font-semibold text-slate-700 text-sm">Filtros</h3>
          {hayFiltrosActivos && (
            <button
              onClick={limpiarFiltros}
              className="ml-auto flex items-center gap-1 text-xs font-semibold text-slate-400 hover:text-red-600 transition-colors"
            >
              <RotateCcw size={13} /> Limpiar filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          <div className="lg:col-span-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">
              Paciente
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Nombre o documento..."
                value={filtros.q}
                onChange={(e) => actualizarFiltro('q', e.target.value)}
                className="input input-bordered input-sm w-full pl-8 bg-slate-50 border-slate-300 text-slate-700"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">
              Desde
            </label>
            <input
              type="date"
              value={filtros.dateFrom}
              onChange={(e) => actualizarFiltro('dateFrom', e.target.value)}
              className="input input-bordered input-sm w-full bg-slate-50 border-slate-300 text-slate-700"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">
              Hasta
            </label>
            <input
              type="date"
              value={filtros.dateTo}
              onChange={(e) => actualizarFiltro('dateTo', e.target.value)}
              className="input input-bordered input-sm w-full bg-slate-50 border-slate-300 text-slate-700"
            />
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

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">
              Estado
            </label>
            <select
              value={filtros.status}
              onChange={(e) => actualizarFiltro('status', e.target.value)}
              className="select select-bordered select-sm w-full bg-slate-50 border-slate-300 text-slate-700"
            >
              <option value="">Todos</option>
              {Object.entries(statusConfig).map(([value, cfg]) => (
                <option key={value} value={value}>{cfg.label}</option>
              ))}
            </select>
          </div>

          <div className="lg:col-span-2">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">
              Médico
            </label>
            <select
              value={filtros.doctor}
              onChange={(e) => actualizarFiltro('doctor', e.target.value)}
              className="select select-bordered select-sm w-full bg-slate-50 border-slate-300 text-slate-700"
            >
              <option value="">Todos</option>
              {medicos.map((m) => (
                <option key={m.id} value={m.id}>{doctorDisplayName(m)} · {m.specialty.name}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ── Resultados ────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">
            Resultados
            {!loading && <span className="text-slate-400 font-normal"> · {citasOrdenadas.length}</span>}
          </h3>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-400 text-sm">Buscando citas...</div>
        ) : citasOrdenadas.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <CalendarSearch size={32} className="mb-2" />
            <p className="text-sm">No se encontraron citas con esos filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-slate-500 font-semibold text-xs uppercase">Fecha</th>
                  <th className="text-slate-500 font-semibold text-xs uppercase">Hora</th>
                  <th className="text-slate-500 font-semibold text-xs uppercase">Paciente</th>
                  <th className="text-slate-500 font-semibold text-xs uppercase">Especialidad</th>
                  <th className="text-slate-500 font-semibold text-xs uppercase">Médico</th>
                  <th className="text-slate-500 font-semibold text-xs uppercase">Estado</th>
                  <th className="text-slate-500 font-semibold text-xs uppercase">Acción</th>
                </tr>
              </thead>
              <tbody>
                {citasOrdenadas.map((cita) => {
                  const s = statusConfig[cita.status] ?? statusConfig.pendiente;
                  return (
                    <tr key={cita.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="text-sm text-slate-600 whitespace-nowrap">{cita.date}</td>
                      <td className="font-mono text-sm text-slate-600">{cita.timeLabel}</td>
                      <td className="font-medium text-slate-700">{cita.patient}</td>
                      <td className="text-slate-600 text-sm">{cita.specialty}</td>
                      <td className="text-slate-600 text-sm">{cita.doctor}</td>
                      <td>
                        <span className={`badge ${s.className} badge-sm`}>{s.label}</span>
                      </td>
                      <td className="flex items-center gap-1">
                        <button
                          onClick={() => setCitaSeleccionada(cita)}
                          className="btn btn-ghost btn-xs text-blue-600 hover:bg-blue-50"
                        >
                          Ver
                        </button>
                        {cita.status === 'pendiente' && (
                          <button
                            onClick={() => handleConfirmar(cita.id)}
                            disabled={procesandoId === cita.id}
                            className="btn btn-ghost btn-xs text-emerald-600 hover:bg-emerald-50 disabled:opacity-50"
                          >
                            Confirmar
                          </button>
                        )}
                        {(cita.status === 'pendiente' || cita.status === 'confirmada') && (
                          <button
                            onClick={() => handleCancelar(cita.id)}
                            disabled={procesandoId === cita.id}
                            className="btn btn-ghost btn-xs text-red-600 hover:bg-red-50 disabled:opacity-50"
                          >
                            Cancelar
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modal: detalle de cita ────────────────────────────────────── */}
      {citaSeleccionada && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setCitaSeleccionada(null)}
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setCitaSeleccionada(null)}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X size={18} />
            </button>
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border mb-4 bg-blue-50 border-blue-200 text-blue-700`}>
              {(statusConfig[citaSeleccionada.status] ?? statusConfig.pendiente).label}
            </span>
            <h3 className="text-lg font-bold text-slate-800 mb-1">{citaSeleccionada.patient}</h3>
            <p className="text-sm text-slate-500 mb-5">{citaSeleccionada.specialty}</p>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <User size={16} className="text-slate-400 flex-shrink-0" />
                <span className="text-slate-700">{citaSeleccionada.doctor}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Clock size={16} className="text-slate-400 flex-shrink-0" />
                <span className="text-slate-700">{citaSeleccionada.date} · {citaSeleccionada.timeLabel}</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <MapPin size={16} className="text-slate-400 flex-shrink-0" />
                <span className="text-slate-700">{citaSeleccionada.consultorio}</span>
              </div>
            </div>

            {citaSeleccionada.status === 'pendiente' && (
              <button
                onClick={() => handleConfirmar(citaSeleccionada.id)}
                disabled={procesandoId === citaSeleccionada.id}
                className="btn btn-sm w-full mt-6 border-none text-white bg-gradient-to-r from-emerald-600 to-emerald-500 disabled:opacity-60"
              >
                Confirmar Cita
              </button>
            )}
            {(citaSeleccionada.status === 'pendiente' || citaSeleccionada.status === 'confirmada') && (
              <button
                onClick={() => handleCancelar(citaSeleccionada.id)}
                disabled={procesandoId === citaSeleccionada.id}
                className="btn btn-error btn-outline btn-sm w-full mt-2 disabled:opacity-60"
              >
                Cancelar Cita
              </button>
            )}

            <button
              onClick={() => setCitaSeleccionada(null)}
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
