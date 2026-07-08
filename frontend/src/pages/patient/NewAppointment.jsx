import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, User, Calendar, Clock, CheckCircle2, ArrowLeft } from 'lucide-react';

// ─── Mock Data ────────────────────────────────────────────────────────────────
// Simula lo que vendrá del backend: especialidades, médicos por especialidad,
// y horarios disponibles por médico. Reemplazar por llamadas axios cuando exista la API.

const mockEspecialidades = [
  { id: 'general',      nombre: 'Medicina General' },
  { id: 'cardiologia',  nombre: 'Cardiología'       },
  { id: 'dermatologia', nombre: 'Dermatología'      },
  { id: 'ortopedia',    nombre: 'Ortopedia'         },
];

const mockMedicos = {
  general: [
    { id: 1, nombre: 'Dr. Carlos Mendoza',  consultorio: 'Consultorio 3' },
    { id: 2, nombre: 'Dra. Paula Jiménez',  consultorio: 'Consultorio 4' },
  ],
  cardiologia: [
    { id: 3, nombre: 'Dra. María Torres',   consultorio: 'Consultorio 8' },
  ],
  dermatologia: [
    { id: 4, nombre: 'Dr. Andrés Ríos',     consultorio: 'Consultorio 12' },
  ],
  ortopedia: [
    { id: 5, nombre: 'Dr. Diego Castillo',  consultorio: 'Consultorio 6' },
  ],
};

// Horarios disponibles por médico (simulado — algunos ya ocupados)
const mockHorarios = {
  1: ['08:00 AM', '09:00 AM', '11:00 AM', '02:00 PM', '03:30 PM'],
  2: ['08:30 AM', '10:00 AM', '01:00 PM', '04:00 PM'],
  3: ['09:00 AM', '10:30 AM', '02:30 PM'],
  4: ['08:00 AM', '11:00 AM', '03:00 PM', '04:30 PM'],
  5: ['09:30 AM', '01:30 PM', '03:00 PM'],
};

// Próximos 7 días hábiles, simulados
function getProximosDias() {
  const dias = [];
  let fecha = new Date();
  let contador = 0;
  while (dias.length < 7) {
    fecha = new Date();
    fecha.setDate(fecha.getDate() + contador);
    contador++;
    // Saltamos fines de semana (0 = domingo, 6 = sábado)
    if (fecha.getDay() !== 0 && fecha.getDay() !== 6) {
      dias.push(new Date(fecha));
    }
  }
  return dias;
}
// ─────────────────────────────────────────────────────────────────────────────

const steps = ['Especialidad', 'Médico', 'Fecha y hora', 'Confirmar'];

