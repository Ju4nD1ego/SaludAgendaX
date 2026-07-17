from rest_framework.test import APITestCase

from core.models import EPS, Doctor, DoctorSchedule, Patient, Specialty, User


class BaseAPITestCase(APITestCase):
    """Fixtures comunes: especialidad, EPS, médico y paciente, listos para usar en cualquier test."""

    def setUp(self):
        self.specialty = Specialty.objects.create(name='Medicina General', cost=50000)
        self.other_specialty = Specialty.objects.create(name='Cardiología', cost=120000)

        self.eps = EPS.objects.create(name='EPS Sura', monthly_appointment_cap=None, monthly_budget=None)

        self.admin_user = User.objects.create_user(
            username='admin', email='admin@test.com', password='admin12345', role=User.Role.ADMIN,
        )

        self.doctor_user = User.objects.create_user(
            username='medico1', email='medico1@test.com', password='medico12345', role=User.Role.MEDICO,
        )
        self.doctor = Doctor.objects.create(
            user=self.doctor_user, specialty=self.specialty, consultorio='C1',
        )
        DoctorSchedule.objects.create(
            doctor=self.doctor, day_of_week=0, start_time='08:00', end_time='12:00', slot_duration_minutes=30,
        )

        self.other_doctor_user = User.objects.create_user(
            username='medico2', email='medico2@test.com', password='medico12345', role=User.Role.MEDICO,
        )
        self.other_doctor = Doctor.objects.create(
            user=self.other_doctor_user, specialty=self.other_specialty, consultorio='C2',
        )

        self.patient_user = User.objects.create_user(
            username='paciente1', email='paciente1@test.com', password='paciente12345', role=User.Role.PACIENTE,
        )
        self.patient = Patient.objects.create(
            user=self.patient_user, document_type=Patient.DocumentType.CC,
            document_number='1000000001', eps='EPS Sura',
        )

        self.other_patient_user = User.objects.create_user(
            username='paciente2', email='paciente2@test.com', password='paciente12345', role=User.Role.PACIENTE,
        )
        self.other_patient = Patient.objects.create(
            user=self.other_patient_user, document_type=Patient.DocumentType.CC,
            document_number='1000000002', eps='EPS Sura',
        )

    def auth_as(self, user):
        self.client.force_authenticate(user=user)

    def auth_as_admin(self):
        self.auth_as(self.admin_user)

    def auth_as_patient(self):
        self.auth_as(self.patient_user)

    def auth_as_doctor(self):
        self.auth_as(self.doctor_user)
