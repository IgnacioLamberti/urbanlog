import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@clerk/clerk-react'
import ApiAuthSync from './components/ApiAuthSync'
import RoleGuard from './components/RoleGuard'
import Layout from './components/Layout'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import MapPage from './pages/MapPage'
import IncidentsPage from './pages/IncidentsPage'
import IncidentDetailPage from './pages/IncidentDetailPage'
import NewIncidentPage from './pages/NewIncidentPage'
import ModerationQueuePage from './pages/ModerationQueuePage'
import AdminUsersPage from './pages/AdminUsersPage'
import UnauthorizedPage from './pages/UnauthorizedPage'

function PrivateRoute({ children }) {
  const { isLoaded, isSignedIn } = useAuth()

  if (!isLoaded) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#0a0f1e' }}>
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-sky-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400 text-sm">Cargando UrbanLog...</p>
      </div>
    </div>
  )

  return isSignedIn ? children : <Navigate to="/login" />
}

export default function App() {
  return (
    <BrowserRouter>
      <ApiAuthSync />
      <Routes>
        <Route path="/login/*" element={<LoginPage />} />
        <Route path="/register/*" element={<RegisterPage />} />
        <Route path="/unauthorized" element={<UnauthorizedPage />} />

        <Route path="/" element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }>
          <Route index element={<DashboardPage />} />
          <Route path="map" element={<MapPage />} />
          <Route path="incidents" element={<IncidentsPage />} />
          <Route path="incidents/new" element={<NewIncidentPage />} />
          <Route path="incidents/:id" element={<IncidentDetailPage />} />
          <Route path="moderation" element={
            <RoleGuard allow={['moderator', 'admin']}><ModerationQueuePage /></RoleGuard>
          } />
          <Route path="admin/users" element={
            <RoleGuard allow={['admin']}><AdminUsersPage /></RoleGuard>
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
