# SaludAgendaX — Estado del proyecto

Documento de contexto para el equipo. Última actualización: 2026-07-5.

## Stack

- **Backend**: Django 6 + Django REST Framework + SimpleJWT (JWT auth), SQLite en desarrollo.
- **Frontend**: React 19 + Vite + React Router + Tailwind/DaisyUI + axios.

## Cómo correrlo en local

```bash
# Backend
cd backend/SaludAgendaX
source venv/bin/activate
python manage.py migrate
python manage.py seed_demo_data   # crea cuentas y datos de prueba, seguro correrlo varias veces
python manage.py runserver        # queda en http://localhost:8000

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev                       # queda en http://localhost:5173
```

### Cuentas de prueba (creadas por `seed_demo_data`)

| Rol | Email | Password |
|---|---|---|
| Admin | admin@saludagendax.com | admin123 |
| Paciente | paciente.demo@saludagendax.com | paciente123 |
| Médico | carlos.mendoza@saludagendax.com | medico123 |
| (otros médicos) | paula.jimenez / maria.torres / andres.rios / diego.castillo @saludagendax.com | medico123 |

## Backend — completo para el PMV

Todo probado con curl contra el backend real. Documentado también en `docs/api/SaludAgendaX.postman_collection.json`.

- **Auth**: `POST /api/auth/register/` (solo pacientes), `POST /api/auth/login/` (por email, no username), `POST /api/auth/refresh/`, `GET /api/auth/me/`.
- **Pacientes** (`/api/patients/`): listar (admin ve todos, paciente ve el suyo), ver, editar, `POST .../deactivate/` (solo admin).
- **Especialidades** (`/api/specialties/`): listar (cualquier autenticado), crear (solo admin).
- **Médicos** (`/api/doctors/`): listar (filtrable `?specialty=`), ver, editar (admin o el propio médico). **No hay endpoint para crear un médico** — el alta se hace manualmente desde `/admin/` de Django.
- **Horarios de médico** (`/api/doctor-schedules/`): listar (filtrable `?doctor=`), crear/editar/borrar (solo admin). El médico solo lee.
- **Citas** (`/api/appointments/`): crear (paciente para sí mismo, admin para cualquiera), listar (filtrado por rol automáticamente: paciente ve las suyas, médico ve las suyas de solo lectura, admin ve todas), `PATCH .../cancel/` (paciente dueño o admin), `PATCH .../confirm/` (solo admin, pendiente→confirmada).
- **Disponibilidad**: `GET /api/doctors/{id}/availability/?date=YYYY-MM-DD` — calcula slots libres cruzando el horario del médico con las citas ya tomadas ese día.

No hay endpoint de "eliminar" citas ni pacientes a propósito — se usa cancelar/desactivar (soft delete) para no perder historial.

## Frontend — conectado (menos lo de abajo)

Páginas ya conectadas a la API real: Login, Register, PatientHome, NewAppointment (wizard con disponibilidad real), AppointmentCalendar (con cancelar), PatientHistory, PatientProfile (editar datos), DoctorAgenda (solo lectura), DoctorProfile (solo lectura: datos + horario), AdminDashboard (stats reales, gráfica, tabla de citas de hoy con Ver/Confirmar/Cancelar, modal de crear cita nueva).

`AuthContext` persiste la sesión en `localStorage` y refresca el token automáticamente si expira.

## Lo que falta

### Asignado — Gestión de Pacientes y Gestión de Médicos/Especialidades
Ver guía detallada más abajo. El backend ya tiene todo lo necesario, solo falta la UI. Los enlaces `/admin/pacientes` y `/admin/medicos` ya están en el Sidebar esperando esas páginas.

