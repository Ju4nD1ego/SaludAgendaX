import { useState, useMemo } from 'react';
import {
  ClipboardList,
  Stethoscope,
  Search,
  CheckCircle2,
  XCircle,
  CalendarX,
  FileText,
} from 'lucide-react';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const mockHistorial = [
  { id: 1, especialidad: 'Medicina General', medico: 'Dr. Carlos Mendoza',  fecha: '2025-05-10', hora: '09:00 AM', estado: 'atendida',   diagnostico: 'Chequeo general, sin novedades. Se recomienda control en 6 meses.' },
  { id: 2, especialidad: 'Cardiología',      medico: 'Dra. María Torres',   fecha: '2025-04-22', hora: '02:30 PM', estado: 'atendida',   diagnostico: 'Control de presión arterial, valores dentro de rango normal.' },
  { id: 3, especialidad: 'Dermatología',     medico: 'Dr. Andrés Ríos',     fecha: '2025-03-15', hora: '11:00 AM', estado: 'cancelada',  diagnostico: null },
  { id: 4, especialidad: 'Medicina General', medico: 'Dr. Carlos Mendoza',  fecha: '2025-02-08', hora: '08:00 AM', estado: 'atendida',   diagnostico: 'Formulación de exámenes de rutina (hemograma, glicemia).' },
  { id: 5, especialidad: 'Ortopedia',        medico: 'Dr. Diego Castillo',  fecha: '2025-01-20', hora: '04:00 PM', estado: 'no_asistio', diagnostico: null },
];
// ─────────────────────────────────────────────────────────────────────────────

const statusConfig = {
  atendida:   { label: 'Atendida',   icon: CheckCircle2, className: 'text-emerald-600 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  cancelada:  { label: 'Cancelada',  icon: XCircle,      className: 'text-red-600 bg-red-50 border-red-200',             dot: 'bg-red-400'     },
  no_asistio: { label: 'No Asistió', icon: CalendarX,    className: 'text-slate-500 bg-slate-100 border-slate-200',      dot: 'bg-slate-400'   },
};

function formatFecha(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
}
function formatMesAnio(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
}

export default function PatientHistory() {
  const [busqueda, setBusqueda] = useState('');
  const [filtroEstado, setFiltroEstado] = useState('todas');

  const historialFiltrado = useMemo(() => {
    return mockHistorial
      .filter((c) => filtroEstado === 'todas' || c.estado === filtroEstado)
      .filter((c) =>
        c.especialidad.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.medico.toLowerCase().includes(busqueda.toLowerCase())
      );
  }, [busqueda, filtroEstado]);

  // Agrupamos por mes para la línea de tiempo
  const agrupadoPorMes = useMemo(() => {
    const grupos = {};
    historialFiltrado.forEach((cita) => {
      const key = formatMesAnio(cita.fecha);
      if (!grupos[key]) grupos[key] = [];
      grupos[key].push(cita);
    });
    return grupos;
  }, [historialFiltrado]);

  const stats = {
    total: mockHistorial.length,
    atendidas: mockHistorial.filter(c => c.estado === 'atendida').length,
    canceladas: mockHistorial.filter(c => c.estado === 'cancelada').length,
    noAsistio: mockHistorial.filter(c => c.estado === 'no_asistio').length,
  };

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">

      {/* ── Encabezado ────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <ClipboardList className="text-blue-600" size={24} />
          Historial de Citas
        </h1>
        <p className="text-slate-500 mt-1">Un vistazo a tu recorrido médico con nosotros.</p>
      </div>

      {/* ── Estadísticas rápidas ──────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-emerald-600">{stats.atendidas}</p>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mt-1">Atendidas</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-red-500">{stats.canceladas}</p>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mt-1">Canceladas</p>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 p-4 text-center">
          <p className="text-2xl font-bold text-slate-500">{stats.noAsistio}</p>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide mt-1">No Asistió</p>
        </div>
      </div>

      {/* ── Buscador + Filtros ────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por especialidad o médico..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="input input-bordered input-sm w-full pl-9 bg-white border-slate-300 text-slate-700"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {['todas', 'atendida', 'cancelada', 'no_asistio'].map((estado) => (
            <button
              key={estado}
              onClick={() => setFiltroEstado(estado)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                filtroEstado === estado
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-slate-200 text-slate-500 hover:border-blue-300'
              }`}
            >
              {estado === 'todas' ? 'Todas' : statusConfig[estado].label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Línea de tiempo ───────────────────────────────────────────── */}
      {historialFiltrado.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 flex flex-col items-center justify-center py-16 text-slate-400">
          <ClipboardList size={40} className="mb-3" />
          <p className="font-medium">No se encontraron citas</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(agrupadoPorMes).map(([mes, citas]) => (
            <div key={mes}>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3 capitalize">
                {mes}
              </h3>
              <div className="relative pl-6 space-y-4">
                {/* Línea vertical de la timeline */}
                <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-slate-200" />

                {citas.map((cita) => {
                  const s = statusConfig[cita.estado];
                  const Icon = s.icon;
                  return (
                    <div key={cita.id} className="relative">
                      {/* Punto en la línea */}
                      <span className={`absolute -left-6 top-4 w-3.5 h-3.5 rounded-full border-2 border-white ${s.dot} shadow-sm`} />

                      <div className="bg-white rounded-xl border border-slate-200 p-4 hover:border-slate-300 transition-colors">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div className="flex items-center gap-2">
                            <Stethoscope size={16} className="text-blue-500 flex-shrink-0" />
                            <h4 className="font-semibold text-slate-800">{cita.especialidad}</h4>
                          </div>
                          <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full border flex-shrink-0 ${s.className}`}>
                            <Icon size={12} />
                            {s.label}
                          </span>
                        </div>
                        <p className="text-sm text-slate-500 mb-1">
                          {cita.medico} · {formatFecha(cita.fecha)} · {cita.hora}
                        </p>
                        {cita.diagnostico && (
                          <div className="flex items-start gap-2 mt-3 pt-3 border-t border-slate-100">
                            <FileText size={14} className="text-slate-300 flex-shrink-0 mt-0.5" />
                            <p className="text-sm text-slate-600">{cita.diagnostico}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}