export default function NewAppointment() {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [especialidad, setEspecialidad] = useState(null);
  const [medico, setMedico] = useState(null);
  const [fecha, setFecha] = useState(null);
  const [hora, setHora] = useState(null);
  const [confirmado, setConfirmado] = useState(false);

  const proximosDias = useMemo(() => getProximosDias(), []);
  const medicosDisponibles = especialidad ? mockMedicos[especialidad.id] || [] : [];
  const horariosDisponibles = medico ? mockHorarios[medico.id] || [] : [];

  function formatDiaCorto(date) {
    return date.toLocaleDateString('es-CO', { weekday: 'short' });
  }
  function formatDiaNumero(date) {
    return date.getDate();
  }
  function formatMes(date) {
    return date.toLocaleDateString('es-CO', { month: 'short' });
  }
  function formatFechaCompleta(date) {
    return date.toLocaleDateString('es-CO', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    });
  }

  function handleSeleccionarEspecialidad(esp) {
    setEspecialidad(esp);
    setMedico(null); // reset en cascada
    setFecha(null);
    setHora(null);
    setStep(1);
  }

  function handleSeleccionarMedico(med) {
    setMedico(med);
    setFecha(null);
    setHora(null);
    setStep(2);
  }

  function handleConfirmar() {
    // 🔌 AQUÍ CONECTA EL BACKEND:
    // axios.post('/api/appointments/', {
    //   especialidad: especialidad.id, medico: medico.id, fecha, hora
    // })
    setConfirmado(true);
  }

  // ── Pantalla de éxito ──────────────────────────────────────────────────────
  if (confirmado) {
    return (
      <div className="p-6 md:p-8 max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 text-center">
          <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">¡Cita agendada!</h2>
          <p className="text-slate-500 mb-6">
            Te esperamos el {formatFechaCompleta(fecha)} a las {hora}
          </p>
          <div className="bg-slate-50 rounded-xl p-5 text-left mb-6 space-y-2">
            <p className="text-sm"><span className="text-slate-400">Especialidad:</span> <span className="font-medium text-slate-700">{especialidad.nombre}</span></p>
            <p className="text-sm"><span className="text-slate-400">Médico:</span> <span className="font-medium text-slate-700">{medico.nombre}</span></p>
            <p className="text-sm"><span className="text-slate-400">Lugar:</span> <span className="font-medium text-slate-700">{medico.consultorio}</span></p>
          </div>
          <button
            onClick={() => navigate('/patient/home')}
            className="btn bg-gradient-to-r from-blue-600 to-blue-500 text-white border-none px-8"
          >
            Volver al inicio
          </button>
        </div>
      </div>
    );
  }

  // ── Formulario por pasos ────────────────────────────────────────────────────
  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto">

      {/* Encabezado */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate('/patient/home')}
          className="btn btn-ghost btn-sm btn-circle"
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Agendar Cita</h1>
          <p className="text-slate-500 text-sm">Sigue los pasos para reservar tu cita</p>
        </div>
      </div>

      {/* Indicador de pasos */}
      <div className="flex items-center mb-8">
        {steps.map((label, i) => (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                i < step  ? 'bg-blue-600 text-white' :
                i === step ? 'bg-blue-600 text-white ring-4 ring-blue-100' :
                'bg-slate-100 text-slate-400'
              }`}>
                {i < step ? <CheckCircle2 size={16} /> : i + 1}
              </div>
              <span className={`text-xs font-medium ${i <= step ? 'text-slate-700' : 'text-slate-400'}`}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-2 ${i < step ? 'bg-blue-600' : 'bg-slate-200'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">

        {/* Paso 0 — Especialidad */}
        {step === 0 && (
          <div>
            <h3 className="font-semibold text-slate-800 mb-4">¿Qué especialidad necesitas?</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {mockEspecialidades.map((esp) => (
                <button
                  key={esp.id}
                  onClick={() => handleSeleccionarEspecialidad(esp)}
                  className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <Stethoscope size={18} className="text-blue-600" />
                  </div>
                  <span className="font-medium text-slate-700">{esp.nombre}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Paso 1 — Médico */}
        {step === 1 && (
          <div>
            <h3 className="font-semibold text-slate-800 mb-4">
              Médicos de {especialidad.nombre}
            </h3>
            <div className="flex flex-col gap-3">
              {medicosDisponibles.map((med) => (
                <button
                  key={med.id}
                  onClick={() => handleSeleccionarMedico(med)}
                  className="flex items-center gap-3 p-4 rounded-xl border border-slate-200 hover:border-blue-400 hover:bg-blue-50/50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center flex-shrink-0">
                    <User size={18} className="text-slate-500" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">{med.nombre}</p>
                    <p className="text-xs text-slate-400">{med.consultorio}</p>
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={() => setStep(0)}
              className="text-sm text-blue-600 font-medium mt-4 hover:underline"
            >
              ← Cambiar especialidad
            </button>
          </div>
        )}

        {/* Paso 2 — Fecha y hora */}
        {step === 2 && (
          <div>
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Calendar size={18} className="text-blue-600" />
              Elige una fecha
            </h3>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-2 mb-6">
              {proximosDias.map((dia) => (
                <button
                  key={dia.toISOString()}
                  onClick={() => { setFecha(dia); setHora(null); }}
                  className={`flex flex-col items-center py-3 rounded-xl border transition-colors ${
                    fecha?.toDateString() === dia.toDateString()
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-slate-200 hover:border-blue-400 text-slate-700'
                  }`}
                >
                  <span className="text-xs uppercase opacity-70">{formatDiaCorto(dia)}</span>
                  <span className="text-lg font-bold">{formatDiaNumero(dia)}</span>
                  <span className="text-xs opacity-70">{formatMes(dia)}</span>
                </button>
              ))}
            </div>

            {fecha && (
              <>
                <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Clock size={18} className="text-blue-600" />
                  Horarios disponibles
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-4">
                  {horariosDisponibles.map((h) => (
                    <button
                      key={h}
                      onClick={() => setHora(h)}
                      className={`py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                        hora === h
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-slate-200 hover:border-blue-400 text-slate-700'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              </>
            )}

            <div className="flex justify-between items-center mt-6">
              <button
                onClick={() => setStep(1)}
                className="text-sm text-blue-600 font-medium hover:underline"
              >
                ← Cambiar médico
              </button>
              <button
                disabled={!fecha || !hora}
                onClick={() => setStep(3)}
                className="btn bg-gradient-to-r from-blue-600 to-blue-500 text-white border-none px-6 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Paso 3 — Confirmación */}
        {step === 3 && (
          <div>
            <h3 className="font-semibold text-slate-800 mb-4">Confirma tu cita</h3>
            <div className="bg-slate-50 rounded-xl p-5 space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Especialidad</span>
                <span className="font-medium text-slate-700">{especialidad.nombre}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Médico</span>
                <span className="font-medium text-slate-700">{medico.nombre}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Lugar</span>
                <span className="font-medium text-slate-700">{medico.consultorio}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Fecha</span>
                <span className="font-medium text-slate-700 capitalize">{formatFechaCompleta(fecha)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Hora</span>
                <span className="font-medium text-slate-700">{hora}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <button
                onClick={() => setStep(2)}
                className="text-sm text-blue-600 font-medium hover:underline"
              >
                ← Cambiar fecha/hora
              </button>
              <button
                onClick={handleConfirmar}
                className="btn bg-gradient-to-r from-blue-600 to-blue-500 text-white border-none px-8"
              >
                Confirmar Cita
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}