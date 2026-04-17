import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import MainLayout from '@/components/layout/MainLayout'
import LoginPage from '@/pages/auth/LoginPage'
import RegisterPage from '@/pages/auth/RegisterPage'
import DashboardPage from '@/pages/dashboard/DashboardPage'
import QuotationsPage from '@/pages/quotations/QuotationsPage'
import NewQuotationPage from '@/pages/quotations/NewQuotationPage'
import QuotationDetailPage from '@/pages/quotations/QuotationDetailPage'
import ComparisonPage from '@/pages/quotations/ComparisonPage'
import ClientsPage from '@/pages/clients/ClientsPage'
import ClientDetailPage from '@/pages/clients/ClientDetailPage'
import UsersPage from '@/pages/users/UsersPage'
import MonitoringPage from '@/pages/monitoring/MonitoringPage'
import ScrapingMonitorPage from '@/pages/monitoring/ScrapingMonitorPage'
import ChatPage from '@/pages/chat/ChatPage'
import AuditPage from '@/pages/audit/AuditPage'

function ProtectedRoute({ children, roles }: { children: React.ReactNode; roles?: string[] }) {
  const { isAuthenticated, user } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />
  }

  return <>{children}</>
}

export default function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={!isAuthenticated ? <LoginPage /> : <Navigate to="/dashboard" />} />
        <Route path="/register" element={!isAuthenticated ? <RegisterPage /> : <Navigate to="/dashboard" />} />

        {/* Protected */}
        <Route path="/" element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" />} />
          <Route path="dashboard" element={<DashboardPage />} />

          {/* Quotations */}
          <Route path="quotations" element={<QuotationsPage />} />
          <Route path="quotations/new" element={<NewQuotationPage />} />
          <Route path="quotations/:id" element={<QuotationDetailPage />} />
          <Route path="quotations/:id/comparison" element={<ComparisonPage />} />

          {/* Clients (Advisor/Admin) */}
          <Route path="clients" element={
            <ProtectedRoute roles={['Advisor', 'Admin', 'Supervisor']}>
              <ClientsPage />
            </ProtectedRoute>
          } />
          <Route path="clients/:id" element={
            <ProtectedRoute roles={['Advisor', 'Admin', 'Supervisor']}>
              <ClientDetailPage />
            </ProtectedRoute>
          } />

          {/* Users (Admin only) */}
          <Route path="users" element={
            <ProtectedRoute roles={['Admin']}>
              <UsersPage />
            </ProtectedRoute>
          } />

          {/* Monitoring (Admin/Supervisor) */}
          <Route path="monitoring" element={
            <ProtectedRoute roles={['Admin', 'Supervisor']}>
              <MonitoringPage />
            </ProtectedRoute>
          } />
          <Route path="monitoring/scraping" element={
            <ProtectedRoute roles={['Admin', 'Supervisor']}>
              <ScrapingMonitorPage />
            </ProtectedRoute>
          } />

          {/* Audit (Admin) */}
          <Route path="audit" element={
            <ProtectedRoute roles={['Admin']}>
              <AuditPage />
            </ProtectedRoute>
          } />

          {/* AI Chat (all roles) */}
          <Route path="chat" element={<ChatPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
    </BrowserRouter>
  )
}
