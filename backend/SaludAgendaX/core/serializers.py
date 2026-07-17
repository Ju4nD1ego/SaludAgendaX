from django.db.models import Sum
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, Specialty, EPS, Patient, Doctor, DoctorSchedule, Appointment

# Reglas de negocio (Entrega 2): un paciente no puede tener más de una cita
# activa (pendiente/confirmada) por especialidad al mismo tiempo.
MAX_CITAS_ACTIVAS_POR_ESPECIALIDAD = 1

ESTADOS_ACTIVOS = [Appointment.Status.PENDIENTE, Appointment.Status.CONFIRMADA]


class UserBasicSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role']
        read_only_fields = ['id', 'role']


class SpecialtySerializer(serializers.ModelSerializer):
    class Meta:
        model = Specialty
        fields = ['id', 'name', 'cost']


class EPSSerializer(serializers.ModelSerializer):
    class Meta:
        model = EPS
        fields = ['id', 'name', 'monthly_appointment_cap', 'monthly_budget']


class DoctorScheduleSerializer(serializers.ModelSerializer):
    day_of_week_display = serializers.CharField(source='get_day_of_week_display', read_only=True)

    class Meta:
        model = DoctorSchedule
        fields = [
            'id', 'doctor', 'day_of_week', 'day_of_week_display',
            'start_time', 'end_time', 'slot_duration_minutes',
        ]


class PatientSerializer(serializers.ModelSerializer):
    user = UserBasicSerializer()

    class Meta:
        model = Patient
        fields = [
            'id', 'user', 'document_type', 'document_number',
            'phone', 'eps', 'address', 'is_active_patient',
        ]

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', None)
        if user_data:
            for attr, value in user_data.items():
                setattr(instance.user, attr, value)
            instance.user.save()
        return super().update(instance, validated_data)


class DoctorSerializer(serializers.ModelSerializer):
    user = UserBasicSerializer()
    specialty = SpecialtySerializer(read_only=True)
    specialty_id = serializers.PrimaryKeyRelatedField(
        queryset=Specialty.objects.all(), source='specialty', write_only=True,
    )
    schedules = DoctorScheduleSerializer(many=True, read_only=True)

    class Meta:
        model = Doctor
        fields = [
            'id', 'user', 'specialty', 'specialty_id',
            'consultorio', 'is_active_doctor', 'schedules',
        ]

    def update(self, instance, validated_data):
        user_data = validated_data.pop('user', None)
        if user_data:
            for attr, value in user_data.items():
                setattr(instance.user, attr, value)
            instance.user.save()
        return super().update(instance, validated_data)


