from rest_framework import status

from core.models import Appointment
from core.tests.base import BaseAPITestCase


class DoctorCreationPermissionTests(BaseAPITestCase):
    def _payload(self):
        return {
            'username': 'nuevo.medico@test.com',
            'email': 'nuevo.medico@test.com',
            'password': 'clave12345',
            'specialty_id': self.specialty.id,
        }

    def test_paciente_no_puede_crear_medico(self):
        self.auth_as_patient()
        response = self.client.post('/api/doctors/', self._payload())
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_medico_no_puede_crear_otro_medico(self):
        self.auth_as_doctor()
        response = self.client.post('/api/doctors/', self._payload())
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_puede_crear_medico(self):
        self.auth_as_admin()
        response = self.client.post('/api/doctors/', self._payload())
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['user']['role'], 'medico')


class ReportsPermissionTests(BaseAPITestCase):
    def test_paciente_no_puede_ver_reportes(self):
        self.auth_as_patient()
        response = self.client.get('/api/reports/summary/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_medico_no_puede_ver_reportes(self):
        self.auth_as_doctor()
        response = self.client.get('/api/reports/summary/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_admin_puede_ver_reportes(self):
        self.auth_as_admin()
        response = self.client.get('/api/reports/summary/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)


class AppointmentVisibilityTests(BaseAPITestCase):
    def setUp(self):
        super().setUp()
        self.cita_propia = Appointment.objects.create(
            patient=self.patient, doctor=self.doctor, specialty=self.specialty,
            date='2026-08-03', time='08:00',
        )
        self.cita_ajena = Appointment.objects.create(
            patient=self.other_patient, doctor=self.other_doctor, specialty=self.other_specialty,
            date='2026-08-04', time='09:00',
        )

    def test_paciente_solo_ve_sus_propias_citas(self):
        self.auth_as_patient()
        response = self.client.get('/api/appointments/')
        ids = [c['id'] for c in response.data]
        self.assertIn(self.cita_propia.id, ids)
        self.assertNotIn(self.cita_ajena.id, ids)

    def test_medico_solo_ve_las_citas_que_atiende(self):
        self.auth_as_doctor()
        response = self.client.get('/api/appointments/')
        ids = [c['id'] for c in response.data]
        self.assertIn(self.cita_propia.id, ids)
        self.assertNotIn(self.cita_ajena.id, ids)

    def test_admin_ve_todas_las_citas(self):
        self.auth_as_admin()
        response = self.client.get('/api/appointments/')
        ids = [c['id'] for c in response.data]
        self.assertIn(self.cita_propia.id, ids)
        self.assertIn(self.cita_ajena.id, ids)


class PatientAndSpecialtyPermissionTests(BaseAPITestCase):
    def test_paciente_no_puede_ver_el_perfil_de_otro_paciente(self):
        self.auth_as_patient()
        response = self.client.get(f'/api/patients/{self.other_patient.id}/')
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_paciente_no_puede_desactivar_a_otro_paciente(self):
        self.auth_as_patient()
        response = self.client.post(f'/api/patients/{self.other_patient.id}/deactivate/')
        self.assertIn(response.status_code, (status.HTTP_403_FORBIDDEN, status.HTTP_404_NOT_FOUND))

    def test_cualquier_autenticado_puede_leer_especialidades(self):
        self.auth_as_patient()
        response = self.client.get('/api/specialties/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_solo_admin_puede_crear_especialidades(self):
        self.auth_as_patient()
        response = self.client.post('/api/specialties/', {'name': 'Pediatría', 'cost': 60000})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

        self.auth_as_admin()
        response = self.client.post('/api/specialties/', {'name': 'Pediatría', 'cost': 60000})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
