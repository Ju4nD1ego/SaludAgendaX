import { useState, useEffect, useCallback } from 'react';
import { BarChart3, CalendarRange, RotateCcw } from 'lucide-react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import api from '../../api/client';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#14b8a6'];

const statusLabels = {
  pendiente: 'Pendiente',
  confirmada: 'Confirmada',
  cancelada: 'Cancelada',
  atendida: 'Atendida',
  no_asistio: 'No Asistió',
};

function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function primerDiaDelMes() {
  const hoy = new Date();
  return toISODate(new Date(hoy.getFullYear(), hoy.getMonth(), 1));
}

function filtrosDefault() {
  return { date_from: primerDiaDelMes(), date_to: toISODate(new Date()) };
}

function fetchReporte(filtros) {
  const params = new URLSearchParams(filtros);
  return api.get(`/reports/summary/?${params.toString()}`).then(({ data }) => data);
}

function ChartCard({ icon, titulo, children, vacio }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        {icon}
        <h3 className="font-semibold text-slate-800">{titulo}</h3>
      </div>
      {vacio ? (
        <p className="text-sm text-slate-400 text-center py-16">Sin datos en el período seleccionado.</p>
      ) : children}
    </div>
  );
}

export default function AdminReportes() {
  const [filtros, setFiltros] = useState(filtrosDefault);
  const [reporte, setReporte] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const buscar = useCallback((filtrosActuales) => {
    setLoading(true);
    setError('');
    fetchReporte(filtrosActuales)
      .then((data) => setReporte(data))
      .catch(() => setError('No se pudieron cargar los reportes.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    buscar(filtros);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function actualizarFiltro(campo, valor) {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  }

  function aplicarFiltros(e) {
    e.preventDefault();
    buscar(filtros);
  }

  function limpiarFiltros() {
    const def = filtrosDefault();
    setFiltros(def);
    buscar(def);
  }

  const porDia = (reporte?.por_dia ?? []).map((r) => ({
    fecha: r.date.slice(5), // MM-DD
    citas: r.count,
  }));

  const porEstado = (reporte?.por_estado ?? []).map((r) => ({
    name: statusLabels[r.status] ?? r.status,
    value: r.count,
  }));

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <BarChart3 className="text-blue-600" size={24} />
          Reportes y estadísticas
        </h1>
        <p className="text-slate-500 mt-1">Uso del sistema por especialidad, médico, EPS y estado de las citas.</p>
      </div>

      {error && (
        <div className="alert alert-error mb-4 py-2 text-sm">{error}</div>
      )}

      {/* ── Filtro de período ────────────────────────────────────────── */}
      <form
        onSubmit={aplicarFiltros}
        className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6 flex flex-wrap items-end gap-3"
      >
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Desde</label>
          <input
            type="date"
            value={filtros.date_from}
            onChange={(e) => actualizarFiltro('date_from', e.target.value)}
            className="input input-bordered input-sm bg-slate-50 border-slate-300 text-slate-700"
          />
        </div>
        <div>
          <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Hasta</label>
          <input
            type="date"
            value={filtros.date_to}
            onChange={(e) => actualizarFiltro('date_to', e.target.value)}
            className="input input-bordered input-sm bg-slate-50 border-slate-300 text-slate-700"
          />
        </div>
        <button
          type="submit"
          className="btn btn-sm bg-gradient-to-r from-blue-600 to-blue-500 text-white border-none gap-1.5"
        >
          <CalendarRange size={14} /> Filtrar
        </button>
        <button
          type="button"
          onClick={limpiarFiltros}
          className="btn btn-ghost btn-sm text-slate-400 hover:text-red-600 gap-1"
        >
          <RotateCcw size={14} /> Mes actual
        </button>
        {reporte && !loading && (
          <span className="text-sm text-slate-400 ml-auto">
            {reporte.total_citas} cita{reporte.total_citas === 1 ? '' : 's'} en el período
          </span>
        )}
      </form>

      {loading ? (
        <div className="p-10 text-center text-slate-400 text-sm">Cargando reportes...</div>
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <ChartCard
            icon={<BarChart3 size={18} className="text-blue-600" />}
            titulo="Citas por especialidad"
            vacio={!reporte?.por_especialidad?.length}
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={reporte?.por_especialidad ?? []} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="specialty" width={110} tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            icon={<BarChart3 size={18} className="text-emerald-600" />}
            titulo="Citas por médico"
            vacio={!reporte?.por_medico?.length}
          >
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={reporte?.por_medico ?? []} layout="vertical" margin={{ left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis type="category" dataKey="doctor" width={110} tick={{ fontSize: 12, fill: '#475569' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Bar dataKey="count" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            icon={<BarChart3 size={18} className="text-violet-600" />}
            titulo="Citas por EPS"
            vacio={!reporte?.por_eps?.length}
          >
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={reporte?.por_eps ?? []}
                  dataKey="count"
                  nameKey="eps"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ eps, count }) => `${eps}: ${count}`}
                >
                  {(reporte?.por_eps ?? []).map((entry, i) => (
                    <Cell key={entry.eps} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <ChartCard
            icon={<BarChart3 size={18} className="text-amber-500" />}
            titulo="Citas por estado"
            vacio={porEstado.length === 0}
          >
            <ResponsiveContainer width="100%" height={260}>
              <PieChart>
                <Pie
                  data={porEstado}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={90}
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {porEstado.map((entry, i) => (
                    <Cell key={entry.name} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </ChartCard>

          <div className="xl:col-span-2">
            <ChartCard
              icon={<BarChart3 size={18} className="text-blue-600" />}
              titulo="Tendencia de citas por día"
              vacio={porDia.length === 0}
            >
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={porDia}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="fecha" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', fontSize: '12px' }} />
                  <Bar dataKey="citas" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>
        </div>
      )}
    </div>
  );
}
