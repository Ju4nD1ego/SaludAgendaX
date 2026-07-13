from django.contrib.auth.models import AbstractUser
from django.db import models


# ── Usuario personalizado ────────────────────────────────────────────────────
# Extendemos el usuario de Django para agregarle el campo "role", que es
# el mismo concepto que ya usamos en el frontend (AuthContext.jsx -> user.role)
class User(AbstractUser):
    class Role(models.TextChoices):
        PACIENTE = 'paciente', 'Paciente'
        ADMIN = 'admin', 'Administrativo'
        MEDICO = 'medico', 'Médico'

    role = models.CharField(max_length=20, choices=Role.choices, default=Role.PACIENTE)

    def __str__(self):
        return f"{self.get_full_name() or self.username} ({self.role})"


# ── Especialidad médica ──────────────────────────────────────────────────────
class Specialty(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Specialties"


# ── Perfil de Paciente ───────────────────────────────────────────────────────
# Coincide con mockPatient del frontend: documentType, documentNumber, eps, phone
class Patient(models.Model):
    class DocumentType(models.TextChoices):
        CC = 'CC', 'Cédula de Ciudadanía'
        TI = 'TI', 'Tarjeta de Identidad'
        CE = 'CE', 'Cédula de Extranjería'

    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='patient_profile')
    document_type = models.CharField(max_length=5, choices=DocumentType.choices, default=DocumentType.CC)
    document_number = models.CharField(max_length=30, unique=True)
    phone = models.CharField(max_length=20, blank=True)
    eps = models.CharField(max_length=100, blank=True)
    address = models.CharField(max_length=255, blank=True)
    is_active_patient = models.BooleanField(default=True)  # para la "desactivación" que pide el PMV

    def __str__(self):
        return self.user.get_full_name() or self.user.username


# ── Perfil de Médico ──────────────────────────────────────────────────────────
# Coincide con mockMedicos del frontend: nombre, consultorio, especialidad
class Doctor(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='doctor_profile')
    specialty = models.ForeignKey(Specialty, on_delete=models.PROTECT, related_name='doctors')
    consultorio = models.CharField(max_length=100, blank=True)
    is_active_doctor = models.BooleanField(default=True)

    def __str__(self):
        return f"Dr(a). {self.user.get_full_name() or self.user.username} - {self.specialty}"


# ── Horario básico del médico ─────────────────────────────────────────────────
# Bloques recurrentes de disponibilidad por día de la semana, usados para
# calcular los slots libres en el calendario y en el wizard de nueva cita.
class DoctorSchedule(models.Model):
    class DayOfWeek(models.IntegerChoices):
        MONDAY = 0, 'Lunes'
        TUESDAY = 1, 'Martes'
        WEDNESDAY = 2, 'Miércoles'
        THURSDAY = 3, 'Jueves'
        FRIDAY = 4, 'Viernes'
        SATURDAY = 5, 'Sábado'
        SUNDAY = 6, 'Domingo'

    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='schedules')
    day_of_week = models.IntegerField(choices=DayOfWeek.choices)
    start_time = models.TimeField()
    end_time = models.TimeField()
    slot_duration_minutes = models.PositiveIntegerField(default=30)

    class Meta:
        ordering = ['day_of_week', 'start_time']
        unique_together = ('doctor', 'day_of_week', 'start_time')

    def __str__(self):
        return f"{self.doctor} - {self.get_day_of_week_display()} {self.start_time}-{self.end_time}"


# ── Cita médica ───────────────────────────────────────────────────────────────
# Coincide con mockAppointments/mockCitas del frontend: fecha, hora, estado, etc.
class Appointment(models.Model):
    class Status(models.TextChoices):
        PENDIENTE = 'pendiente', 'Pendiente'
        CONFIRMADA = 'confirmada', 'Confirmada'
        CANCELADA = 'cancelada', 'Cancelada'
        ATENDIDA = 'atendida', 'Atendida'
        NO_ASISTIO = 'no_asistio', 'No Asistió'

    patient = models.ForeignKey(Patient, on_delete=models.CASCADE, related_name='appointments')
    doctor = models.ForeignKey(Doctor, on_delete=models.CASCADE, related_name='appointments')
    specialty = models.ForeignKey(Specialty, on_delete=models.PROTECT)
    date = models.DateField()
    time = models.TimeField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDIENTE)
    notes = models.TextField(blank=True)  # para el "diagnóstico" del historial
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['date', 'time']

    def __str__(self):
        return f"{self.patient} con {self.doctor} - {self.date} {self.time}"