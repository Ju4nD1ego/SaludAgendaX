from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, Specialty, Patient, Doctor, DoctorSchedule, Appointment


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    # Agregamos "role" a los campos visibles/editables del admin de usuarios
    fieldsets = UserAdmin.fieldsets + (
        ('Rol del sistema', {'fields': ('role',)}),
    )
    list_display = ('username', 'email', 'role', 'is_staff')
    list_filter = ('role', 'is_staff')


@admin.register(Specialty)
class SpecialtyAdmin(admin.ModelAdmin):
    list_display = ('name',)


@admin.register(Patient)
class PatientAdmin(admin.ModelAdmin):
    list_display = ('user', 'document_number', 'eps', 'is_active_patient')
    list_filter = ('eps', 'is_active_patient')


@admin.register(Doctor)
class DoctorAdmin(admin.ModelAdmin):
    list_display = ('user', 'specialty', 'consultorio', 'is_active_doctor')
    list_filter = ('specialty', 'is_active_doctor')


@admin.register(DoctorSchedule)
class DoctorScheduleAdmin(admin.ModelAdmin):
    list_display = ('doctor', 'day_of_week', 'start_time', 'end_time', 'slot_duration_minutes')
    list_filter = ('day_of_week', 'doctor')


@admin.register(Appointment)
class AppointmentAdmin(admin.ModelAdmin):
    list_display = ('patient', 'doctor', 'specialty', 'date', 'time', 'status')
    list_filter = ('status', 'specialty', 'date')