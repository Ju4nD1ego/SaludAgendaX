// Mapeo compartido entre las páginas que consumen /api/appointments/,
// para no repetir el mismo formateo de fecha/hora/nombres en cada componente.

export function doctorDisplayName(doctorDetail) {
  const u = doctorDetail?.user;
  if (!u) return 'Médico por confirmar';
  return `Dr(a). ${u.first_name} ${u.last_name}`.trim();
}

export function patientDisplayName(patientDetail) {
  const u = patientDetail?.user;
  if (!u) return 'Paciente';
  const fullName = `${u.first_name ?? ''} ${u.last_name ?? ''}`.trim();
  return fullName || u.username;
}

// El grid de los calendarios (AppointmentCalendar/DoctorAgenda) indexa por hora entera.
export function getHour24(timeStr) {
  if (!timeStr) return null;
  return Number(timeStr.split(':')[0]);
}

export function formatTime12h(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  const d = new Date();
  d.setHours(Number(h), Number(m), 0, 0);
  return d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function mapAppointment(apt) {
  return {
    id: apt.id,
    patient: patientDisplayName(apt.patient_detail),
    doctor: doctorDisplayName(apt.doctor_detail),
    specialty: apt.specialty_detail?.name ?? 'Especialidad',
    consultorio: apt.doctor_detail?.consultorio || 'Por confirmar',
    date: apt.date,
    time: apt.time,
    hour: getHour24(apt.time),
    timeLabel: formatTime12h(apt.time),
    status: apt.status,
    notes: apt.notes,
  };
}
