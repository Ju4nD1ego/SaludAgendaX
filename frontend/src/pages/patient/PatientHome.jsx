import { CalendarCheck, Clock, Stethoscope, Building2, AlertCircle } from 'lucide-react';

// ─── Mock Data ───────────────────────────────────────────────────────────────
// Simula lo que vendrá del backend. Cuando esté listo, esto se reemplaza
// por una llamada axios.get('/api/patient/me/') y axios.get('/api/appointments/')
const mockPatient = {
  name:           'Ana García',
  documentType:   'CC',
  documentNumber: '1.234.567.890',
  eps:            'EPS Sura',
  email:          'ana.garcia@email.com',
};

const mockAppointments = [
  {
    id:        1,
    specialty: 'Medicina General',
    doctor:    'Dr. Carlos Mendoza',
    date:      '2025-07-15',
    time:      '09:00 AM',
    status:    'confirmada',
    location:  'Consultorio 3 - Piso 1',
  },
  {
    id:        2,
    specialty: 'Cardiología',
    doctor:    'Dra. María Torres',
    date:      '2025-07-22',
    time:      '02:30 PM',
    status:    'pendiente',
    location:  'Consultorio 8 - Piso 2',
  },
  {
    id:        3,
    specialty: 'Dermatología',
    doctor:    'Dr. Andrés Ríos',
    date:      '2025-08-03',
    time:      '11:00 AM',
    status:    'confirmada',
    location:  'Consultorio 12 - Piso 3',
  },
];
// ─────────────────────────────────────────────────────────────────────────────

const statusConfig = {
  confirmada: { label: 'Confirmada', className: 'badge-success'  },
  pendiente:  { label: 'Pendiente',  className: 'badge-warning'  },
  cancelada:  { label: 'Cancelada',  className: 'badge-error'    },
};

function formatDate(dateStr) {
  // El truco del T00:00:00 evita que JS interprete la fecha en UTC
  // y te muestre un día antes por diferencia horaria (bug clásico)
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('es-CO', {
    weekday: 'short',
    day:     'numeric',
    month:   'short',
    year:    'numeric',
  });
}

export default function PatientHome() {
  const patient      = mockPatient;
  const appointments = mockAppointments;

  const upcoming   = appointments.filter(a => a.status !== 'cancelada');
  const pending    = appointments.filter(a => a.status === 'pendiente');
  const specialties = new Set(appointments.map(a => a.specialty)).size;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">

      {/* ── Encabezado ────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">
          ¡Hola, {patient.name.split(' ')[0]}! 👋
        </h1>
        <p className="text-slate-500 mt-1">
          Aquí tienes un resumen de tus citas y tu información de salud.
        </p>
      </div>

      {/* ── Tarjeta EPS ───────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-6">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Building2 className="text-blue-600" size={24} />
          </div>
          <div className="flex-1">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Entidad Aseguradora (EPS)
            </p>
            <h2 className="text-xl font-bold text-slate-800">{patient.eps}</h2>
            <p className="text-sm text-slate-500 mt-1">
              {patient.documentType}: {patient.documentNumber} · {patient.email}
            </p>
          </div>
          <span className="badge badge-success badge-sm mt-1">Activa</span>
        </div>
      </div>

      {/* ── Tarjetas de resumen ───────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard
          icon={<CalendarCheck size={22} className="text-blue-600" />}
          bg="bg-blue-50"
          label="Próximas Citas"
          value={upcoming.length}
        />
        <StatCard
          icon={<Clock size={22} className="text-amber-500" />}
          bg="bg-amber-50"
          label="Por Confirmar"
          value={pending.length}
        />
        <StatCard
          icon={<Stethoscope size={22} className="text-emerald-600" />}
          bg="bg-emerald-50"
          label="Especialidades"
          value={specialties}
        />
      </div>

      {/* ── Tabla de citas ────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Mis Próximas Citas</h3>
          <button className="btn btn-primary btn-sm rounded-lg">
            + Agendar Cita
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
                  const s = statusConfig[apt.status] ?? statusConfig.pendiente;
                  return (
                    <tr key={apt.id} className="hover:bg-slate-50/60 transition-colors">
                      <td>
                        <span className="flex items-center gap-2 font-medium text-slate-700">
                          <Stethoscope size={15} className="text-blue-400 flex-shrink-0" />
                          {apt.specialty}
                        </span>
                      </td>
                      <td className="text-slate-600 text-sm">{apt.doctor}</td>
                      <td className="text-slate-600 text-sm whitespace-nowrap">
                        {formatDate(apt.date)}
                      </td>
                      <td className="text-slate-600 text-sm">{apt.time}</td>
                      <td className="text-slate-500 text-sm">{apt.location}</td>
                      <td>
                        <span className={`badge ${s.className} badge-sm`}>
                          {s.label}
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

// ── Componente auxiliar ───────────────────────────────────────────────────────
function StatCard({ icon, bg, label, value }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 flex items-center gap-4">
      <div className={`w-11 h-11 rounded-xl ${bg} flex items-center justify-center flex-shrink-0`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-800">{value}</p>
        <p className="text-sm text-slate-500">{label}</p>
      </div>
    </div>
  );
}