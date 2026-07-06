import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute   from './components/ProtectedRoute';
import Login          from './pages/Login';
import Register       from './pages/Register';
import MainLayout     from './components/layout/MainLayout';
import PatientHome    from './pages/patient/PatientHome';
import AdminDashboard from './pages/admin/AdminDashboard';

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
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;