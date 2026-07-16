import { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Users,
  Phone,
  Mail,
  Building2,
  RotateCcw,
  UserX,
  IdCard,
} from 'lucide-react';
import api from '../../api/client';
import { patientDisplayName } from '../../utils/appointments';

const epsOptions = ['EPS Sura', 'EPS Sanitas', 'Nueva EPS', 'Salud Total', 'Particular / Sin EPS'];

const filtrosVacios = { q: '', eps: '', isActive: '' };

function buildQueryString(filtros) {
  const params = new URLSearchParams();
  if (filtros.q.trim()) params.set('q', filtros.q.trim());
  if (filtros.eps) params.set('eps', filtros.eps);
  if (filtros.isActive) params.set('is_active', filtros.isActive);
  const qs = params.toString();
  return qs ? `?${qs}` : '';
}

export default function AdminPatients() {
  const [filtros, setFiltros] = useState(filtrosVacios);
  const [pacientes, setPacientes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [procesandoId, setProcesandoId] = useState(null);

  const buscar = useCallback((filtrosActuales) => {
    setLoading(true);
    setError('');
    api.get(`/patients/${buildQueryString(filtrosActuales)}`)
      .then(({ data }) => setPacientes(data))
      .catch(() => setError('No se pudieron cargar los pacientes. Intenta de nuevo.'))
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
  }, [filtros.q, filtros.eps, filtros.isActive]);

  function actualizarFiltro(campo, valor) {
    setFiltros((prev) => ({ ...prev, [campo]: valor }));
  }

  function limpiarFiltros() {
    setFiltros(filtrosVacios);
  }

  const hayFiltrosActivos = filtros.q !== '' || filtros.eps !== '' || filtros.isActive !== '';

  async function handleDesactivar(id) {
    setProcesandoId(id);
    try {
      await api.post(`/patients/${id}/deactivate/`);
      setPacientes((prev) => prev.map((p) => (p.id === id ? { ...p, is_active_patient: false } : p)));
    } catch {
      setError('No se pudo desactivar al paciente.');
    } finally {
      setProcesandoId(null);
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">

      {/* ── Encabezado ────────────────────────────────────────────────── */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Users className="text-blue-600" size={24} />
          Pacientes
        </h1>
        <p className="text-slate-500 mt-1">Busca y filtra pacientes registrados.</p>
      </div>

      {error && (
        <div className="alert alert-error mb-4 py-2 text-sm">{error}</div>
      )}

      {/* ── Panel de filtros ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div className="sm:col-span-1">
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">
              Buscar
            </label>
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Nombre, documento o correo..."
                value={filtros.q}
                onChange={(e) => actualizarFiltro('q', e.target.value)}
                className="input input-bordered input-sm w-full pl-8 bg-slate-50 border-slate-300 text-slate-700"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">
              EPS
            </label>
            <select
              value={filtros.eps}
              onChange={(e) => actualizarFiltro('eps', e.target.value)}
              className="select select-bordered select-sm w-full bg-slate-50 border-slate-300 text-slate-700"
            >
              <option value="">Todas</option>
              {epsOptions.map((eps) => (
                <option key={eps} value={eps}>{eps}</option>
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
            {!loading && <span className="text-slate-400 font-normal"> · {pacientes.length}</span>}
          </h3>
        </div>

        {loading ? (
          <div className="p-10 text-center text-slate-400 text-sm">Buscando pacientes...</div>
        ) : pacientes.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <Users size={32} className="mb-2" />
            <p className="text-sm">No se encontraron pacientes con esos filtros.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-slate-500 font-semibold text-xs uppercase">Paciente</th>
                  <th className="text-slate-500 font-semibold text-xs uppercase">Documento</th>
                  <th className="text-slate-500 font-semibold text-xs uppercase">Contacto</th>
                  <th className="text-slate-500 font-semibold text-xs uppercase">EPS</th>
                  <th className="text-slate-500 font-semibold text-xs uppercase">Estado</th>
                  <th className="text-slate-500 font-semibold text-xs uppercase">Acción</th>
                </tr>
              </thead>
              <tbody>
                {pacientes.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="font-medium text-slate-700">{patientDisplayName(p)}</td>
                    <td className="text-slate-600 text-sm">
                      <span className="flex items-center gap-1.5">
                        <IdCard size={13} className="text-slate-400" />
                        {p.document_type} {p.document_number}
                      </span>
                    </td>
                    <td className="text-slate-600 text-sm">
                      <div className="flex flex-col gap-0.5">
                        <span className="flex items-center gap-1.5">
                          <Mail size={13} className="text-slate-400" /> {p.user.email}
                        </span>
                        {p.phone && (
                          <span className="flex items-center gap-1.5 text-slate-500">
                            <Phone size={13} className="text-slate-400" /> {p.phone}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="text-slate-600 text-sm">
                      <span className="flex items-center gap-1.5">
                        <Building2 size={13} className="text-slate-400" />
                        {p.eps || 'Sin registrar'}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-sm ${p.is_active_patient ? 'badge-success' : 'badge-ghost'}`}>
                        {p.is_active_patient ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td>
                      {p.is_active_patient && (
                        <button
                          onClick={() => handleDesactivar(p.id)}
                          disabled={procesandoId === p.id}
                          className="btn btn-ghost btn-xs text-red-600 hover:bg-red-50 disabled:opacity-50 gap-1"
                        >
                          <UserX size={13} />
                          {procesandoId === p.id ? 'Procesando...' : 'Desactivar'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
