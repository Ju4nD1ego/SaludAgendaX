import datetime

from django.core.management.base import BaseCommand

from core.models import Appointment
from core.notifications import send_reminder_email


class Command(BaseCommand):
    help = 'Envía recordatorio por correo a las citas confirmadas/pendientes para mañana.'

    def handle(self, *args, **options):
        tomorrow = datetime.date.today() + datetime.timedelta(days=1)
        appointments = Appointment.objects.filter(
            date=tomorrow,
            status__in=[Appointment.Status.PENDIENTE, Appointment.Status.CONFIRMADA],
        ).select_related('patient__user', 'doctor__user', 'specialty')

        count = 0
        for appt in appointments:
            send_reminder_email(appt)
            count += 1

        self.stdout.write(self.style.SUCCESS(f'Recordatorios enviados: {count}'))
