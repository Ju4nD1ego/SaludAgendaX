
## Notificaciones por correo (Entrega 2)

- EMAIL_BACKEND configurado en consola para desarrollo/demo.
- Implementadas 3 notificaciones: confirmación, cancelación y recordatorio (core/notifications.py).
- Enganchadas en AppointmentViewSet.confirm() y .cancel().
- Comando de management send_appointment_reminders para recordatorios de citas del día siguiente.
- Probado end-to-end: los 3 correos verificados en consola del backend (confirmación, cancelación y recordatorio).
