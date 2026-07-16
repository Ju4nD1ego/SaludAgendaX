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
  MapPin,
  Pencil,
  Check,
  X,
  Plus,
} from 'lucide-react';
import api from '../../api/client';
import { patientDisplayName } from '../../utils/appointments';

const epsOptions = ['EPS Sura', 'EPS Sanitas', 'Nueva EPS', 'Salud Total', 'Particular / Sin EPS'];
const documentOptions = [
  { value: 'CC', label: 'Cédula de Ciudadanía' },
  { value: 'TI', label: 'Tarjeta de Identidad' },
  { value: 'CE', label: 'Cédula de Extranjería' },
];

const nuevoPacienteVacio = {
  first_name: '', last_name: '', email: '', password: '',
  document_type: 'CC', document_number: '', phone: '', eps: '', address: '',
};

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
  const [pacienteSeleccionado, setPacienteSeleccionado] = useState(null);
  const [editando, setEditando] = useState(false);
  const [borrador, setBorrador] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [mostrarNuevoPaciente, setMostrarNuevoPaciente] = useState(false);
  const [nuevoPaciente, setNuevoPaciente] = useState(nuevoPacienteVacio);
  const [creandoPaciente, setCreandoPaciente] = useState(false);
  const [errorNuevoPaciente, setErrorNuevoPaciente] = useState('');

  const buscar = useCallback((filtrosActuales) => {
    setLoading(true);
    setError('');
    api.get(`/patients/${buildQueryString(filtrosActuales)}`)
      .then(({ data }) => setPacientes(data))
      .catch(() => setError('No se pudieron cargar los pacientes. Intenta de nuevo.'))
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

  function abrirPaciente(paciente) {
    setPacienteSeleccionado(paciente);
    setBorrador({
      phone: paciente.phone,
      eps: paciente.eps,
      address: paciente.address,
      email: paciente.user.email,
    });
    setEditando(false);
  }

  function cerrarModal() {
    setPacienteSeleccionado(null);
    setEditando(false);
  }

  async function handleGuardar() {
    setGuardando(true);
    setError('');
    try {
      const { data } = await api.patch(`/patients/${pacienteSeleccionado.id}/`, {
        phone: borrador.phone,
        eps: borrador.eps,
        address: borrador.address,
        user: { email: borrador.email },
      });
      setPacientes((prev) => prev.map((p) => (p.id === data.id ? data : p)));
      setPacienteSeleccionado(data);
      setEditando(false);
    } catch {
      setError('No se pudieron guardar los cambios.');
    } finally {
      setGuardando(false);
    }
  }

  function cerrarModalNuevoPaciente() {
    setMostrarNuevoPaciente(false);
    setNuevoPaciente(nuevoPacienteVacio);
    setErrorNuevoPaciente('');
  }

  async function handleCrearPaciente(e) {
    e.preventDefault();
    if (!nuevoPaciente.email.trim() || !nuevoPaciente.password || !nuevoPaciente.document_number.trim()) {
      setErrorNuevoPaciente('Correo, contraseña y documento son obligatorios.');
      return;
    }
    setCreandoPaciente(true);
    setErrorNuevoPaciente('');
    try {
      // Importante: se llama directo a /auth/register/ (no a AuthContext.register())
      // porque ese endpoint devuelve tokens de sesión del paciente nuevo, y pasar
      // por el contexto de auth desloguearía al admin y lo dejaría logueado como el paciente.
      await api.post('/auth/register/', {
        username: nuevoPaciente.email.trim(),
        email: nuevoPaciente.email.trim(),
        password: nuevoPaciente.password,
        first_name: nuevoPaciente.first_name.trim(),
        last_name: nuevoPaciente.last_name.trim(),
        document_type: nuevoPaciente.document_type,
        document_number: nuevoPaciente.document_number.trim(),
        phone: nuevoPaciente.phone.trim(),
        eps: nuevoPaciente.eps,
        address: nuevoPaciente.address.trim(),
      });
      buscar(filtros);
      cerrarModalNuevoPaciente();
    } catch (err) {
      const data = err?.response?.data;
      const msg = data?.email?.[0] || data?.username?.[0] || data?.document_number?.[0]
        || data?.password?.[0] || 'No se pudo crear el paciente.';
      setErrorNuevoPaciente(msg);
    } finally {
      setCreandoPaciente(false);
    }
  }

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto">

      {/* ── Encabezado ────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <Users className="text-blue-600" size={24} />
            Pacientes
          </h1>
          <p className="text-slate-500 mt-1">Busca y filtra pacientes registrados.</p>
        </div>
        <button
          onClick={() => setMostrarNuevoPaciente(true)}
          className="btn btn-sm bg-gradient-to-r from-blue-600 to-blue-500 text-white border-none gap-1.5"
        >
          <Plus size={14} /> Nuevo paciente
        </button>
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
                    <td>
                      <button
                        onClick={() => abrirPaciente(p)}
                        className="font-medium text-slate-700 hover:text-blue-600 hover:underline text-left"
                      >
                        {patientDisplayName(p)}
                      </button>
                    </td>
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

      {/* ── Modal: detalle / edición de paciente ───────────────────────── */}
      {pacienteSeleccionado && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={cerrarModal}
        >
          <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6 relative" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={cerrarModal}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X size={18} />
            </button>

            <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border mb-4 ${
              pacienteSeleccionado.is_active_patient
                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                : 'bg-slate-100 border-slate-200 text-slate-500'
            }`}>
              {pacienteSeleccionado.is_active_patient ? 'Activo' : 'Inactivo'}
            </span>

            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-800">{patientDisplayName(pacienteSeleccionado)}</h3>
                <p className="text-sm text-slate-500 flex items-center gap-1.5 mt-0.5">
                  <IdCard size={14} className="text-slate-400" />
                  {pacienteSeleccionado.document_type} {pacienteSeleccionado.document_number}
                </p>
              </div>
              {!editando ? (
                <button
                  onClick={() => setEditando(true)}
                  className="btn btn-sm btn-outline border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-600 gap-1.5"
                >
                  <Pencil size={14} /> Editar
                </button>
              ) : (
                <div className="flex gap-1.5">
                  <button
                    onClick={() => {
                      setEditando(false);
                      setBorrador({
                        phone: pacienteSeleccionado.phone,
                        eps: pacienteSeleccionado.eps,
                        address: pacienteSeleccionado.address,
                        email: pacienteSeleccionado.user.email,
                      });
                    }}
                    className="btn btn-sm btn-ghost text-slate-500"
                  >
                    <X size={14} />
                  </button>
                  <button
                    onClick={handleGuardar}
                    disabled={guardando}
                    className="btn btn-sm bg-gradient-to-r from-blue-600 to-blue-500 text-white border-none disabled:opacity-60"
                  >
                    <Check size={14} />
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-3">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                  <Mail size={14} /> Correo
                </label>
                {editando ? (
                  <input
                    type="email"
                    value={borrador.email}
                    onChange={(e) => setBorrador({ ...borrador, email: e.target.value })}
                    className="input input-bordered input-sm w-full bg-slate-50 border-slate-300 text-slate-800"
                  />
                ) : (
                  <p className="text-slate-700 text-sm">{pacienteSeleccionado.user.email}</p>
                )}
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                  <Phone size={14} /> Teléfono
                </label>
                {editando ? (
                  <input
                    type="text"
                    value={borrador.phone}
                    onChange={(e) => setBorrador({ ...borrador, phone: e.target.value })}
                    className="input input-bordered input-sm w-full bg-slate-50 border-slate-300 text-slate-800"
                  />
                ) : (
                  <p className="text-slate-700 text-sm">{pacienteSeleccionado.phone || 'Sin registrar'}</p>
                )}
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                  <Building2 size={14} /> EPS
                </label>
                {editando ? (
                  <select
                    value={borrador.eps}
                    onChange={(e) => setBorrador({ ...borrador, eps: e.target.value })}
                    className="select select-bordered select-sm w-full bg-slate-50 border-slate-300 text-slate-700"
                  >
                    <option value="">Sin registrar</option>
                    {epsOptions.map((eps) => <option key={eps} value={eps}>{eps}</option>)}
                  </select>
                ) : (
                  <p className="text-slate-700 text-sm">{pacienteSeleccionado.eps || 'Sin registrar'}</p>
                )}
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1">
                  <MapPin size={14} /> Dirección
                </label>
                {editando ? (
                  <input
                    type="text"
                    value={borrador.address}
                    onChange={(e) => setBorrador({ ...borrador, address: e.target.value })}
                    className="input input-bordered input-sm w-full bg-slate-50 border-slate-300 text-slate-800"
                  />
                ) : (
                  <p className="text-slate-700 text-sm">{pacienteSeleccionado.address || 'Sin registrar'}</p>
                )}
              </div>
            </div>

            <button
              onClick={cerrarModal}
              className="btn btn-outline btn-sm w-full mt-6 border-slate-300 text-slate-600 hover:bg-slate-50"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* ── Modal: nuevo paciente ────────────────────────────────────── */}
      {mostrarNuevoPaciente && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto"
          onClick={cerrarModalNuevoPaciente}
        >
          <form
            onSubmit={handleCrearPaciente}
            className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 relative my-8"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={cerrarModalNuevoPaciente}
              className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <X size={18} />
            </button>

            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2">
              <Users className="text-blue-600" size={20} /> Nuevo paciente
            </h3>

            {errorNuevoPaciente && (
              <div className="alert alert-error mb-4 py-2 text-sm">{errorNuevoPaciente}</div>
            )}

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Nombre</label>
                <input
                  type="text"
                  value={nuevoPaciente.first_name}
                  onChange={(e) => setNuevoPaciente({ ...nuevoPaciente, first_name: e.target.value })}
                  className="input input-bordered input-sm w-full bg-slate-50 border-slate-300 text-slate-700"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Apellido</label>
                <input
                  type="text"
                  value={nuevoPaciente.last_name}
                  onChange={(e) => setNuevoPaciente({ ...nuevoPaciente, last_name: e.target.value })}
                  className="input input-bordered input-sm w-full bg-slate-50 border-slate-300 text-slate-700"
                />
              </div>
            </div>

            <div className="mb-3">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Correo *</label>
              <input
                type="email"
                required
                value={nuevoPaciente.email}
                onChange={(e) => setNuevoPaciente({ ...nuevoPaciente, email: e.target.value })}
                className="input input-bordered input-sm w-full bg-slate-50 border-slate-300 text-slate-700"
              />
            </div>

            <div className="mb-3">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Contraseña *</label>
              <input
                type="password"
                required
                minLength={8}
                value={nuevoPaciente.password}
                onChange={(e) => setNuevoPaciente({ ...nuevoPaciente, password: e.target.value })}
                className="input input-bordered input-sm w-full bg-slate-50 border-slate-300 text-slate-700"
                placeholder="Mínimo 8 caracteres"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Tipo de documento</label>
                <select
                  value={nuevoPaciente.document_type}
                  onChange={(e) => setNuevoPaciente({ ...nuevoPaciente, document_type: e.target.value })}
                  className="select select-bordered select-sm w-full bg-slate-50 border-slate-300 text-slate-700"
                >
                  {documentOptions.map((d) => (
                    <option key={d.value} value={d.value}>{d.value}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Número *</label>
                <input
                  type="text"
                  required
                  value={nuevoPaciente.document_number}
                  onChange={(e) => setNuevoPaciente({ ...nuevoPaciente, document_number: e.target.value })}
                  className="input input-bordered input-sm w-full bg-slate-50 border-slate-300 text-slate-700"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Teléfono</label>
                <input
                  type="text"
                  value={nuevoPaciente.phone}
                  onChange={(e) => setNuevoPaciente({ ...nuevoPaciente, phone: e.target.value })}
                  className="input input-bordered input-sm w-full bg-slate-50 border-slate-300 text-slate-700"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">EPS</label>
                <select
                  value={nuevoPaciente.eps}
                  onChange={(e) => setNuevoPaciente({ ...nuevoPaciente, eps: e.target.value })}
                  className="select select-bordered select-sm w-full bg-slate-50 border-slate-300 text-slate-700"
                >
                  <option value="">Sin registrar</option>
                  {epsOptions.map((eps) => <option key={eps} value={eps}>{eps}</option>)}
                </select>
              </div>
            </div>

            <div className="mb-5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1 block">Dirección</label>
              <input
                type="text"
                value={nuevoPaciente.address}
                onChange={(e) => setNuevoPaciente({ ...nuevoPaciente, address: e.target.value })}
                className="input input-bordered input-sm w-full bg-slate-50 border-slate-300 text-slate-700"
              />
            </div>

            <button
              type="submit"
              disabled={creandoPaciente}
              className="btn btn-sm w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white border-none disabled:opacity-60"
            >
              {creandoPaciente ? 'Creando...' : 'Crear paciente'}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
