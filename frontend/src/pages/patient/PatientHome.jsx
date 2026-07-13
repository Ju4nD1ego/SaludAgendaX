import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarCheck,
  Clock,
  Stethoscope,
  Building2,
  AlertCircle,
  MapPin,
  CalendarPlus,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import api from '../../api/client';

const statusConfig = {
  confirmada: { label: 'Confirmada',  className: 'badge-success' },
  pendiente:  { label: 'Pendiente',   className: 'badge-warning' },
  cancelada:  { label: 'Cancelada',   className: 'badge-error'   },
  atendida:   { label: 'Atendida',    className: 'badge-info'    },
  no_asistio: { label: 'No Asistió',  className: 'badge-ghost'   },
};

function formatDate(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('es-CO', {
    weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
  });
}
function formatDateLong(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('es-CO', {
    weekday: 'long', day: 'numeric', month: 'long',
  });
}
function diasRestantes(dateStr) {
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const fecha = new Date(dateStr + 'T00:00:00');
  const diff = Math.round((fecha - hoy) / (1000 * 60 * 60 * 24));
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Mañana';
  if (diff > 1) return `En ${diff} días`;
  return null;
}
function formatTime(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const d = new Date();
  d.setHours(Number(h), Number(m), 0, 0);
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// El backend no distingue género, así que usamos el mismo prefijo genérico
// que ya usa Doctor.__str__ en core/models.py ("Dr(a).")
function mapAppointment(apt) {
  const doctorUser = apt.doctor_detail?.user;
  const doctorName = doctorUser
    ? `Dr(a). ${doctorUser.first_name} ${doctorUser.last_name}`.trim()
    : 'Médico por confirmar';

  return {
    id: apt.id,
    specialty: apt.specialty_detail?.name ?? 'Especialidad',
    doctor: doctorName,
    date: apt.date,
    time: formatTime(apt.time),
    status: apt.status,
    location: apt.doctor_detail?.consultorio || 'Por confirmar',
  };
}

export default function PatientHome() {
  const navigate = useNavigate();

  const [patientName, setPatientName] = useState('');
  const [eps, setEps] = useState('');
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const [meRes, appointmentsRes] = await Promise.all([
          api.get('/auth/me/'),
          api.get('/appointments/'),
        ]);
        if (!active) return;

        const me = meRes.data;
        setPatientName(`${me.first_name} ${me.last_name}`.trim() || me.username);
        setEps(me.patient_profile?.eps || 'Sin EPS registrada');
        setAppointments(appointmentsRes.data.map(mapAppointment));
      } catch {
        if (active) setError('No se pudieron cargar tus citas. Intenta de nuevo más tarde.');
      } finally {
        if (active) setLoading(false);
      }
    }

    load();
    return () => { active = false; };
  }, []);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-400">Cargando tu información...</div>
    );
  }
  if (error) {
    return (
      <div className="p-8 text-center text-red-500">{error}</div>
    );
  }

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // La próxima cita: la más cercana en el futuro que no esté cancelada.
  const proximaCita = [...appointments]
    .filter((a) => a.status !== 'cancelada' && new Date(a.date + 'T00:00:00') >= hoy)
    .sort((a, b) => new Date(a.date) - new Date(b.date))[0];

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">

      {/* ── Encabezado ─────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">
          ¡Hola, {patientName.split(' ')[0]}! 👋
        </h1>
        <p className="text-slate-500 mt-1">
          Aquí tienes un resumen de tu salud y tus próximas citas.
        </p>
      </div>

      {/* ── Banner "Hero": próxima cita ───────────────────────────────── */}
      {proximaCita ? (
        <div className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 rounded-2xl shadow-lg shadow-blue-500/20 p-6 md:p-7 mb-6 overflow-hidden">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
          <div className="absolute -bottom-14 -right-4 w-28 h-28 rounded-full bg-white/10" />

          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={14} className="text-blue-200" />
                <span className="text-xs font-semibold text-blue-100 uppercase tracking-wider">
                  Tu próxima cita
                </span>
              </div>
              <h2 className="text-xl md:text-2xl font-bold text-white mb-2">
                {proximaCita.specialty} con {proximaCita.doctor}
              </h2>
              <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-blue-100 text-sm">
                <span className="flex items-center gap-1.5 capitalize">
                  <CalendarCheck size={14} /> {formatDateLong(proximaCita.date)} · {proximaCita.time}
                </span>
                <span className="flex items-center gap-1.5">
                  <MapPin size={14} /> {proximaCita.location}
                </span>
              </div>
            </div>

            <div className="flex flex-col items-start md:items-end gap-2 flex-shrink-0">
              {diasRestantes(proximaCita.date) && (
                <span className="bg-white/15 backdrop-blur text-white text-xs font-bold px-3 py-1.5 rounded-full border border-white/20">
                  {diasRestantes(proximaCita.date)}
                </span>
              )}
              <span className={`badge badge-sm ${statusConfig[proximaCita.status].className}`}>
                {statusConfig[proximaCita.status].label}
              </span>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center mb-6">
          <CalendarPlus className="mx-auto text-slate-300 mb-2" size={32} />
          <p className="text-slate-500 font-medium">No tienes citas próximas</p>
          <button
            onClick={() => navigate('/patient/new-appointment')}
            className="btn btn-primary btn-sm rounded-lg mt-4"
          >
            Agendar mi primera cita
          </button>
        </div>
      )}

      {/* ── Tarjeta EPS + Stats en una fila ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">

        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Building2 className="text-blue-600" size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Tu EPS</p>
            <p className="font-bold text-slate-800 truncate">{eps}</p>
          </div>
          <ShieldCheck size={16} className="text-emerald-500 flex-shrink-0" />
        </div>

        <StatCard
          icon={<Clock size={20} className="text-amber-500" />}
          bg="bg-amber-50"
          label="Pendientes de confirmar"
          value={appointments.filter((a) => a.status === 'pendiente').length}
        />
        <StatCard
          icon={<Stethoscope size={20} className="text-emerald-600" />}
          bg="bg-emerald-50"
          label="Especialidades activas"
          value={new Set(appointments.map((a) => a.specialty)).size}
        />
      </div>

      {/* ── Tabla de próximas citas ──────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Todas mis Citas</h3>
          <button
            onClick={() => navigate('/patient/new-appointment')}
            className="btn btn-primary btn-sm rounded-lg gap-1.5"
          >
            <CalendarPlus size={15} /> Agendar Cita
          </button>
        </div>

        {appointments.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <AlertCircle size={40} className="mb-3" />
            <p className="font-medium">No tienes citas programadas</p>
            <p className="text-sm mt-1">Agenda tu primera cita médica</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-slate-500 font-semibold text-xs uppercase">Especialidad</th>
                  <th className="text-slate-500 font-semibold text-xs uppercase">Médico</th>
                  <th className="text-slate-500 font-semibold text-xs uppercase">Fecha</th>
                  <th className="text-slate-500 font-semibold text-xs uppercase">Hora</th>
                  <th className="text-slate-500 font-semibold text-xs uppercase">Consultorio</th>
                  <th className="text-slate-500 font-semibold text-xs uppercase">Estado</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((apt) => {
                  const status = statusConfig[apt.status] ?? statusConfig.pendiente;
                  const esLaProxima = apt.id === proximaCita?.id;
                  return (
                    <tr
                      key={apt.id}
                      className={`hover:bg-slate-50/60 transition-colors ${esLaProxima ? 'bg-blue-50/40' : ''}`}
                    >
                      <td>
                        <span className="flex items-center gap-2 font-medium text-slate-700">
                          <Stethoscope size={15} className="text-blue-400 flex-shrink-0" />
                          {apt.specialty}
                          {esLaProxima && (
                            <span className="text-[10px] font-bold text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded-full">
                              PRÓXIMA
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="text-slate-600 text-sm">{apt.doctor}</td>
                      <td className="text-slate-600 text-sm whitespace-nowrap capitalize">
                        {formatDate(apt.date)}
                      </td>
                      <td className="text-slate-600 text-sm">{apt.time}</td>
                      <td className="text-slate-500 text-sm">{apt.location}</td>
                      <td>
                        <span className={`badge ${status.className} badge-sm`}>
                          {status.label}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, bg, label, value }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}
