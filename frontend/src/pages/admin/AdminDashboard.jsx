import {
  CalendarCheck,
  CalendarX,
  Users,
  Stethoscope,
  Clock,
  TrendingUp,
  AlertTriangle,
  BarChart3,
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

// ─── Mock Data ────────────────────────────────────────────────────────────────
// Todo esto vendrá del backend vía axios cuando esté listo

const mockStats = {
  citasHoy:        12,
  citasPendientes:  4,
  totalPacientes:  87,
  totalMedicos:     6,
};

const mockCitasHoy = [
  { id: 1, paciente: 'Ana García',     especialidad: 'Medicina General', medico: 'Dr. Mendoza',  hora: '08:00', estado: 'confirmada' },
  { id: 2, paciente: 'Luis Martínez',  especialidad: 'Cardiología',      medico: 'Dra. Torres',  hora: '08:30', estado: 'confirmada' },
  { id: 3, paciente: 'Sara Rodríguez', especialidad: 'Dermatología',     medico: 'Dr. Ríos',     hora: '09:00', estado: 'pendiente'  },
  { id: 4, paciente: 'Pedro Gómez',    especialidad: 'Medicina General', medico: 'Dr. Mendoza',  hora: '09:30', estado: 'confirmada' },
  { id: 5, paciente: 'Laura Pérez',    especialidad: 'Cardiología',      medico: 'Dra. Torres',  hora: '10:00', estado: 'cancelada'  },
  { id: 6, paciente: 'Diego Herrera',  especialidad: 'Ortopedia',        medico: 'Dr. Castillo', hora: '10:30', estado: 'pendiente'  },
];

// Datos para la gráfica: citas por especialidad en la semana
const mockGraficaSemanal = [
  { dia: 'Lun', 'Medicina General': 5, Cardiología: 3, Dermatología: 2, Ortopedia: 1 },
  { dia: 'Mar', 'Medicina General': 7, Cardiología: 4, Dermatología: 3, Ortopedia: 2 },
  { dia: 'Mié', 'Medicina General': 4, Cardiología: 2, Dermatología: 4, Ortopedia: 3 },
  { dia: 'Jue', 'Medicina General': 6, Cardiología: 5, Dermatología: 2, Ortopedia: 1 },
  { dia: 'Vie', 'Medicina General': 8, Cardiología: 3, Dermatología: 5, Ortopedia: 4 },
];

// Alertas de topes EPS próximos a agotarse
const mockAlertas = [
  { eps: 'Nueva EPS',   usado: 85, total: 100, porcentaje: 85 },
  { eps: 'Salud Total', usado: 47, total:  60, porcentaje: 78 },
];
// ─────────────────────────────────────────────────────────────────────────────

const statusConfig = {
  confirmada: { label: 'Confirmada', className: 'badge-success' },
  pendiente:  { label: 'Pendiente',  className: 'badge-warning' },
  cancelada:  { label: 'Cancelada',  className: 'badge-error'   },
};

// Colores para las barras de la gráfica
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
const especialidades = ['Medicina General', 'Cardiología', 'Dermatología', 'Ortopedia'];

export default function AdminDashboard() {
  const { user } = useAuth();

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">

      {/* ── Encabezado ────────────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-800">
          Panel Administrativo
        </h1>
        <p className="text-slate-500 mt-1">
          Bienvenido, {user?.name}. Aquí tienes el resumen del día.
        </p>
      </div>

      {/* ── Alertas EPS ───────────────────────────────────────────────── */}
      {mockAlertas.length > 0 && (
        <div className="mb-6 flex flex-col gap-2">
          {mockAlertas.map((alerta) => (
            <div
              key={alerta.eps}
              className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3"
            >
              <AlertTriangle size={18} className="text-amber-500 flex-shrink-0" />
              <p className="text-sm text-amber-800">
                <span className="font-semibold">{alerta.eps}</span> ha usado el{' '}
                <span className="font-semibold">{alerta.porcentaje}%</span> de su tope
                mensual ({alerta.usado}/{alerta.total} citas).
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── Tarjetas de resumen ───────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<CalendarCheck size={22} className="text-blue-600" />}
          bg="bg-blue-50"
          label="Citas Hoy"
          value={mockStats.citasHoy}
          sub="programadas"
        />
        <StatCard
          icon={<Clock size={22} className="text-amber-500" />}
          bg="bg-amber-50"
          label="Por Confirmar"
          value={mockStats.citasPendientes}
          sub="pendientes"
        />
        <StatCard
          icon={<Users size={22} className="text-emerald-600" />}
          bg="bg-emerald-50"
          label="Pacientes"
          value={mockStats.totalPacientes}
          sub="registrados"
        />
        <StatCard
          icon={<Stethoscope size={22} className="text-violet-600" />}
          bg="bg-violet-50"
          label="Médicos"
          value={mockStats.totalMedicos}
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
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={mockGraficaSemanal} barSize={10}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis
                dataKey="dia"
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#94a3b8' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  fontSize: '12px',
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: '12px', paddingTop: '16px' }}
              />
              {especialidades.map((esp, i) => (
                <Bar
                  key={esp}
                  dataKey={esp}
                  fill={COLORS[i]}
                  radius={[4, 4, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Distribución por especialidad (barras horizontales simples) */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex items-center gap-2 mb-6">
            <BarChart3 size={18} className="text-blue-600" />
            <h3 className="font-semibold text-slate-800">Citas por Especialidad — Hoy</h3>
          </div>
          <div className="flex flex-col gap-4 mt-2">
            {[
              { label: 'Medicina General', value: 5, total: 8, color: 'bg-blue-500'   },
              { label: 'Cardiología',      value: 3, total: 5, color: 'bg-emerald-500'},
              { label: 'Dermatología',     value: 2, total: 4, color: 'bg-amber-400'  },
              { label: 'Ortopedia',        value: 2, total: 3, color: 'bg-violet-500' },
            ].map((item) => (
              <div key={item.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-slate-600 font-medium">{item.label}</span>
                  <span className="text-slate-400">{item.value}/{item.total}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className={`${item.color} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${(item.value / item.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Tabla de citas del día ────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-semibold text-slate-800">Citas de Hoy</h3>
          <button className="btn btn-primary btn-sm rounded-lg">
            + Nueva Cita
          </button>
        </div>
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
              {mockCitasHoy.map((cita) => {
                const s = statusConfig[cita.estado] ?? statusConfig.pendiente;
                return (
                  <tr key={cita.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="font-mono text-sm text-slate-600">{cita.hora}</td>
                    <td className="font-medium text-slate-700">{cita.paciente}</td>
                    <td className="text-slate-600 text-sm">{cita.especialidad}</td>
                    <td className="text-slate-600 text-sm">{cita.medico}</td>
                    <td>
                      <span className={`badge ${s.className} badge-sm`}>
                        {s.label}
                      </span>
                    </td>
                    <td>
                      <button className="btn btn-ghost btn-xs text-blue-600 hover:bg-blue-50">
                        Ver
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
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