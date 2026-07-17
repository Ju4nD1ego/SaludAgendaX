import datetime
import random
from collections import defaultdict

from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from core.models import Appointment, Doctor, Patient, User

TIME_SLOTS = [
    '08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
]

NOTAS_ATENDIDA = [
    'Consulta de control, sin novedades.',
    'Paciente estable, se ajusta tratamiento.',
    'Se solicitan exámenes de seguimiento.',
    'Evolución favorable, próximo control en un mes.',
    'Se refuerzan recomendaciones y hábitos.',
]

PACIENTES_DEMO = [
    ('laura.gomez', 'Laura', 'Gómez', 'CC', '1000000101', '3011234501', 'EPS Sura', 'Carrera 5 #23-10, Cali'),
    ('julian.restrepo', 'Julián', 'Restrepo', 'CC', '1000000102', '3011234502', 'EPS Sura', 'Calle 18 #6-45, Cali'),
    ('camila.vargas', 'Camila', 'Vargas', 'CC', '1000000103', '3011234503', 'EPS Sura', 'Avenida 6N #28-15, Cali'),
    ('santiago.munoz', 'Santiago', 'Muñoz', 'CC', '1000000104', '3011234504', 'EPS Sanitas', 'Calle 44 #9-80, Cali'),
    ('valentina.ortiz', 'Valentina', 'Ortiz', 'CC', '1000000105', '3011234505', 'EPS Sanitas', 'Carrera 100 #14-22, Cali'),
    ('mateo.herrera', 'Mateo', 'Herrera', 'CC', '1000000106', '3011234506', 'Nueva EPS', 'Calle 70 #3-50, Cali'),
    ('isabella.rojas', 'Isabella', 'Rojas', 'TI', '1000000107', '3011234507', 'Nueva EPS', 'Carrera 30 #19-60, Cali'),
    ('sebastian.pena', 'Sebastián', 'Peña', 'CC', '1000000108', '3011234508', 'Salud Total', 'Calle 25 #40-12, Cali'),
    ('daniela.cardenas', 'Daniela', 'Cárdenas', 'CC', '1000000109', '3011234509', 'Particular / Sin EPS', 'Carrera 80 #11-30, Cali'),
    ('felipe.zapata', 'Felipe', 'Zapata', 'CE', '1000000110', '3011234510', 'EPS Sanitas', 'Calle 5 #38-70, Cali'),
    ('gabriela.moreno', 'Gabriela', 'Moreno', 'CC', '1000000111', '3011234511', 'Nueva EPS', 'Carrera 15 #8-90, Cali'),
    ('nicolas.beltran', 'Nicolás', 'Beltrán', 'CC', '1000000112', '3011234512', 'EPS Sura', 'Avenida 4N #12-40, Cali'),
]


class Command(BaseCommand):
    help = (
        'Agrega pacientes y citas de más volumen (sobre lo que ya exista) para que el '
        'panel administrativo, el calendario y los reportes se vean con datos reales en capturas.'
    )

    def add_arguments(self, parser):
        parser.add_argument(
            '--seed', type=int, default=42,
            help='Semilla aleatoria, para que la generación sea reproducible entre corridas.',
        )

    def handle(self, *args, **options):
        random.seed(options['seed'])

        doctors = list(Doctor.objects.select_related('specialty', 'user').all())
        if not doctors:
            raise CommandError('No hay médicos en la base. Corre primero `python manage.py seed_demo_data`.')

        # Agrupados por especialidad: un paciente no debe recibir dos citas activas
        # en la misma especialidad (viola la regla de frecuencia de negocio).
        doctores_por_especialidad = defaultdict(list)
        for doctor in doctors:
            doctores_por_especialidad[doctor.specialty_id].append(doctor)
        especialidades = list(doctores_por_especialidad.keys())

        patients = self._seed_patients()
        usados = self._slots_ocupados()
        today = timezone.localdate()

        creadas = 0
        for patient in patients:
            n = random.randint(1, min(3, len(especialidades)))
            for specialty_id in random.sample(especialidades, k=n):
                doctor = random.choice(doctores_por_especialidad[specialty_id])
                if self._crear_cita_pasada(patient, doctor, today, usados):
                    creadas += 1
                if random.random() < 0.85 and self._crear_cita_activa(patient, doctor, today, usados):
                    creadas += 1

        self.stdout.write(self.style.SUCCESS(
            f'Listo: {len(patients)} pacientes de reporte disponibles, {creadas} citas nuevas creadas.',
        ))
        self.stdout.write(f'Total de citas en el sistema: {Appointment.objects.count()}')

    def _seed_patients(self):
        patients = []
        for username, first, last, doc_type, doc_number, phone, eps, address in PACIENTES_DEMO:
            user, created = User.objects.get_or_create(
                username=f'{username}@saludagendax.com',
                defaults={
                    'email': f'{username}@saludagendax.com',
                    'first_name': first,
                    'last_name': last,
                    'role': User.Role.PACIENTE,
                },
            )
            if created:
                user.set_password('paciente123')
                user.save()

            patient, _ = Patient.objects.get_or_create(
                user=user,
                defaults={
                    'document_type': doc_type, 'document_number': doc_number,
                    'phone': phone, 'eps': eps, 'address': address,
                },
            )
            patients.append(patient)
        return patients

    def _slots_ocupados(self):
        return {
            (a.doctor_id, a.date, a.time.strftime('%H:%M'))
            for a in Appointment.objects.all().only('doctor_id', 'date', 'time')
        }

    def _proximo_dia_habil(self, date):
        while date.weekday() > 4:  # sábado/domingo -> corre al lunes
            date += datetime.timedelta(days=1)
        return date

    def _slot_libre(self, doctor, date, usados):
        candidatos = [t for t in TIME_SLOTS if (doctor.id, date, t) not in usados]
        if not candidatos:
            return None
        return random.choice(candidatos)

    def _crear_cita_pasada(self, patient, doctor, today, usados):
        if random.random() >= 0.6:
            return False
        fecha = self._proximo_dia_habil(today - datetime.timedelta(days=random.randint(3, 20)))
        hora = self._slot_libre(doctor, fecha, usados)
        if not hora:
            return False
        estado = random.choices(
            [Appointment.Status.ATENDIDA, Appointment.Status.NO_ASISTIO, Appointment.Status.CANCELADA],
            weights=[0.7, 0.15, 0.15],
        )[0]
        notes = random.choice(NOTAS_ATENDIDA) if estado == Appointment.Status.ATENDIDA else ''
        Appointment.objects.get_or_create(
            patient=patient, doctor=doctor, specialty=doctor.specialty, date=fecha, time=hora,
            defaults={'status': estado, 'notes': notes},
        )
        usados.add((doctor.id, fecha, hora))
        return True

    def _crear_cita_activa(self, patient, doctor, today, usados):
        # Sesgado hacia "hoy" para que el dashboard y la agenda se vean llenos.
        offset = random.choice([0, 0, 0, 1, 2, 3, 5, 7, 10, 14])
        fecha = self._proximo_dia_habil(today + datetime.timedelta(days=offset))
        hora = self._slot_libre(doctor, fecha, usados)
        if not hora:
            return False
        estado = Appointment.Status.CONFIRMADA if random.random() < 0.6 else Appointment.Status.PENDIENTE
        Appointment.objects.get_or_create(
            patient=patient, doctor=doctor, specialty=doctor.specialty, date=fecha, time=hora,
            defaults={'status': estado},
        )
        usados.add((doctor.id, fecha, hora))
        return True
