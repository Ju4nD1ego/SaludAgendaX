import { useState } from 'react';
import {
  User,
  Mail,
  Phone,
  IdCard,
  Building2,
  MapPin,
  Pencil,
  Check,
  X,
  ShieldCheck,
  HeartPulse,
} from 'lucide-react';

// ─── Mock Data ────────────────────────────────────────────────────────────────
const mockPatientData = {
  name: 'Ana García',
  documentType: 'CC',
  documentNumber: '1.234.567.890',
  email: 'ana.garcia@email.com',
  phone: '300 123 4567',
  eps: 'Sura EPS',
  address: 'Calle 45 #12-30, Cali',
  memberSince: '2023-08-14',
};
// ─────────────────────────────────────────────────────────────────────────────

const epsOptions = ['Sura EPS', 'Sanitas', 'Nueva EPS', 'Salud Total', 'Particular / Sin EPS'];

function formatMemberSince(dateStr) {
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('es-CO', { month: 'long', year: 'numeric' });
}

export default function PatientProfile() {
  const [editando, setEditando] = useState(false);
  const [datos, setDatos] = useState(mockPatientData);
  const [borrador, setBorrador] = useState(mockPatientData);

  function handleGuardar() {
    // 🔌 AQUÍ CONECTA EL BACKEND:
    // axios.put('/api/patients/me/', borrador)
    setDatos(borrador);
    setEditando(false);
  }
  function handleCancelar() {
    setBorrador(datos);
    setEditando(false);
  }

  const iniciales = datos.name.split(' ').map(n => n[0]).slice(0, 2).join('');

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-800">Mi Perfil</h1>
        <p className="text-slate-500 mt-1">Tu información personal y de afiliación.</p>
      </div>

      {/* ── "Carnet" médico ───────────────────────────────────────────── */}
      <div className="relative bg-gradient-to-br from-blue-700 via-blue-600 to-blue-500 rounded-2xl shadow-lg shadow-blue-500/20 p-6 mb-6 overflow-hidden">
        {/* Decoración de fondo */}
        <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/10" />
        <div className="absolute -bottom-10 -right-2 w-24 h-24 rounded-full bg-white/10" />

        <div className="relative flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center flex-shrink-0 text-xl font-bold text-white border border-white/20">
            {iniciales}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-white truncate">{datos.name}</h2>
              <ShieldCheck size={16} className="text-blue-200 flex-shrink-0" />
            </div>
            <p className="text-blue-100 text-sm">{datos.documentType} · {datos.documentNumber}</p>
            <p className="text-blue-200 text-xs mt-1">
              Miembro desde {formatMemberSince(datos.memberSince)}
            </p>
          </div>
          <div className="text-right flex-shrink-0 hidden sm:block">
            <div className="flex items-center gap-1.5 text-blue-100 text-xs mb-1 justify-end">
              <Building2 size={12} /> EPS
            </div>
            <p className="text-white font-semibold text-sm">{datos.eps}</p>
          </div>
        </div>
      </div>

      {/* ── Datos personales ──────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <HeartPulse size={18} className="text-blue-600" />
            <h3 className="font-semibold text-slate-800">Datos Personales</h3>
          </div>
          {!editando ? (
            <button
              onClick={() => setEditando(true)}
              className="btn btn-sm btn-outline border-slate-300 text-slate-600 hover:border-blue-400 hover:text-blue-600 gap-1.5"
            >
              <Pencil size={14} /> Editar
            </button>
          ) : (
            <div className="flex gap-2">
              <button onClick={handleCancelar} className="btn btn-sm btn-ghost text-slate-500 gap-1.5">
                <X size={14} /> Cancelar
              </button>
              <button
                onClick={handleGuardar}
                className="btn btn-sm bg-gradient-to-r from-blue-600 to-blue-500 text-white border-none gap-1.5"
              >
                <Check size={14} /> Guardar
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <Campo icon={<Mail size={16} />} label="Correo Electrónico" editando={editando}
            value={borrador.email} onChange={(v) => setBorrador({ ...borrador, email: v })} type="email" />
          <Campo icon={<Phone size={16} />} label="Teléfono" editando={editando}
            value={borrador.phone} onChange={(v) => setBorrador({ ...borrador, phone: v })} />
          <Campo icon={<IdCard size={16} />} label="Documento" editando={false}
            value={`${datos.documentType} ${datos.documentNumber}`} />

          <div>
            <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
              <Building2 size={16} /> EPS
            </label>
            {editando ? (
              <select
                value={borrador.eps}
                onChange={(e) => setBorrador({ ...borrador, eps: e.target.value })}
                className="select select-bordered select-sm w-full bg-slate-50 border-slate-300 text-slate-700"
              >
                {epsOptions.map((eps) => <option key={eps} value={eps}>{eps}</option>)}
              </select>
            ) : (
              <p className="text-slate-700 font-medium">{datos.eps}</p>
            )}
          </div>

          <div className="sm:col-span-2">
            <Campo icon={<MapPin size={16} />} label="Dirección" editando={editando}
              value={borrador.address} onChange={(v) => setBorrador({ ...borrador, address: v })} />
          </div>
        </div>
      </div>
    </div>
  );
}

function Campo({ icon, label, editando, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 uppercase tracking-wide mb-1.5">
        {icon} {label}
      </label>
      {editando ? (
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="input input-bordered input-sm w-full bg-slate-50 border-slate-300 text-slate-800"
        />
      ) : (
        <p className="text-slate-700 font-medium">{value}</p>
      )}
    </div>
  );
}