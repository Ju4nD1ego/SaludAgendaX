from rest_framework import status

from core.models import Appointment
from core.tests.base import BaseAPITestCase


class FrequencyRuleTests(BaseAPITestCase):
    def test_bloquea_segunda_cita_activa_en_la_misma_especialidad(self):
        Appointment.objects.create(
            patient=self.patient, doctor=self.doctor, specialty=self.specialty,
            date='2026-08-03', time='08:00', status=Appointment.Status.PENDIENTE,
        )
        self.auth_as_patient()
        response = self.client.post('/api/appointments/', {
            'doctor': self.doctor.id,
            'specialty': self.specialty.id,
            'date': '2026-09-15',  # otro mes, la regla de frecuencia no depende del mes
            'time': '10:00',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('cita activa', str(response.data))

    def test_permite_cita_en_otra_especialidad_aunque_tenga_una_activa(self):
        Appointment.objects.create(
            patient=self.patient, doctor=self.doctor, specialty=self.specialty,
            date='2026-08-03', time='08:00', status=Appointment.Status.PENDIENTE,
        )
        self.auth_as_patient()
        response = self.client.post('/api/appointments/', {
            'doctor': self.other_doctor.id,
            'specialty': self.other_specialty.id,
            'date': '2026-08-10',
            'time': '10:00',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_una_cita_cancelada_no_cuenta_para_la_frecuencia(self):
        Appointment.objects.create(
            patient=self.patient, doctor=self.doctor, specialty=self.specialty,
            date='2026-08-03', time='08:00', status=Appointment.Status.CANCELADA,
        )
        self.auth_as_patient()
        response = self.client.post('/api/appointments/', {
            'doctor': self.doctor.id,
            'specialty': self.specialty.id,
            'date': '2026-08-10',
            'time': '10:00',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class EPSCapRuleTests(BaseAPITestCase):
    def test_bloquea_al_alcanzar_el_tope_mensual_de_citas(self):
        self.eps.monthly_appointment_cap = 1
        self.eps.save()
        Appointment.objects.create(
            patient=self.other_patient, doctor=self.doctor, specialty=self.specialty,
            date='2026-08-05', time='08:00', status=Appointment.Status.CONFIRMADA,
        )
        self.auth_as_patient()
        response = self.client.post('/api/appointments/', {
            'doctor': self.other_doctor.id,
            'specialty': self.other_specialty.id,
            'date': '2026-08-20',  # mismo mes que la cita existente
            'time': '10:00',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('tope', str(response.data))

    def test_el_tope_no_aplica_a_citas_de_otro_mes(self):
        self.eps.monthly_appointment_cap = 1
        self.eps.save()
        Appointment.objects.create(
            patient=self.other_patient, doctor=self.doctor, specialty=self.specialty,
            date='2026-08-05', time='08:00', status=Appointment.Status.CONFIRMADA,
        )
        self.auth_as_patient()
        response = self.client.post('/api/appointments/', {
            'doctor': self.other_doctor.id,
            'specialty': self.other_specialty.id,
            'date': '2026-09-01',  # mes distinto
            'time': '10:00',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_sin_tope_configurado_no_bloquea(self):
        # self.eps ya viene con monthly_appointment_cap=None por defecto
        for i in range(5):
            Appointment.objects.create(
                patient=self.other_patient, doctor=self.doctor, specialty=self.specialty,
                date='2026-08-05', time=f'{8 + i}:00', status=Appointment.Status.CONFIRMADA,
            )
        self.auth_as_patient()
        response = self.client.post('/api/appointments/', {
            'doctor': self.other_doctor.id,
            'specialty': self.other_specialty.id,
            'date': '2026-08-20',
            'time': '10:00',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class EPSBudgetRuleTests(BaseAPITestCase):
    def test_bloquea_al_superar_el_presupuesto_mensual(self):
        self.eps.monthly_budget = 30000  # menor al costo de cualquiera de las especialidades
        self.eps.save()
        self.auth_as_patient()
        response = self.client.post('/api/appointments/', {
            'doctor': self.doctor.id,
            'specialty': self.specialty.id,  # cost=50000 > budget=30000
            'date': '2026-08-20',
            'time': '10:00',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('presupuesto', str(response.data))

    def test_permite_cita_dentro_del_presupuesto_disponible(self):
        self.eps.monthly_budget = 100000
        self.eps.save()
        self.auth_as_patient()
        response = self.client.post('/api/appointments/', {
            'doctor': self.doctor.id,
            'specialty': self.specialty.id,  # cost=50000 <= budget=100000
            'date': '2026-08-20',
            'time': '10:00',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

    def test_eps_no_registrada_en_el_catalogo_no_aplica_control(self):
        self.patient.eps = 'Aseguradora Desconocida'
        self.patient.save()
        self.auth_as_patient()
        response = self.client.post('/api/appointments/', {
            'doctor': self.doctor.id,
            'specialty': self.specialty.id,
            'date': '2026-08-20',
            'time': '10:00',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
