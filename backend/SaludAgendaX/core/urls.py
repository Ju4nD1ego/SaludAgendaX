from django.urls import path, include
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from . import views


@api_view(['GET'])
def health_check(request):
    return Response({"status": "ok", "message": "Backend de SaludAgendaX corriendo 🚀"})


router = DefaultRouter()
router.register('patients', views.PatientViewSet, basename='patient')
router.register('specialties', views.SpecialtyViewSet, basename='specialty')
router.register('eps', views.EPSViewSet, basename='eps')
router.register('doctors', views.DoctorViewSet, basename='doctor')
router.register('doctor-schedules', views.DoctorScheduleViewSet, basename='doctorschedule')
router.register('appointments', views.AppointmentViewSet, basename='appointment')

urlpatterns = [
    path('health/', health_check),
    path('auth/register/', views.RegisterView.as_view()),
    path('auth/login/', views.LoginView.as_view()),
    path('auth/refresh/', TokenRefreshView.as_view()),
    path('auth/me/', views.MeView.as_view()),
    path('', include(router.urls)),
]