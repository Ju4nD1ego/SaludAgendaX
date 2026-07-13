from rest_framework import generics, mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, Patient
from .serializers import (
    PatientRegisterSerializer,
    EmailTokenObtainPairSerializer,
    UserBasicSerializer,
    PatientSerializer,
    DoctorSerializer,
)


class IsAdminRole(permissions.BasePermission):
    """Solo administrativos (o superusuarios de Django) pueden pasar."""

    def has_permission(self, request, view):
        user = request.user
        return bool(user and user.is_authenticated and (user.role == User.Role.ADMIN or user.is_superuser))


class IsAdminOrOwnerPatient(permissions.BasePermission):
    """Un paciente solo puede ver/editar su propio perfil; el admin puede con cualquiera."""

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.role == User.Role.ADMIN or user.is_superuser:
            return True
        return hasattr(user, 'patient_profile') and obj.pk == user.patient_profile.pk


class RegisterView(generics.CreateAPIView):
    serializer_class = PatientRegisterSerializer
    permission_classes = [permissions.AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        patient = serializer.save()
        refresh = RefreshToken.for_user(patient.user)
        return Response({
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserBasicSerializer(patient.user).data,
        }, status=status.HTTP_201_CREATED)


class LoginView(generics.GenericAPIView):
    serializer_class = EmailTokenObtainPairSerializer
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(serializer.validated_data)


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        user = request.user
        data = UserBasicSerializer(user).data
        if user.role == User.Role.PACIENTE and hasattr(user, 'patient_profile'):
            data['patient_profile'] = PatientSerializer(user.patient_profile).data
        elif user.role == User.Role.MEDICO and hasattr(user, 'doctor_profile'):
            data['doctor_profile'] = DoctorSerializer(user.doctor_profile).data
        return Response(data)


class PatientViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """Consulta y edición de pacientes. La creación va por /auth/register/."""

    serializer_class = PatientSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrOwnerPatient]

    def get_queryset(self):
        user = self.request.user
        if user.role == User.Role.ADMIN or user.is_superuser:
            return Patient.objects.select_related('user').all()
        if hasattr(user, 'patient_profile'):
            return Patient.objects.filter(pk=user.patient_profile.pk)
        return Patient.objects.none()

    @action(detail=True, methods=['post'], permission_classes=[IsAdminRole])
    def deactivate(self, request, pk=None):
        patient = self.get_object()
        patient.is_active_patient = False
        patient.save(update_fields=['is_active_patient'])
        return Response(PatientSerializer(patient).data)
