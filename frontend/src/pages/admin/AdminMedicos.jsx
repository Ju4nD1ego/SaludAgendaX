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
  Pencil,
  Check,
  Plus,
  Trash2,
} from 'lucide-react';
import api from '../../api/client';
import { doctorDisplayName } from '../../utils/appointments';

const DIAS_SEMANA = [
  { value: 0, label: 'Lunes' },
  { value: 1, label: 'Martes' },
  { value: 2, label: 'Miércoles' },
  { value: 3, label: 'Jueves' },
  { value: 4, label: 'Viernes' },
  { value: 5, label: 'Sábado' },
  { value: 6, label: 'Domingo' },
];

const nuevoHorarioVacio = { day_of_week: 0, start_time: '08:00', end_time: '12:00' };

const nuevoMedicoVacio = {
  first_name: '', last_name: '', email: '', password: '', specialty_id: '', consultorio: '',
};

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
  const [editandoDatos, setEditandoDatos] = useState(false);
  const [borradorMedico, setBorradorMedico] = useState(null);
  const [guardandoMedico, setGuardandoMedico] = useState(false);
  const [nuevoHorario, setNuevoHorario] = useState(nuevoHorarioVacio);
  const [agregandoHorario, setAgregandoHorario] = useState(false);
  const [borrandoHorarioId, setBorrandoHorarioId] = useState(null);
  const [mostrarNuevaEspecialidad, setMostrarNuevaEspecialidad] = useState(false);
  const [nombreEspecialidad, setNombreEspecialidad] = useState('');
  const [costoEspecialidad, setCostoEspecialidad] = useState('');
  const [creandoEspecialidad, setCreandoEspecialidad] = useState(false);
  const [mostrarNuevoMedico, setMostrarNuevoMedico] = useState(false);
  const [nuevoMedico, setNuevoMedico] = useState(nuevoMedicoVacio);
  const [creandoMedico, setCreandoMedico] = useState(false);
  const [errorNuevoMedico, setErrorNuevoMedico] = useState('');

  function cargarEspecialidades() {
    return api.get('/specialties/').then(({ data }) => setEspecialidades(data));
  }

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  function abrirMedico(medico) {
    setMedicoSeleccionado(medico);
    setBorradorMedico({ specialty_id: medico.specialty.id, consultorio: medico.consultorio });
    setEditandoDatos(false);
    setNuevoHorario(nuevoHorarioVacio);
    setAgregandoHorario(false);
  }

  function cerrarModalMedico() {
    setMedicoSeleccionado(null);
    setEditandoDatos(false);
  }

  function actualizarMedicoLocal(data) {
    setMedicos((prev) => prev.map((m) => (m.id === data.id ? data : m)));
    setMedicoSeleccionado(data);
  }

  async function handleGuardarMedico() {
    setGuardandoMedico(true);
    setError('');
    try {
      const { data } = await api.patch(`/doctors/${medicoSeleccionado.id}/`, borradorMedico);
      actualizarMedicoLocal(data);
      setEditandoDatos(false);
    } catch {
      setError('No se pudieron guardar los cambios del médico.');
    } finally {
      setGuardandoMedico(false);
    }
  }

  async function handleAgregarHorario() {
    setAgregandoHorario(true);
    setError('');
    try {
      await api.post('/doctor-schedules/', {
        doctor: medicoSeleccionado.id,
        day_of_week: Number(nuevoHorario.day_of_week),
        start_time: nuevoHorario.start_time,
        end_time: nuevoHorario.end_time,
      });
      const { data } = await api.get(`/doctors/${medicoSeleccionado.id}/`);
      actualizarMedicoLocal(data);
      setNuevoHorario(nuevoHorarioVacio);
    } catch (err) {
      const msg = err?.response?.data?.non_field_errors?.[0] || 'No se pudo agregar el horario.';
      setError(msg);
    } finally {
      setAgregandoHorario(false);
    }
  }

  async function handleBorrarHorario(scheduleId) {
    setBorrandoHorarioId(scheduleId);
    setError('');
    try {
      await api.delete(`/doctor-schedules/${scheduleId}/`);
      const { data } = await api.get(`/doctors/${medicoSeleccionado.id}/`);
      actualizarMedicoLocal(data);
    } catch {
      setError('No se pudo borrar el horario.');
    } finally {
      setBorrandoHorarioId(null);
    }
  }

  async function handleCrearEspecialidad(e) {
    e.preventDefault();
    if (!nombreEspecialidad.trim()) return;
    setCreandoEspecialidad(true);
    setError('');
    try {
      await api.post('/specialties/', {
        name: nombreEspecialidad.trim(),
        cost: costoEspecialidad === '' ? 0 : Number(costoEspecialidad),
      });
      await cargarEspecialidades();
      setNombreEspecialidad('');
      setCostoEspecialidad('');
      setMostrarNuevaEspecialidad(false);
    } catch {
      setError('No se pudo crear la especialidad (¿ya existe?).');
    } finally {
      setCreandoEspecialidad(false);
    }
  }

  function cerrarModalNuevoMedico() {
    setMostrarNuevoMedico(false);
    setNuevoMedico(nuevoMedicoVacio);
    setErrorNuevoMedico('');
  }

  async function handleCrearMedico(e) {
    e.preventDefault();
    if (!nuevoMedico.email.trim() || !nuevoMedico.password || !nuevoMedico.specialty_id) {
      setErrorNuevoMedico('Correo, contraseña y especialidad son obligatorios.');
      return;
    }
    setCreandoMedico(true);
    setErrorNuevoMedico('');
    try {
      const { data } = await api.post('/doctors/', {
        username: nuevoMedico.email.trim(),
        email: nuevoMedico.email.trim(),
        password: nuevoMedico.password,
        first_name: nuevoMedico.first_name.trim(),
        last_name: nuevoMedico.last_name.trim(),
        specialty_id: Number(nuevoMedico.specialty_id),
        consultorio: nuevoMedico.consultorio.trim(),
      });
      setMedicos((prev) => [...prev, data].sort((a, b) =>
        doctorDisplayName(a).localeCompare(doctorDisplayName(b))));
      cerrarModalNuevoMedico();
    } catch (err) {
      const data = err?.response?.data;
      const msg = data?.email?.[0] || data?.username?.[0] || data?.password?.[0]
        || 'No se pudo crear el médico.';
      setErrorNuevoMedico(msg);
    } finally {
      setCreandoMedico(false);
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
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Stethoscope className="text-blue-600" size={24} />
            Médicos
          </h1>
          <p className="text-slate-500 mt-1">Consulta el estado, especialidad y agenda semanal de cada médico.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setMostrarNuevaEspecialidad(true)}
            className="btn btn-outline btn-sm border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-600 gap-1.5"
          >
            <Plus size={14} /> Nueva especialidad
          </button>
          <button
            onClick={() => setMostrarNuevoMedico(true)}
            className="btn btn-sm bg-gradient-to-r from-blue-600 to-blue-500 text-white border-none gap-1.5"
          >
            <Plus size={14} /> Nuevo médico
          </button>
        </div>
      </div>

      {error && (
        <div className="alert alert-error mb-4 py-2 text-sm">{error}</div>
      )}

      {mostrarNuevaEspecialidad && (
        <form
          onSubmit={handleCrearEspecialidad}
          className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-6 flex items-end gap-3"
        >
          <div className="flex-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">
              Nombre de la especialidad
            </label>
            <input
              type="text"
              autoFocus
              placeholder="Ej: Pediatría"
              value={nombreEspecialidad}
              onChange={(e) => setNombreEspecialidad(e.target.value)}
              className="input input-bordered input-sm w-full bg-slate-50 border-slate-300 text-slate-700"
            />
          </div>
          <div className="w-40">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">
              Costo consulta
            </label>
            <input
              type="number"
              min="0"
              placeholder="0"
              value={costoEspecialidad}
              onChange={(e) => setCostoEspecialidad(e.target.value)}
              className="input input-bordered input-sm w-full bg-slate-50 border-slate-300 text-slate-700"
            />
          </div>
          <button
            type="submit"
            disabled={creandoEspecialidad}
            className="btn btn-sm bg-gradient-to-r from-blue-600 to-blue-500 text-white border-none disabled:opacity-60"
          >
            {creandoEspecialidad ? 'Creando...' : 'Crear'}
          </button>
          <button
            type="button"
            onClick={() => { setMostrarNuevaEspecialidad(false); setNombreEspecialidad(''); setCostoEspecialidad(''); }}
            className="btn btn-ghost btn-sm text-slate-500"
          >
            Cancelar
          </button>
        </form>
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
                        onClick={() => abrirMedico(m)}
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

      {/* ── Modal: detalle / edición de médico ──────────────────────────── */}
      {medicoSeleccionado && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={cerrarModalMedico}
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative my-8" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={cerrarModalMedico}
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

            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-slate-800">{doctorDisplayName(medicoSeleccionado)}</h3>
              {!editandoDatos ? (
                <button
                  onClick={() => setEditandoDatos(true)}
                  className="btn btn-sm btn-outline border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-600 gap-1.5"
                >
                  <Pencil size={14} /> Editar
                </button>
              ) : (
                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      setEditandoDatos(false);
                      setBorradorMedico({ specialty_id: medicoSeleccionado.specialty.id, consultorio: medicoSeleccionado.consultorio });
                    }}
                    className="btn btn-sm btn-ghost text-slate-500"
                  >
                    <X size={14} />
                  </button>
                  <button
                    onClick={handleGuardarMedico}
                    disabled={guardandoMedico}
                    className="btn btn-sm bg-gradient-to-r from-blue-600 to-blue-500 text-white border-none disabled:opacity-60"
                  >
                    <Check size={14} />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3 mb-5">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                  <Stethoscope size={14} /> Especialidad
                </label>
                {editandoDatos ? (
                  <select
                    value={borradorMedico.specialty_id}
                    onChange={(e) => setBorradorMedico({ ...borradorMedico, specialty_id: Number(e.target.value) })}
                    className="select select-bordered select-sm w-full bg-slate-50 border-slate-300 text-slate-700"
                  >
                    {especialidades.map((esp) => (
                      <option key={esp.id} value={esp.id}>{esp.name}</option>
                    ))}
                  </select>
                ) : (
                  <p className="text-slate-700 text-sm">{medicoSeleccionado.specialty.name}</p>
                )}
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                  <MapPin size={14} /> Consultorio
                </label>
                {editandoDatos ? (
                  <input
                    type="text"
                    value={borradorMedico.consultorio}
                    onChange={(e) => setBorradorMedico({ ...borradorMedico, consultorio: e.target.value })}
                    className="input input-bordered input-sm w-full bg-slate-50 border-slate-300 text-slate-800"
                  />
                ) : (
                  <p className="text-slate-700 text-sm">{medicoSeleccionado.consultorio || 'Sin asignar'}</p>
                )}
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

            <div className="flex items-center gap-2 mb-2">
              <Clock size={14} className="text-slate-400" />
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Horario semanal</p>
            </div>
            {medicoSeleccionado.schedules.length === 0 ? (
              <p className="text-sm text-slate-400 mb-2">Sin horario configurado.</p>
            ) : (
              <ul className="space-y-1.5 mb-3">
                {medicoSeleccionado.schedules.map((s) => (
                  <li key={s.id} className="flex items-center justify-between text-sm bg-slate-50 rounded-lg px-2.5 py-1.5">
                    <span className="text-slate-600">{s.day_of_week_display}</span>
                    <span className="text-slate-700 font-medium">
                      {formatHora(s.start_time)}–{formatHora(s.end_time)}
                    </span>
                    <button
                      onClick={() => handleBorrarHorario(s.id)}
                      disabled={borrandoHorarioId === s.id}
                      className="text-slate-400 hover:text-red-600 disabled:opacity-50"
                      title="Borrar bloque"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-end gap-2 mb-5 bg-blue-50/50 border border-blue-100 rounded-xl p-3">
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Día</label>
                <select
                  value={nuevoHorario.day_of_week}
                  onChange={(e) => setNuevoHorario({ ...nuevoHorario, day_of_week: e.target.value })}
                  className="select select-bordered select-xs bg-white border-slate-300 text-slate-700"
                >
                  {DIAS_SEMANA.map((d) => (
                    <option key={d.value} value={d.value}>{d.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Desde</label>
                <input
                  type="time"
                  value={nuevoHorario.start_time}
                  onChange={(e) => setNuevoHorario({ ...nuevoHorario, start_time: e.target.value })}
                  className="input input-bordered input-xs bg-white border-slate-300 text-slate-700"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Hasta</label>
                <input
                  type="time"
                  value={nuevoHorario.end_time}
                  onChange={(e) => setNuevoHorario({ ...nuevoHorario, end_time: e.target.value })}
                  className="input input-bordered input-xs bg-white border-slate-300 text-slate-700"
                />
              </div>
              <button
                onClick={handleAgregarHorario}
                disabled={agregandoHorario}
                className="btn btn-xs bg-gradient-to-r from-blue-600 to-blue-500 text-white border-none gap-1 disabled:opacity-60"
              >
                <Plus size={12} /> Agregar
              </button>
            </div>

            <button
              onClick={() => handleCambiarEstado(medicoSeleccionado)}
              disabled={procesandoId === medicoSeleccionado.id}
              className={`btn btn-sm w-full border-none text-white disabled:opacity-60 ${
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
              onClick={cerrarModalMedico}
              className="btn btn-outline btn-sm w-full mt-2 border-slate-300 text-slate-600 hover:bg-slate-50"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* ── Modal: nuevo médico ──────────────────────────────────────── */}
      {mostrarNuevoMedico && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={cerrarModalNuevoMedico}
        >
          <form
            onSubmit={handleCrearMedico}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={cerrarModalNuevoMedico}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Stethoscope className="text-blue-600" size={20} /> Nuevo médico
            </h3>

            {errorNuevoMedico && (
              <div className="alert alert-error mb-4 py-2 text-sm">{errorNuevoMedico}</div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Nombre</label>
                <input
                  type="text"
                  value={nuevoMedico.first_name}
                  onChange={(e) => setNuevoMedico({ ...nuevoMedico, first_name: e.target.value })}
                  className="input input-bordered input-sm w-full bg-slate-50 border-slate-300 text-slate-700"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Apellido</label>
                <input
                  type="text"
                  value={nuevoMedico.last_name}
                  onChange={(e) => setNuevoMedico({ ...nuevoMedico, last_name: e.target.value })}
                  className="input input-bordered input-sm w-full bg-slate-50 border-slate-300 text-slate-700"
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Correo *</label>
              <input
                type="email"
                required
                value={nuevoMedico.email}
                onChange={(e) => setNuevoMedico({ ...nuevoMedico, email: e.target.value })}
                className="input input-bordered input-sm w-full bg-slate-50 border-slate-300 text-slate-700"
              />
            </div>

            <div className="mb-3">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Contraseña *</label>
              <input
                type="password"
                required
                minLength={8}
                value={nuevoMedico.password}
                onChange={(e) => setNuevoMedico({ ...nuevoMedico, password: e.target.value })}
                className="input input-bordered input-sm w-full bg-slate-50 border-slate-300 text-slate-700"
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-5">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Especialidad *</label>
                <select
                  required
                  value={nuevoMedico.specialty_id}
                  onChange={(e) => setNuevoMedico({ ...nuevoMedico, specialty_id: e.target.value })}
                  className="select select-bordered select-sm w-full bg-slate-50 border-slate-300 text-slate-700"
                >
                  <option value="">Selecciona...</option>
                  {especialidades.map((esp) => (
                    <option key={esp.id} value={esp.id}>{esp.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Consultorio</label>
                <input
                  type="text"
                  value={nuevoMedico.consultorio}
                  onChange={(e) => setNuevoMedico({ ...nuevoMedico, consultorio: e.target.value })}
                  className="input input-bordered input-sm w-full bg-slate-50 border-slate-300 text-slate-700"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={creandoMedico}
              className="btn btn-sm w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white border-none disabled:opacity-60"
            >
              {creandoMedico ? 'Creando...' : 'Crear médico'}
            </button>
            <p className="text-xs text-slate-400 mt-3">
              Podrás agregar los horarios de atención después de crearlo, desde su ficha.
            </p>
          </form>
        </div>
      )}
    </div>
  );
}