### Sin asignar
- Nada pendiente del Sidebar por ahora — se quitaron los enlaces a "Citas" (redundante con el Dashboard, que ya lista las citas del día) y "Reportes" (es de Entrega 2, sin datos de backend). "Mi Perfil" del médico ya se construyó.
- **Alta de médicos**: no hay endpoint de API. Si se necesita desde la app (no desde Django admin), hay que construirlo.
- **Documentación de proceso**: Product Backlog (20 historias, formato estándar, estimadas y priorizadas), Plan del proyecto (cronograma, tareas por integrante, criterios de aceptación, Definition of Done), README real (el actual dice "README TEMPORAL"), ramas de trabajo (todo se ha commiteado directo a `main`, falta `develop`/`feature/*`). **Nada de esto depende de código** y pesa 30% de la nota (Backlog 15% + calidad de repo 15%).

### Explícitamente fuera del PMV (son de la Entrega 2, no hay que hacerlos ahora)
Reglas de negocio de topes EPS/presupuesto, restricciones de frecuencia por paciente, notificaciones por correo, reportes/estadísticas, pruebas automatizadas, despliegue en la nube.

---

## Guía: Gestión de Pacientes + Gestión de Médicos/Especialidades

### De dónde sale en el enunciado
- PMV: *"Gestión básica de pacientes: registro, edición, consulta y desactivación."* / *"Gestión de médicos y especialidades: registro, asignación y configuración de horarios básicos."*
- Sección 4.2: *"Registro y administración de médicos... Gestión de especialidades médicas... Asignación de médicos a especialidades... Control de disponibilidad por médico, incluyendo horarios de atención."*

### Gestión de Pacientes (`/admin/pacientes`)
- Listado de pacientes (nombre, documento, EPS, teléfono, activo/inactivo), con búsqueda.
- Ver/editar un paciente.
- Botón desactivar.

### Gestión de Médicos y Especialidades (`/admin/medicos`)
- Ver/crear especialidades.
- Listado de médicos con su especialidad y consultorio.
- Editar médico (especialidad, consultorio, activo/inactivo).
- Ver y gestionar horarios básicos por médico.

### Endpoints a usar

```
GET    /api/patients/                       listar (admin ve todos)
GET    /api/patients/{id}/                  ver uno
PATCH  /api/patients/{id}/                  editar (phone, eps, address, user:{email})
POST   /api/patients/{id}/deactivate/       desactivar

GET    /api/specialties/                    listar
POST   /api/specialties/                    crear (admin)

GET    /api/doctors/?specialty=<id>         listar / filtrar
GET    /api/doctors/{id}/                   ver uno
PATCH  /api/doctors/{id}/                   editar (specialty_id, consultorio, is_active_doctor)

GET    /api/doctor-schedules/?doctor=<id>   listar horarios de un médico
POST   /api/doctor-schedules/               crear (doctor, day_of_week 0-6, start_time, end_time)
DELETE /api/doctor-schedules/{id}/          borrar
```

### Patrones de código para copiar
- Formulario de edición con "editar/cancelar/guardar": `frontend/src/pages/patient/PatientProfile.jsx`.
- Tabla + modal de detalle + modal de creación con formulario: `frontend/src/pages/admin/AdminDashboard.jsx` (mirar el componente `NuevaCitaModal` al final del archivo).
- Cliente de API ya configurado con el token: `import api from '../../api/client'`, luego `api.get(...)`, `api.patch(...)`, `api.post(...)`.

### ⚠️ Cosas a tener en cuenta
1. **No existe endpoint para crear un médico.** Si hace falta, hay que construirlo antes.
2. **Si el admin va a registrar un paciente nuevo desde el panel**: el endpoint es `POST /api/auth/register/`, pero devuelve tokens de sesión del paciente recién creado. Hay que llamarlo directo con `api.post(...)` e ignorar los tokens de la respuesta — **no** pasar por `AuthContext.register()`, porque eso desloguea al admin y lo loguea como el paciente nuevo.
3. Falta agregar las rutas `/admin/pacientes` y `/admin/medicos` dentro del bloque `<Route path="/admin" ...>` en `frontend/src/App.jsx` (ya está el ejemplo con `dashboard`).