class DoctorRegisterSerializer(serializers.Serializer):
    """Alta de médico: solo admin. Crea el User (role=medico) y su Doctor asociado."""

    username = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    specialty_id = serializers.PrimaryKeyRelatedField(
        queryset=Specialty.objects.all(), source='specialty',
    )
    consultorio = serializers.CharField(required=False, allow_blank=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Ya existe un usuario con ese nombre de usuario.')
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Ya existe un usuario con ese correo.')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        specialty = validated_data.pop('specialty')
        consultorio = validated_data.pop('consultorio', '')
        user = User.objects.create_user(
            role=User.Role.MEDICO, password=password, **validated_data,
        )
        return Doctor.objects.create(user=user, specialty=specialty, consultorio=consultorio)

    def to_representation(self, instance):
        return DoctorSerializer(instance).data


class AppointmentSerializer(serializers.ModelSerializer):
    patient_detail = PatientSerializer(source='patient', read_only=True)
    doctor_detail = DoctorSerializer(source='doctor', read_only=True)
    specialty_detail = SpecialtySerializer(source='specialty', read_only=True)

    class Meta:
        model = Appointment
        fields = [
            'id', 'patient', 'patient_detail', 'doctor', 'doctor_detail',
            'specialty', 'specialty_detail', 'date', 'time', 'status',
            'notes', 'created_at',
        ]
        read_only_fields = ['status', 'created_at']
        extra_kwargs = {'patient': {'required': False}}

    def validate(self, attrs):
        doctor = attrs.get('doctor')
        date = attrs.get('date')
        time = attrs.get('time')
        specialty = attrs.get('specialty')

        if doctor and date and time:
            conflict = Appointment.objects.filter(
                doctor=doctor, date=date, time=time,
            ).exclude(status=Appointment.Status.CANCELADA)
            if conflict.exists():
                raise serializers.ValidationError(
                    'El médico ya tiene una cita activa en ese horario.',
                )

        # El paciente puede no venir en el payload cuando se agenda a sí mismo
        # (el campo es optional para permitir el self-booking); en ese caso lo
        # tomamos del usuario autenticado para poder validar las reglas de negocio.
        patient = attrs.get('patient')
        request = self.context.get('request')
        if patient is None and request is not None and hasattr(request.user, 'patient_profile'):
            patient = request.user.patient_profile

        if patient and specialty:
            self._validar_frecuencia(patient, specialty)
        if patient and specialty and date:
            self._validar_tope_y_presupuesto_eps(patient, specialty, date)

        return attrs

    def _validar_frecuencia(self, patient, specialty):
        activas = Appointment.objects.filter(
            patient=patient, specialty=specialty, status__in=ESTADOS_ACTIVOS,
        ).count()
        if activas >= MAX_CITAS_ACTIVAS_POR_ESPECIALIDAD:
            raise serializers.ValidationError(
                'Ya tienes una cita activa con esta especialidad. '
                'Espera a que se atienda o cancélala antes de agendar otra.',
            )

    def _validar_tope_y_presupuesto_eps(self, patient, specialty, date):
        if not patient.eps:
            return
        eps = EPS.objects.filter(name__iexact=patient.eps).first()
        if eps is None:
            return

        citas_mes = Appointment.objects.filter(
            patient__eps__iexact=patient.eps,
            status__in=ESTADOS_ACTIVOS,
            date__year=date.year,
            date__month=date.month,
        )

        if eps.monthly_appointment_cap is not None:
            if citas_mes.count() >= eps.monthly_appointment_cap:
                raise serializers.ValidationError(
                    f'{eps.name} alcanzó el tope de citas mensuales permitidas '
                    f'({eps.monthly_appointment_cap}). No se pueden agendar más citas este mes.',
                )

        if eps.monthly_budget is not None:
            gasto_actual = citas_mes.aggregate(total=Sum('specialty__cost'))['total'] or 0
            if gasto_actual + specialty.cost > eps.monthly_budget:
                raise serializers.ValidationError(
                    f'{eps.name} superó el presupuesto mensual disponible para citas. '
                    'No se pueden agendar más citas este mes.',
                )


class PatientRegisterSerializer(serializers.Serializer):
    """Registro público: crea un User con role=paciente y su Patient asociado."""

    username = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, min_length=8)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    document_type = serializers.ChoiceField(
        choices=Patient.DocumentType.choices, default=Patient.DocumentType.CC,
    )
    document_number = serializers.CharField()
    phone = serializers.CharField(required=False, allow_blank=True)
    eps = serializers.CharField(required=False, allow_blank=True)
    address = serializers.CharField(required=False, allow_blank=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Ya existe un usuario con ese nombre de usuario.')
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Ya existe un usuario con ese correo.')
        return value

    def validate_document_number(self, value):
        if Patient.objects.filter(document_number=value).exists():
            raise serializers.ValidationError('Ya existe un paciente con ese número de documento.')
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        patient_fields = {
            key: validated_data.pop(key)
            for key in ['document_type', 'document_number', 'phone', 'eps', 'address']
            if key in validated_data
        }
        user = User.objects.create_user(
            role=User.Role.PACIENTE, password=password, **validated_data,
        )
        return Patient.objects.create(user=user, **patient_fields)


class EmailTokenObtainPairSerializer(serializers.Serializer):
    """Login por email (en vez de username), como ya lo espera Login.jsx."""

    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        try:
            user = User.objects.get(email=attrs['email'])
        except User.DoesNotExist:
            raise serializers.ValidationError('Credenciales inválidas.')

        if not user.check_password(attrs['password']) or not user.is_active:
            raise serializers.ValidationError('Credenciales inválidas.')

        refresh = RefreshToken.for_user(user)
        return {
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'user': UserBasicSerializer(user).data,
        }
