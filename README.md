# SaludAgendaX

Sistema de agendamiento de citas médicas. Proyecto del curso **Desarrollo de Software I** (2026-I), Universidad del Valle.

Permite a pacientes agendar citas con disponibilidad real de los médicos, a administrativos gestionar pacientes/médicos/especialidades y aplicar reglas de negocio por EPS, y a médicos consultar su agenda.

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Django 6 + Django REST Framework + SimpleJWT (JWT) |
| Base de datos | SQLite |
| Frontend | React 19 + Vite + React Router v7 + Tailwind/DaisyUI + axios + Recharts |

## Cómo correrlo en local

### Backend

```bash
cd backend/SaludAgendaX
python -m venv venv
source venv/bin/activate          # en Windows: venv\Scripts\activate
pip install -r requirements.txt

python manage.py migrate
python manage.py seed_demo_data   # crea especialidades, médicos, EPS, admin y un paciente demo
python manage.py seed_report_data # opcional: agrega pacientes/citas extra para ver el panel más lleno

python manage.py runserver        # http://localhost:8000
```

### Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev                       # http://localhost:5173
```

### Cuentas de prueba

Creadas por `seed_demo_data` :

| Rol | Correo | Contraseña |
|---|---|---|
| Administrativo | `admin@saludagendax.com` | `admin123` |
| Paciente | `paciente.demo@saludagendax.com` | `paciente123` |
| Médico | `carlos.mendoza@saludagendax.com` (y `paula.jimenez`, `maria.torres`, `andres.rios`, `diego.castillo`, todos `@saludagendax.com`) | `medico123` |

Si corriste `seed_report_data`, también hay ~12 pacientes adicionales (`laura.gomez@saludagendax.com`, etc., mismo dominio) con contraseña `paciente123`, con historiales de citas variados.

## Funcionalidades

**Autenticación**: registro público de pacientes, login por correo, sesión persistente con refresh automático de token.

**Paciente**: agendar cita (wizard con disponibilidad real por médico y fecha), calendario de citas propias, cancelar cita, historial con notas clínicas, editar perfil.

**Médico**: consultar su agenda, ver su horario y datos (solo lectura).

**Administrativo**:
- Gestión de pacientes: buscar, ver, editar, desactivar, crear.
- Gestión de médicos y especialidades: buscar, ver, editar, activar/desactivar, crear médico, gestionar horarios, crear especialidad.
- Gestión de citas: buscar/filtrar, confirmar, cancelar.
- Reglas de negocio por EPS: configurar tope mensual de citas y presupuesto mensual (`/admin/eps`).
- Reportes y estadísticas: citas por especialidad/médico/EPS/estado/día, con gráficas y filtro de rango de fechas (`/admin/reportes`).
- Dashboard con resumen del día y gráfica de ocupación semanal.

**Reglas de negocio** (validadas automáticamente al agendar una cita):
- Un paciente no puede tener dos citas activas en la misma especialidad a la vez.
- Una EPS no puede superar su tope mensual de citas ni su presupuesto mensual configurado.

## Estructura del proyecto

```
backend/SaludAgendaX/
  core/
    models.py                 # Usuario, Paciente, Médico, Especialidad, EPS, Horario, Cita
    serializers.py
    views.py                  # ViewSets, permisos por rol, reglas de negocio
    urls.py
    tests/                    # 42 pruebas automatizadas (auth, citas, reglas de negocio, permisos)
    management/commands/
      seed_demo_data.py       # datos base idempotentes
      seed_report_data.py     # datos adicionales para demos/capturas

frontend/src/
  pages/
    patient/                  # Inicio, nueva cita, calendario, historial, perfil
    medico/                   # Agenda, perfil
    admin/                    # Dashboard, citas, pacientes, médicos, EPS, reportes
  context/AuthContext.jsx     # sesión, persistencia en localStorage
  api/client.js               # axios + interceptores de JWT

docs/
  api/SaludAgendaX.postman_collection.json   # colección Postman de la API
  ESTADO_PROYECTO.md                         # notas de estado para el equipo
```

## Pruebas automatizadas

```bash
cd backend/SaludAgendaX
source venv/bin/activate
python manage.py test core
```

## Documentación de la API

Colección de Postman en `docs/api/SaludAgendaX.postman_collection.json` (incluye login con captura automática de token).

## Equipo

Proyecto desarrollado por el equipo Scrum del curso Desarrollo de Software I (2026-I), Universidad del Valle.
