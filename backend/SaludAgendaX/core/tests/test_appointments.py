import datetime

from rest_framework import status

from core.models import Appointment
from core.tests.base import BaseAPITestCase


class AppointmentCreationTests(BaseAPITestCase):
    def test_paciente_agenda_cita_para_si_mismo(self):
        self.auth_as_patient()
        response = self.client.post('/api/appointments/', {
            'doctor': self.doctor.id,
            'specialty': self.specialty.id,
            'date': '2026-08-03',  # lunes
            'time': '09:00',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED, response.data)
        self.assertEqual(response.data['patient'], self.patient.id)
        self.assertEqual(response.data['status'], 'pendiente')

    def test_admin_agenda_cita_debe_indicar_paciente(self):
        self.auth_as_admin()
        response = self.client.post('/api/appointments/', {
            'doctor': self.doctor.id,
            'specialty': self.specialty.id,
            'date': '2026-08-03',
            'time': '09:00',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_medico_no_puede_agendar_citas(self):
        self.auth_as_doctor()
        response = self.client.post('/api/appointments/', {
            'doctor': self.doctor.id,
            'specialty': self.specialty.id,
            'date': '2026-08-03',
            'time': '09:00',
        })
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_no_se_permite_doble_reserva_mismo_medico_fecha_hora(self):
        Appointment.objects.create(
            patient=self.other_patient, doctor=self.doctor, specialty=self.specialty,
            date='2026-08-03', time='09:00', status=Appointment.Status.CONFIRMADA,
        )
        self.auth_as_patient()
        response = self.client.post('/api/appointments/', {
            'doctor': self.doctor.id,
            'specialty': self.specialty.id,
            'date': '2026-08-03',
            'time': '09:00',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_horario_liberado_si_la_cita_anterior_fue_cancelada(self):
        Appointment.objects.create(
            patient=self.other_patient, doctor=self.doctor, specialty=self.specialty,
            date='2026-08-03', time='09:00', status=Appointment.Status.CANCELADA,
        )
        self.auth_as_patient()
        response = self.client.post('/api/appointments/', {
            'doctor': self.doctor.id,
            'specialty': self.specialty.id,
            'date': '2026-08-03',
            'time': '09:00',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class AppointmentActionsTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.appointment = Appointment.objects.create(
            patient=self.patient, doctor=self.doctor, specialty=self.specialty,
            date='2026-08-03', time='09:00', status=Appointment.Status.PENDIENTE,
        )

    def test_admin_confirma_cita_pendiente(self):
        self.auth_as_admin()
        response = self.client.patch(f'/api/appointments/{self.appointment.id}/confirm/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.status, Appointment.Status.CONFIRMADA)

    def test_paciente_no_puede_confirmar_cita(self):
        self.auth_as_patient()
        response = self.client.patch(f'/api/appointments/{self.appointment.id}/confirm/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_no_se_puede_confirmar_una_cita_ya_confirmada(self):
        self.appointment.status = Appointment.Status.CONFIRMADA
        self.appointment.save()
        self.auth_as_admin()
        response = self.client.patch(f'/api/appointments/{self.appointment.id}/confirm/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_paciente_dueno_cancela_su_cita(self):
        self.auth_as_patient()
        response = self.client.patch(f'/api/appointments/{self.appointment.id}/cancel/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.appointment.refresh_from_db()
        self.assertEqual(self.appointment.status, Appointment.Status.CANCELADA)

    def test_paciente_no_puede_cancelar_cita_ajena(self):
        self.auth_as(self.other_patient_user)
        response = self.client.patch(f'/api/appointments/{self.appointment.id}/cancel/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_medico_no_puede_cancelar_citas(self):
        self.auth_as_doctor()
        response = self.client.patch(f'/api/appointments/{self.appointment.id}/cancel/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)


class AvailabilityTests(BaseAPITestCase):
    def test_disponibilidad_excluye_horarios_ya_reservados(self):
        lunes = datetime.date(2026, 8, 3)  # weekday() == 0
        Appointment.objects.create(
            patient=self.patient, doctor=self.doctor, specialty=self.specialty,
            date=lunes, time='08:00', status=Appointment.Status.CONFIRMADA,
        )
        self.auth_as_patient()
        response = self.client.get(f'/api/doctors/{self.doctor.id}/availability/?date={lunes.isoformat()}')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn('08:00', response.data['available_slots'])
        self.assertIn('08:30', response.data['available_slots'])

    def test_disponibilidad_requiere_fecha(self):
        self.auth_as_patient()
        response = self.client.get(f'/api/doctors/{self.doctor.id}/availability/')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
