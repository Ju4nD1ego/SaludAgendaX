import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute   from './components/ProtectedRoute';
import Login          from './pages/Login';
import Register       from './pages/Register';
import MainLayout     from './components/layout/MainLayout';
import PatientHome    from './pages/patient/PatientHome';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminAppointmentsSearch from './pages/admin/AdminAppointmentsSearch';
import AdminPatients from './pages/admin/AdminPatients';
import AdminMedicos from './pages/admin/AdminMedicos';
import NewAppointment from './pages/patient/NewAppointment';
import AppointmentCalendar from './pages/patient/AppointmentCalendar';
import PatientProfile from './pages/patient/PatientProfile';
import PatientHistory from './pages/patient/PatientHistory';
import DoctorAgenda from './pages/medico/DoctorAgenda';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* ── Públicas ───────────────────────────────── */}
          <Route path="/"         element={<Navigate to="/login" replace />} />
          <Route path="/login"    element={<Login />}    />
          <Route path="/register" element={<Register />} />

          {/* ── Paciente (protegida) ───────────────────── */}
          <Route
            path="/patient"
            element={
              <ProtectedRoute allowedRoles={['paciente']}>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="home" replace />} />
            <Route path="home" element={<PatientHome />} />
            <Route path="new-appointment" element={<NewAppointment />} />
            <Route path="calendar" element={<AppointmentCalendar />} />
            <Route path="history" element={<PatientHistory />} />
            <Route path="profile" element={<PatientProfile />} />
          </Route>

          {/* ── Admin (protegida) ──────────────────────── */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="citas" element={<AdminAppointmentsSearch />} />
            <Route path="pacientes" element={<AdminPatients />} />
            <Route path="medicos" element={<AdminMedicos />} />
          </Route>

          <Route
            path="/medico"
            element={
              <ProtectedRoute allowedRoles={['medico']}>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="agenda" replace />} />
            <Route path="agenda" element={<DoctorAgenda />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;