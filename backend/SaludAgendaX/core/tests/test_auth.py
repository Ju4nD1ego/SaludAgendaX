from rest_framework import status
from rest_framework.test import APITestCase

from core.models import Patient, User


class RegisterTests(APITestCase):
    def test_registro_crea_usuario_paciente_y_devuelve_tokens(self):
        response = self.client.post('/api/auth/register/', {
            'username': 'nuevo@test.com',
            'email': 'nuevo@test.com',
            'password': 'clave12345',
            'first_name': 'Nuevo',
            'last_name': 'Paciente',
            'document_number': '5551234',
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertTrue(User.objects.filter(username='nuevo@test.com').exists())
        self.assertTrue(Patient.objects.filter(document_number='5551234').exists())

    def test_registro_rechaza_documento_duplicado(self):
        User_ = User.objects.create_user(username='u1', email='u1@test.com', password='clave12345')
        Patient.objects.create(user=User_, document_number='5551234')

        response = self.client.post('/api/auth/register/', {
            'username': 'otro@test.com',
            'email': 'otro@test.com',
            'password': 'clave12345',
            'document_number': '5551234',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class LoginTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='paciente@test.com', email='paciente@test.com', password='clave12345',
        )

    def test_login_correcto_por_email(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'paciente@test.com', 'password': 'clave12345',
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_login_password_incorrecta(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'paciente@test.com', 'password': 'incorrecta',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_login_email_inexistente(self):
        response = self.client.post('/api/auth/login/', {
            'email': 'no-existe@test.com', 'password': 'clave12345',
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class MeViewTests(APITestCase):
    def test_me_requiere_autenticacion(self):
        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_incluye_perfil_de_paciente(self):
        user = User.objects.create_user(
            username='p@test.com', email='p@test.com', password='clave12345', role=User.Role.PACIENTE,
        )
        Patient.objects.create(user=user, document_number='999')
        self.client.force_authenticate(user=user)

        response = self.client.get('/api/auth/me/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('patient_profile', response.data)
