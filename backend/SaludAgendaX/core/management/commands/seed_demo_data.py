import datetime

from django.core.management.base import BaseCommand
from django.utils import timezone

from core.models import Appointment, Doctor, DoctorSchedule, Patient, Specialty, User


class Command(BaseCommand):
    help = 'Crea datos de demo idempotentes: especialidades, médicos, horarios, un admin y un paciente con citas.'

    def handle(self, *args, **options):
        specialties = self._seed_specialties()
        doctors = self._seed_doctors(specialties)
        self._seed_schedules(doctors)
        self._seed_admin()
        self._seed_demo_patient(doctors, specialties)

        self.stdout.write(self.style.SUCCESS('Datos de demo listos.'))
        self.stdout.write('')
        self.stdout.write('Cuentas de prueba (password entre paréntesis):')
        self.stdout.write('  admin@saludagendax.com (admin123)')
        self.stdout.write('  paciente.demo@saludagendax.com (paciente123)')
        self.stdout.write('  carlos.mendoza@saludagendax.com, paula.jimenez@saludagendax.com,')
        self.stdout.write('  maria.torres@saludagendax.com, andres.rios@saludagendax.com,')
        self.stdout.write('  diego.castillo@saludagendax.com (medico123 para todos)')

    def _seed_specialties(self):
        names = ['Medicina General', 'Cardiología', 'Dermatología', 'Ortopedia']
        return {name: Specialty.objects.get_or_create(name=name)[0] for name in names}

    def _seed_doctors(self, specialties):
        # Mismos nombres que ya usaba el mock de NewAppointment.jsx, para
        # que la demo se vea consistente entre lo que ya conocía el equipo y los datos reales.
        data = [
            ('carlos.mendoza', 'Carlos', 'Mendoza', 'Medicina General', 'Consultorio 3'),
            ('paula.jimenez', 'Paula', 'Jiménez', 'Medicina General', 'Consultorio 4'),
            ('maria.torres', 'María', 'Torres', 'Cardiología', 'Consultorio 8'),
            ('andres.rios', 'Andrés', 'Ríos', 'Dermatología', 'Consultorio 12'),
            ('diego.castillo', 'Diego', 'Castillo', 'Ortopedia', 'Consultorio 6'),
        ]
        doctors = []
        for username, first_name, last_name, specialty_name, consultorio in data:
            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    'email': f'{username}@saludagendax.com',
                    'first_name': first_name,
                    'last_name': last_name,
                    'role': User.Role.MEDICO,
                },
            )
            if created:
                user.set_password('medico123')
                user.save()

            doctor, _ = Doctor.objects.get_or_create(
                user=user,
                defaults={'specialty': specialties[specialty_name], 'consultorio': consultorio},
            )
            doctors.append(doctor)
        return doctors

    def _seed_schedules(self, doctors):
        for doctor in doctors:
            for day in range(5):  # lunes(0) a viernes(4)
                DoctorSchedule.objects.get_or_create(
                    doctor=doctor, day_of_week=day, start_time='08:00',
                    defaults={'end_time': '12:00', 'slot_duration_minutes': 30},
                )
                DoctorSchedule.objects.get_or_create(
                    doctor=doctor, day_of_week=day, start_time='14:00',
                    defaults={'end_time': '17:00', 'slot_duration_minutes': 30},
                )

    def _seed_admin(self):
        user, created = User.objects.get_or_create(
            username='admin@saludagendax.com',
            defaults={
                'email': 'admin@saludagendax.com',
                'first_name': 'Carlos',
                'last_name': 'Admin',
                'role': User.Role.ADMIN,
                'is_staff': True,
                'is_superuser': True,
            },
        )
        if created:
            user.set_password('admin123')
            user.save()

    def _seed_demo_patient(self, doctors, specialties):
        user, created = User.objects.get_or_create(
            username='paciente.demo@saludagendax.com',
            defaults={
                'email': 'paciente.demo@saludagendax.com',
                'first_name': 'Ana',
                'last_name': 'García',
                'role': User.Role.PACIENTE,
            },
        )
        if created:
            user.set_password('paciente123')
            user.save()

        patient, _ = Patient.objects.get_or_create(
            user=user,
            defaults={
                'document_type': Patient.DocumentType.CC,
                'document_number': '1234567890',
                'phone': '3001234567',
                'eps': 'Sura EPS',
                'address': 'Calle 45 #12-30, Cali',
            },
        )

        today = timezone.localdate()
        medicina_general = doctors[0]
        cardiologia = doctors[2]

        Appointment.objects.get_or_create(
            patient=patient, doctor=medicina_general, specialty=specialties['Medicina General'],
            date=today + datetime.timedelta(days=3), time='09:00',
            defaults={'status': Appointment.Status.CONFIRMADA},
        )
        Appointment.objects.get_or_create(
            patient=patient, doctor=cardiologia, specialty=specialties['Cardiología'],
            date=today + datetime.timedelta(days=10), time='14:30',
            defaults={'status': Appointment.Status.PENDIENTE},
        )
        Appointment.objects.get_or_create(
            patient=patient, doctor=medicina_general, specialty=specialties['Medicina General'],
            date=today - datetime.timedelta(days=20), time='10:00',
            defaults={
                'status': Appointment.Status.ATENDIDA,
                'notes': 'Control general, sin novedades.',
            },
        )
