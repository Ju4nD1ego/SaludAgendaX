from django.core.mail import send_mail
from django.conf import settings


def _cita_context(appointment):
    return {
        "paciente": appointment.patient.user.get_full_name() or appointment.patient.user.username,
        "medico": appointment.doctor.user.get_full_name() or appointment.doctor.user.username,
        "especialidad": appointment.specialty.name,
        "fecha": appointment.date.strftime("%d/%m/%Y"),
        "hora": appointment.time.strftime("%H:%M"),
    }


def _destinatario(appointment):
    email = appointment.patient.user.email
    return [email] if email else []


def send_confirmation_email(appointment):
    to = _destinatario(appointment)
    if not to:
        return
    ctx = _cita_context(appointment)
    subject = "Tu cita ha sido confirmada - SaludAgendaX"
    body = (
        f"Hola {ctx['paciente']},\n\n"
        f"Tu cita con {ctx['medico']} ({ctx['especialidad']}) "
        f"el {ctx['fecha']} a las {ctx['hora']} ha sido confirmada.\n\n"
        f"SaludAgendaX"
    )
    send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, to, fail_silently=True)


def send_cancellation_email(appointment):
    to = _destinatario(appointment)
    if not to:
        return
    ctx = _cita_context(appointment)
    subject = "Tu cita ha sido cancelada - SaludAgendaX"
    body = (
        f"Hola {ctx['paciente']},\n\n"
        f"Tu cita con {ctx['medico']} ({ctx['especialidad']}) "
        f"el {ctx['fecha']} a las {ctx['hora']} ha sido cancelada.\n\n"
        f"Si no reconoces esta acción, contacta a la clínica.\n\n"
        f"SaludAgendaX"
    )
    send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, to, fail_silently=True)


def send_reminder_email(appointment):
    to = _destinatario(appointment)
    if not to:
        return
    ctx = _cita_context(appointment)
    subject = "Recordatorio de tu cita mañana - SaludAgendaX"
    body = (
        f"Hola {ctx['paciente']},\n\n"
        f"Te recordamos tu cita con {ctx['medico']} ({ctx['especialidad']}) "
        f"mañana {ctx['fecha']} a las {ctx['hora']}.\n\n"
        f"SaludAgendaX"
    )
    send_mail(subject, body, settings.DEFAULT_FROM_EMAIL, to, fail_silently=True)
