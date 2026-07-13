import datetime

from rest_framework import generics, mixins, permissions, status, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, Patient, Doctor, Specialty, DoctorSchedule, Appointment
from .serializers import (
    PatientRegisterSerializer,
    EmailTokenObtainPairSerializer,
    UserBasicSerializer,
    PatientSerializer,
    DoctorSerializer,
    SpecialtySerializer,
    DoctorScheduleSerializer,
    AppointmentSerializer,
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


class IsAdminOrReadOnly(permissions.BasePermission):
    """Cualquier autenticado puede leer; solo admin puede escribir."""

    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        return bool(user and user.is_authenticated and (user.role == User.Role.ADMIN or user.is_superuser))


class IsAdminOrOwnerDoctor(permissions.BasePermission):
    """Lectura abierta a cualquier autenticado; solo admin o el propio médico pueden editar."""

    def has_object_permission(self, request, view, obj):
        if request.method in permissions.SAFE_METHODS:
            return True
        user = request.user
        if user.role == User.Role.ADMIN or user.is_superuser:
            return True
        return hasattr(user, 'doctor_profile') and obj.pk == user.doctor_profile.pk


class CanCancelAppointment(permissions.BasePermission):
    """Solo el paciente dueño de la cita o el admin pueden cancelarla; el médico no."""

    def has_object_permission(self, request, view, obj):
        user = request.user
        if user.role == User.Role.ADMIN or user.is_superuser:
            return True
        if user.role == User.Role.PACIENTE and hasattr(user, 'patient_profile'):
            return obj.patient_id == user.patient_profile.pk
        return False


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


class SpecialtyViewSet(viewsets.ModelViewSet):
    """Catálogo de especialidades. Lectura abierta, escritura solo admin."""

    queryset = Specialty.objects.all()
    serializer_class = SpecialtySerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]


class DoctorViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.UpdateModelMixin,
    viewsets.GenericViewSet,
):
    """Consulta y edición de médicos. El alta se hace manualmente desde /admin/."""

    serializer_class = DoctorSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrOwnerDoctor]

    def get_queryset(self):
        qs = Doctor.objects.select_related('user', 'specialty').prefetch_related('schedules')
        specialty_id = self.request.query_params.get('specialty')
        if specialty_id:
            qs = qs.filter(specialty_id=specialty_id)
        return qs

    @action(detail=True, methods=['get'])
    def availability(self, request, pk=None):
        doctor = self.get_object()
        date_str = request.query_params.get('date')
        if not date_str:
            raise ValidationError({'date': 'Debes indicar una fecha (YYYY-MM-DD).'})
        try:
            target_date = datetime.date.fromisoformat(date_str)
        except ValueError:
            raise ValidationError({'date': 'Formato de fecha inválido, usa YYYY-MM-DD.'})

        schedules = doctor.schedules.filter(day_of_week=target_date.weekday())
        booked_times = set(
            Appointment.objects.filter(doctor=doctor, date=target_date)
            .exclude(status=Appointment.Status.CANCELADA)
            .values_list('time', flat=True)
        )

        slots = []
        for schedule in schedules:
            current = datetime.datetime.combine(target_date, schedule.start_time)
            end = datetime.datetime.combine(target_date, schedule.end_time)
            step = datetime.timedelta(minutes=schedule.slot_duration_minutes)
            while current < end:
                slot_time = current.time()
                if slot_time not in booked_times:
                    slots.append(slot_time.strftime('%H:%M'))
                current += step

        return Response({
            'doctor': doctor.id,
            'date': date_str,
            'available_slots': slots,
        })


class DoctorScheduleViewSet(viewsets.ModelViewSet):
    """Horarios básicos del médico. El médico solo consulta; el admin los gestiona."""

    serializer_class = DoctorScheduleSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminOrReadOnly]

    def get_queryset(self):
        qs = DoctorSchedule.objects.select_related('doctor')
        doctor_id = self.request.query_params.get('doctor')
        if doctor_id:
            qs = qs.filter(doctor_id=doctor_id)
        return qs


class AppointmentViewSet(
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    mixins.CreateModelMixin,
    viewsets.GenericViewSet,
):
    """Creación y visualización de citas. Cancelar es la única modificación permitida."""

    serializer_class = AppointmentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        qs = Appointment.objects.select_related('patient__user', 'doctor__user', 'specialty')

        if user.role == User.Role.ADMIN or user.is_superuser:
            pass
        elif user.role == User.Role.PACIENTE and hasattr(user, 'patient_profile'):
            qs = qs.filter(patient=user.patient_profile)
        elif user.role == User.Role.MEDICO and hasattr(user, 'doctor_profile'):
            qs = qs.filter(doctor=user.doctor_profile)
        else:
            return Appointment.objects.none()

        date = self.request.query_params.get('date')
        if date:
            qs = qs.filter(date=date)
        doctor_id = self.request.query_params.get('doctor')
        if doctor_id:
            qs = qs.filter(doctor_id=doctor_id)
        status_param = self.request.query_params.get('status')
        if status_param:
            qs = qs.filter(status=status_param)
        return qs

    def perform_create(self, serializer):
        user = self.request.user
        if user.role == User.Role.PACIENTE:
            if not hasattr(user, 'patient_profile'):
                raise PermissionDenied('El usuario no tiene un perfil de paciente asociado.')
            serializer.save(patient=user.patient_profile)
        elif user.role == User.Role.ADMIN or user.is_superuser:
            if not serializer.validated_data.get('patient'):
                raise ValidationError({'patient': 'El administrativo debe indicar el paciente.'})
            serializer.save()
        else:
            raise PermissionDenied('Los médicos no pueden crear citas.')

    @action(detail=True, methods=['patch'], permission_classes=[permissions.IsAuthenticated, CanCancelAppointment])
    def cancel(self, request, pk=None):
        appointment = self.get_object()
        appointment.status = Appointment.Status.CANCELADA
        appointment.save(update_fields=['status'])
        return Response(AppointmentSerializer(appointment).data)
