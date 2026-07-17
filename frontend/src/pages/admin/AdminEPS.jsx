import { useState, useEffect, useCallback } from 'react';
import { Building2, Pencil, Check, X, ShieldAlert } from 'lucide-react';
import api from '../../api/client';

function formatCOP(value) {
  if (value === null || value === undefined || value === '') return null;
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(value);
}

export default function AdminEPS() {
  const [epsList, setEpsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editandoId, setEditandoId] = useState(null);
  const [borrador, setBorrador] = useState({ monthly_appointment_cap: '', monthly_budget: '' });
  const [guardando, setGuardando] = useState(false);

  const cargar = useCallback(() => {
    setLoading(true);
    setError('');
    api.get('/eps/')
      .then(({ data }) => setEpsList(data))
      .catch(() => setError('No se pudieron cargar las EPS.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function abrirEdicion(eps) {
    setEditandoId(eps.id);
    setBorrador({
      monthly_appointment_cap: eps.monthly_appointment_cap ?? '',
      monthly_budget: eps.monthly_budget ?? '',
    });
  }

  function cancelarEdicion() {
    setEditandoId(null);
  }

  async function handleGuardar(id) {
    setGuardando(true);
    setError('');
    try {
      const { data } = await api.patch(`/eps/${id}/`, {
        monthly_appointment_cap: borrador.monthly_appointment_cap === '' ? null : Number(borrador.monthly_appointment_cap),
        monthly_budget: borrador.monthly_budget === '' ? null : Number(borrador.monthly_budget),
      });
      setEpsList((prev) => prev.map((e) => (e.id === id ? data : e)));
      setEditandoId(null);
    } catch {
      setError('No se pudieron guardar los cambios de la EPS.');
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
          <Building2 className="text-blue-600" size={24} />
          Reglas de negocio por EPS
        </h1>
        <p className="text-slate-500 mt-1">
          Configura el tope mensual de citas y el presupuesto mensual disponible por EPS.
          Se validan automáticamente al agendar una cita. Deja el campo vacío para no aplicar control.
        </p>
      </div>

      {error && (
        <div className="alert alert-error mb-4 py-2 text-sm">{error}</div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-slate-400 text-sm">Cargando EPS...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="table w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-slate-500 font-semibold text-xs uppercase">EPS</th>
                  <th className="text-slate-500 font-semibold text-xs uppercase">Tope de citas / mes</th>
                  <th className="text-slate-500 font-semibold text-xs uppercase">Presupuesto mensual</th>
                  <th className="text-slate-500 font-semibold text-xs uppercase">Acción</th>
                </tr>
              </thead>
              <tbody>
                {epsList.map((eps) => (
                  <tr key={eps.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="font-medium text-slate-700">{eps.name}</td>

                    {editandoId === eps.id ? (
                      <>
                        <td>
                          <input
                            type="number"
                            min="0"
                            placeholder="Sin tope"
                            value={borrador.monthly_appointment_cap}
                            onChange={(e) => setBorrador({ ...borrador, monthly_appointment_cap: e.target.value })}
                            className="input input-bordered input-sm w-32 bg-slate-50 border-slate-300 text-slate-700"
                          />
                        </td>
                        <td>
                          <input
                            type="number"
                            min="0"
                            placeholder="Sin control"
                            value={borrador.monthly_budget}
                            onChange={(e) => setBorrador({ ...borrador, monthly_budget: e.target.value })}
                            className="input input-bordered input-sm w-40 bg-slate-50 border-slate-300 text-slate-700"
                          />
                        </td>
                        <td>
                          <div className="flex gap-1.5">
                            <button
                              onClick={cancelarEdicion}
                              className="btn btn-ghost btn-xs text-slate-500"
                            >
                              <X size={14} />
                            </button>
                            <button
                              onClick={() => handleGuardar(eps.id)}
                              disabled={guardando}
                              className="btn btn-xs bg-gradient-to-r from-blue-600 to-blue-500 text-white border-none disabled:opacity-60"
                            >
                              <Check size={14} />
                            </button>
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="text-slate-600 text-sm">
                          {eps.monthly_appointment_cap ?? (
                            <span className="text-slate-400 italic">Sin tope</span>
                          )}
                        </td>
                        <td className="text-slate-600 text-sm">
                          {formatCOP(eps.monthly_budget) ?? (
                            <span className="text-slate-400 italic">Sin control</span>
                          )}
                        </td>
                        <td>
                          <button
                            onClick={() => abrirEdicion(eps)}
                            className="btn btn-ghost btn-xs text-blue-600 hover:bg-blue-50 gap-1"
                          >
                            <Pencil size={13} /> Editar
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mt-4 flex items-start gap-2 text-xs text-slate-400">
        <ShieldAlert size={14} className="flex-shrink-0 mt-0.5" />
        <p>
          El tope y el presupuesto se calculan sobre las citas pendientes/confirmadas del mes calendario
          en que se agenda la cita nueva. Al superarse cualquiera de los dos, el sistema rechaza la creación
          de nuevas citas para pacientes de esa EPS hasta el siguiente mes.
        </p>
      </div>
    </div>
  );
}
