import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import LoginPage from './pages/LoginPage'
import AdminLayout from './components/layout/AdminLayout'
import AgentLayout from './components/layout/AgentLayout'
import AdminDashboard from './pages/admin/AdminDashboard'
import LeadsPage from './pages/admin/LeadsPage'
import AgentsPage from './pages/admin/AgentsPage'
import ProjectsPage from './pages/admin/ProjectsPage'
import FollowupsPage from './pages/admin/FollowupsPage'
import CommissionsPage from './pages/admin/CommissionsPage'
import AgentDashboard from './pages/agent/AgentDashboard'
import AgentLeads from './pages/agent/AgentLeads'
import AgentFollowups from './pages/agent/AgentFollowups'
import AgentCommissions from './pages/agent/AgentCommissions'

function ProtectedRoute({ children, role }) {
  const { user, profile, loading } = useAuth()
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="w-6 h-6 border-2 border-gold-500 border-t-transparent rounded-full animate-spin" /></div>
  if (!user) return <Navigate to="/login" replace />
  if (role && profile?.role !== role) return <Navigate to="/" replace />
  return children
}

export default function App() {
  const { user, profile, loading } = useAuth()

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-navy-950">
      <div className="text-center">
        <div className="w-10 h-10 border-2 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-gray-400 text-sm">Memuatkan...</p>
      </div>
    </div>
  )

  return (
    <Routes>
      <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" replace />} />

      {/* Admin routes */}
      <Route path="/admin" element={
        <ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="leads" element={<LeadsPage />} />
        <Route path="agents" element={<AgentsPage />} />
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="followups" element={<FollowupsPage />} />
        <Route path="commissions" element={<CommissionsPage />} />
      </Route>

      {/* Agent routes */}
      <Route path="/agent" element={
        <ProtectedRoute role="agent"><AgentLayout /></ProtectedRoute>
      }>
        <Route index element={<AgentDashboard />} />
        <Route path="leads" element={<AgentLeads />} />
        <Route path="followups" element={<AgentFollowups />} />
        <Route path="commissions" element={<AgentCommissions />} />
      </Route>

      {/* Root redirect */}
      <Route path="/" element={
        !user ? <Navigate to="/login" replace /> :
        profile?.role === 'admin' ? <Navigate to="/admin" replace /> :
        profile?.role === 'agent' ? <Navigate to="/agent" replace /> :
        <Navigate to="/login" replace />
      } />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
