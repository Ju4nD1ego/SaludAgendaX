import { useState, useEffect, useMemo } from 'react';
import {
  CalendarCheck,
  Users,
  Stethoscope,
  Clock,
  TrendingUp,
  BarChart3,
  X,
  User,
  MapPin,
  Plus,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/client';
import { mapAppointment, doctorDisplayName, patientDisplayName } from '../../utils/appointments';

const statusConfig = {
  confirmada: { label: 'Confirmada', className: 'badge-success' },
  pendiente:  { label: 'Pendiente',  className: 'badge-warning' },
  cancelada:  { label: 'Cancelada',  className: 'badge-error'   },
  atendida:   { label: 'Atendida',   className: 'badge-info'    },
  no_asistio: { label: 'No Asistió', className: 'badge-ghost'   },
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];

function displayName(user) {
  if (!user) return 'Administrador';
  const fullName = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim();
  return fullName || user.username;
}

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

// Fetch puro (no toca estado de React) para que llamarlo desde useEffect sea seguro.
async function fetchDashboardData() {
  const [citasRes, pacientesRes, medicosRes] = await Promise.all([
    api.get('/appointments/'),
    api.get('/patients/'),
    api.get('/doctors/'),
  ]);
  return {
    citas: citasRes.data.map(mapAppointment),
    pacientes: pacientesRes.data,
    medicos: medicosRes.data,
  };
}

export default function AdminDashboard() {
  const { user } = useAuth();

  const [citas, setCitas] = useState([]);
  const [pacientes, setPacientes] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [citaSeleccionada, setCitaSeleccionada] = useState(null);
  const [mostrarNuevaCita, setMostrarNuevaCita] = useState(false);

  useEffect(() => {
    let active = true;
    fetchDashboardData()
      .then((result) => {
        if (!active) return;
        setCitas(result.citas);
        setPacientes(result.pacientes);
        setMedicos(result.medicos);
      })
      .catch(() => {
        if (active) setError('No se pudieron cargar los datos del panel.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, []);

  async function recargarDatos() {
    setLoading(true);
    try {
      const result = await fetchDashboardData();
      setCitas(result.citas);
      setPacientes(result.pacientes);
      setMedicos(result.medicos);
    } catch {
      setError('No se pudieron recargar los datos del panel.');
    } finally {
      setLoading(false);
    }
  }

  const hoyISO = toISODate(new Date());

  const citasHoy = useMemo(
    () => citas.filter((c) => c.date === hoyISO).sort((a, b) => a.time.localeCompare(b.time)),
    [citas, hoyISO],
  );

  const stats = {
    citasHoy: citasHoy.length,
    citasPendientes: citasHoy.filter((c) => c.status === 'pendiente').length,
    totalPacientes: pacientes.length,
    totalMedicos: medicos.length,
  };

  // Distribución por especialidad — solo las citas de hoy, conteo real (sin capacidad inventada)
  const distribucionHoy = useMemo(() => {
    const conteos = {};
    citasHoy.forEach((c) => {
      conteos[c.specialty] = (conteos[c.specialty] ?? 0) + 1;
    });
    const entradas = Object.entries(conteos).sort((a, b) => b[1] - a[1]);
    const max = entradas.length ? entradas[0][1] : 1;
    return entradas.map(([label, value], i) => ({ label, value, max, color: COLORS[i % COLORS.length] }));
  }, [citasHoy]);

  // Ocupación semanal por especialidad, para la gráfica de barras
  const { graficaSemanal, especialidadesSemana } = useMemo(() => {
    const lunes = getLunesDeSemana(new Date());
    const dias = getDiasSemana(lunes);
    const idsSemana = new Set(dias.map(toISODate));
    const nombresDia = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

    const especialidadesSet = new Set();
    const porDia = dias.map((dia, i) => {
      const fechaISO = toISODate(dia);
      const fila = { dia: nombresDia[i] };
      citas
        .filter((c) => c.date === fechaISO && idsSemana.has(c.date))
        .forEach((c) => {
          especialidadesSet.add(c.specialty);
          fila[c.specialty] = (fila[c.specialty] ?? 0) + 1;
        });
      return fila;
    });
    return { graficaSemanal: porDia, especialidadesSemana: [...especialidadesSet] };
  }, [citas]);

  async function handleNuevaCitaCreada() {
    setMostrarNuevaCita(false);
    await recargarDatos();
  }

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Cargando panel administrativo...</div>;
  }

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">

      {/* ── Encabezado ────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">
          Panel Administrativo
        </h1>
        <p className="text-slate-500 mt-1">
          Bienvenido, {displayName(user)}. Aquí tienes el resumen del día.
        </p>
      </div>

      {error && (
        <div className="alert alert-error mb-4 py-2 text-sm">{error}</div>
      )}

      {/* ── Tarjetas de resumen ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<CalendarCheck size={22} className="text-blue-600" />}
          bg="bg-blue-50"
          label="Citas Hoy"
          value={stats.citasHoy}
          sub="programadas"
        />
        <StatCard
          icon={<Clock size={22} className="text-amber-500" />}
          bg="bg-amber-50"
          label="Por Confirmar"
          value={stats.citasPendientes}
          sub="pendientes hoy"
        />
        <StatCard
          icon={<Users size={22} className="text-emerald-600" />}
          bg="bg-emerald-50"
          label="Pacientes"
          value={stats.totalPacientes}
          sub="registrados"
        />
        <StatCard
          icon={<Stethoscope size={22} className="text-violet-600" />}
          bg="bg-violet-50"
          label="Médicos"
          value={stats.totalMedicos}
          sub="activos"
        />
      </div>

      {/* ── Gráfica + Tabla (columnas) ────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">

        {/* Gráfica de ocupación semanal */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp size={18} className="text-blue-600" />
            <h3 className="font-semibold text-slate-800">Ocupación Semanal por Especialidad</h3>
          </div>
          {especialidadesSemana.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-16">Sin citas registradas esta semana.</p>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={graficaSemanal} barSize={10}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="dia" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }} />
                {especialidadesSemana.map((esp, i) => (
                  <Bar key={esp} dataKey={esp} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Distribución por especialidad — hoy */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 size={18} className="text-blue-600" />
            <h3 className="font-semibold text-slate-800">Citas por Especialidad — Hoy</h3>
          </div>
          {distribucionHoy.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-16">No hay citas programadas para hoy.</p>
          ) : (
            <div className="flex flex-col gap-4 mt-2">
              {distribucionHoy.map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-slate-600 font-medium">{item.label}</span>
                    <span className="text-slate-400">{item.value}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2">
                    <div
                      className="h-2 rounded-full transition-all duration-500"
                      style={{ width: `${(item.value / item.max) * 100}%`, backgroundColor: item.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Tabla de citas del día ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Citas de Hoy</h3>
          <button
            onClick={() => setMostrarNuevaCita(true)}
            className="btn btn-primary btn-sm rounded-lg gap-1.5"
          >
            <Plus size={15} /> Nueva Cita
          </button>
        </div>
        {citasHoy.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <CalendarCheck size={32} className="mb-2" />
            <p className="text-sm">No hay citas programadas para hoy.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-slate-500 font-semibold text-xs uppercase">Hora</th>
                  <th className="text-slate-500 font-semibold text-xs uppercase">Paciente</th>
                  <th className="text-slate-500 font-semibold text-xs uppercase">Especialidad</th>
                  <th className="text-slate-500 font-semibold text-xs uppercase">Médico</th>
                  <th className="text-slate-500 font-semibold text-xs uppercase">Estado</th>
                  <th className="text-slate-500 font-semibold text-xs uppercase">Acción</th>
                </tr>
              </thead>
              <tbody>
                {citasHoy.map((cita) => {
                  const s = statusConfig[cita.status] ?? statusConfig.pendiente;
                  return (
                    <tr key={cita.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="font-mono text-sm text-slate-600">{cita.timeLabel}</td>
                      <td className="font-medium text-slate-700">{cita.patient}</td>
                      <td className="text-slate-600 text-sm">{cita.specialty}</td>
                      <td className="text-slate-600 text-sm">{cita.doctor}</td>
                      <td>
                        <span className={`badge ${s.className} badge-sm`}>{s.label}</span>
                      </td>
                      <td>
                        <button
                          onClick={() => setCitaSeleccionada(cita)}
                          className="btn btn-ghost btn-xs text-blue-600 hover:bg-blue-50"
                        >
                          Ver
                        </button>
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
            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border mb-4 ${(statusConfig[citaSeleccionada.status] ?? statusConfig.pendiente).className === 'badge-error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
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
            <button
              onClick={() => setCitaSeleccionada(null)}
              className="btn btn-outline btn-sm w-full mt-6 border-slate-300 text-slate-600 hover:bg-slate-50"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* ── Modal: nueva cita ─────────────────────────────────────────── */}
      {mostrarNuevaCita && (
        <NuevaCitaModal
          pacientes={pacientes}
          medicos={medicos}
          onClose={() => setMostrarNuevaCita(false)}
          onCreated={handleNuevaCitaCreada}
        />
      )}
    </div>
  );
}

function NuevaCitaModal({ pacientes, medicos, onClose, onCreated }) {
  const [busquedaPaciente, setBusquedaPaciente] = useState('');
  const [pacienteId, setPacienteId] = useState('');
  const [medicoId, setMedicoId] = useState('');
  const [fecha, setFecha] = useState('');
  const [hora, setHora] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const pacientesFiltrados = useMemo(() => {
    const q = busquedaPaciente.trim().toLowerCase();
    if (!q) return pacientes.slice(0, 8);
    return pacientes.filter((p) =>
      patientDisplayName(p).toLowerCase().includes(q) || p.document_number.includes(q)
    ).slice(0, 8);
  }, [pacientes, busquedaPaciente]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!pacienteId || !medicoId || !fecha || !hora) {
      setError('Completa todos los campos.');
      return;
    }
    const medico = medicos.find((m) => String(m.id) === String(medicoId));
    setSubmitting(true);
    try {
      await api.post('/appointments/', {
        patient: Number(pacienteId),
        doctor: Number(medicoId),
        specialty: medico.specialty.id,
        date: fecha,
        time: hora,
      });
      onCreated();
    } catch (err) {
      const data = err?.response?.data;
      setError(data?.non_field_errors?.[0] || data?.patient || 'No se pudo crear la cita. Verifica el horario.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
        <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
          <X size={18} />
        </button>
        <h3 className="text-lg font-bold text-slate-800 mb-4">Nueva Cita</h3>

        {error && <div className="alert alert-error mb-4 py-2 text-sm">{error}</div>}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Paciente</label>
            <input
              type="text"
              placeholder="Buscar por nombre o documento..."
              value={busquedaPaciente}
              onChange={(e) => setBusquedaPaciente(e.target.value)}
              className="input input-bordered input-sm w-full bg-slate-50 border-slate-300 text-slate-700 mb-2"
            />
            <select
              value={pacienteId}
              onChange={(e) => setPacienteId(e.target.value)}
              className="select select-bordered select-sm w-full bg-slate-50 border-slate-300 text-slate-700"
              required
            >
              <option value="" disabled>Selecciona un paciente...</option>
              {pacientesFiltrados.map((p) => (
                <option key={p.id} value={p.id}>{patientDisplayName(p)} · {p.document_number}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Médico</label>
            <select
              value={medicoId}
              onChange={(e) => setMedicoId(e.target.value)}
              className="select select-bordered select-sm w-full bg-slate-50 border-slate-300 text-slate-700"
              required
            >
              <option value="" disabled>Selecciona un médico...</option>
              {medicos.map((m) => (
                <option key={m.id} value={m.id}>{doctorDisplayName(m)} · {m.specialty.name}</option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Fecha</label>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="input input-bordered input-sm w-full bg-slate-50 border-slate-300 text-slate-700"
                required
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Hora</label>
              <input
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className="input input-bordered input-sm w-full bg-slate-50 border-slate-300 text-slate-700"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn bg-gradient-to-r from-blue-600 to-blue-500 text-white border-none mt-2 disabled:opacity-60"
          >
            {submitting ? 'Creando...' : 'Crear Cita'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Componente auxiliar ───────────────────────────────────────────────────────
function StatCard({ icon, bg, label, value, sub }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">{label}</p>
        <p className="text-xs text-slate-400">{sub}</p>
      </div>
    </div>
  );
}
