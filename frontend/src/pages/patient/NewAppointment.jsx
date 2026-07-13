import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, User, Calendar, Clock, CheckCircle2, ArrowLeft } from 'lucide-react';
import api from '../../api/client';
import { doctorDisplayName } from '../../utils/appointments';

// Próximos 7 días hábiles (esto es solo UI de calendario, no depende del backend)
function getProximosDias() {
  const dias = [];
  let fecha;
  let contador = 0;
  while (dias.length < 7) {
    fecha = new Date();
    fecha.setDate(fecha.getDate() + contador);
    contador++;
    if (fecha.getDay() !== 0 && fecha.getDay() !== 6) {
      dias.push(new Date(fecha));
    }
  }
  return dias;
}
function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}
function formatTime12h(hhmm) {
  const [h, m] = hhmm.split(':');
  const d = new Date();
  d.setHours(Number(h), Number(m), 0, 0);
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
}

const steps = ['Especialidad', 'Médico', 'Fecha y hora', 'Confirmar'];

export default function NewAppointment() {
  const navigate = useNavigate();

  const [step, setStep] = useState(0);
  const [especialidad, setEspecialidad] = useState(null);
  const [medico, setMedico] = useState(null);
  const [fecha, setFecha] = useState(null);
  const [hora, setHora] = useState(null);
  const [confirmado, setConfirmado] = useState(false);

  const [especialidades, setEspecialidades] = useState([]);
  const [medicos, setMedicos] = useState([]);
  const [horariosDisponibles, setHorariosDisponibles] = useState([]);

  const [loadingEspecialidades, setLoadingEspecialidades] = useState(true);
  const [loadingMedicos, setLoadingMedicos] = useState(false);
  const [loadingHorarios, setLoadingHorarios] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const proximosDias = useMemo(() => getProximosDias(), []);

  useEffect(() => {
    let active = true;
    api.get('/specialties/')
      .then(({ data }) => {
        if (active) setEspecialidades(data.map((s) => ({ id: s.id, nombre: s.name })));
      })
      .catch(() => {
        if (active) setError('No se pudieron cargar las especialidades.');
      })
      .finally(() => {
        if (active) setLoadingEspecialidades(false);
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!especialidad) return;
    let active = true;
    // El loading debe quedar en true de inmediato al cambiar de especialidad,
    // antes de que arranque el fetch — es el patrón esperado aquí.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingMedicos(true);
    api.get(`/doctors/?specialty=${especialidad.id}`)
      .then(({ data }) => {
        if (!active) return;
        setMedicos(data.map((d) => ({
          id: d.id,
          nombre: doctorDisplayName(d),
          consultorio: d.consultorio || 'Por confirmar',
        })));
      })
      .catch(() => {
        if (active) setError('No se pudieron cargar los médicos de esta especialidad.');
      })
      .finally(() => {
        if (active) setLoadingMedicos(false);
      });
    return () => { active = false; };
  }, [especialidad]);

  useEffect(() => {
    if (!medico || !fecha) return;
    let active = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoadingHorarios(true);
    api.get(`/doctors/${medico.id}/availability/?date=${toISODate(fecha)}`)
      .then(({ data }) => {
        if (active) setHorariosDisponibles(data.available_slots);
      })
      .catch(() => {
        if (active) setError('No se pudo cargar la disponibilidad del médico.');
      })
      .finally(() => {
        if (active) setLoadingHorarios(false);
      });
    return () => { active = false; };
  }, [medico, fecha]);

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
    setError('');
    setEspecialidad(esp);
    setMedico(null);
    setFecha(null);
    setHora(null);
    setStep(1);
  }

  function handleSeleccionarMedico(med) {
    setError('');
    setMedico(med);
    setFecha(null);
    setHora(null);
    setStep(2);
  }

  async function handleConfirmar() {
    setError('');
    setSubmitting(true);
    try {
      await api.post('/appointments/', {
        doctor: medico.id,
        specialty: especialidad.id,
        date: toISODate(fecha),
        time: hora,
      });
      setConfirmado(true);
    } catch (err) {
      const data = err?.response?.data;
      const message = data?.non_field_errors?.[0] || data?.detail || 'No se pudo agendar la cita. Intenta con otro horario.';
      setError(message);
      // El horario probablemente ya no está libre: volvemos a elegir fecha/hora.
      setHora(null);
      setStep(2);
    } finally {
      setSubmitting(false);
    }
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
            Te esperamos el {formatFechaCompleta(fecha)} a las {formatTime12h(hora)}
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

      {error && (
        <div className="alert alert-error mb-4 py-2 text-sm">{error}</div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">

        {/* Paso 0 — Especialidad */}
        {step === 0 && (
          <div>
            <h3 className="font-semibold text-slate-800 mb-4">¿Qué especialidad necesitas?</h3>
            {loadingEspecialidades ? (
              <p className="text-sm text-slate-400">Cargando especialidades...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {especialidades.map((esp) => (
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
            )}
          </div>
        )}

        {/* Paso 1 — Médico */}
        {step === 1 && (
          <div>
            <h3 className="font-semibold text-slate-800 mb-4">
              Médicos de {especialidad.nombre}
            </h3>
            {loadingMedicos ? (
              <p className="text-sm text-slate-400">Cargando médicos...</p>
            ) : medicos.length === 0 ? (
              <p className="text-sm text-slate-400">No hay médicos disponibles para esta especialidad.</p>
            ) : (
              <div className="flex flex-col gap-3">
                {medicos.map((med) => (
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
            )}
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
                {loadingHorarios ? (
                  <p className="text-sm text-slate-400 mb-4">Buscando horarios libres...</p>
                ) : horariosDisponibles.length === 0 ? (
                  <p className="text-sm text-slate-400 mb-4">El médico no tiene horarios libres este día. Elige otra fecha.</p>
                ) : (
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
                        {formatTime12h(h)}
                      </button>
                    ))}
                  </div>
                )}
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
                <span className="font-medium text-slate-700">{formatTime12h(hora)}</span>
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
                disabled={submitting}
                className="btn bg-gradient-to-r from-blue-600 to-blue-500 text-white border-none px-8 disabled:opacity-60"
              >
                {submitting ? 'Agendando...' : 'Confirmar Cita'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
