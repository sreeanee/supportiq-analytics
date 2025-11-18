import { Routes, Route, Navigate } from 'react-router-dom'
import { MainLayout } from '@/components/Layout'
import { DashboardPage, TicketsPage, LoginPage } from '@/pages'
import { useAuthStore } from '@/stores/authStore'

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore()

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }

  return <>{children}</>
}

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="tickets" element={<TicketsPage />} />
        <Route path="customers" element={<div className="p-6">Customers Page (Coming Soon)</div>} />
        <Route path="analytics" element={<div className="p-6">Analytics Page (Coming Soon)</div>} />
        <Route path="settings" element={<div className="p-6">Settings Page (Coming Soon)</div>} />
        <Route path="help" element={<div className="p-6">Help Page (Coming Soon)</div>} />
      </Route>
    </Routes>
  )
}

export default App
