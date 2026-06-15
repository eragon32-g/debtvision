import { Navigate, Route, Routes } from 'react-router-dom'
import MainLayout from './layout/MainLayout.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import Dashboard from './pages/Dashboard.jsx'
import FinancialData from './pages/FinancialData.jsx'
import Forecast from './pages/Forecast.jsx'
import Report from './pages/Report.jsx'
import ScenarioSimulator from './pages/ScenarioSimulator.jsx'
import LoginPage from './pages/LoginPage.jsx'
import AuthCallbackPage from './pages/AuthCallbackPage.jsx'
import EmailConfirmedPage from './pages/EmailConfirmedPage.jsx'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/auth/callback" element={<AuthCallbackPage />} />
      <Route path="/email-confirmed" element={<EmailConfirmedPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/financial-data" element={<FinancialData />} />
          <Route path="/forecast" element={<Forecast />} />
          <Route path="/report" element={<Report />} />
          <Route path="/scenario-simulator" element={<ScenarioSimulator />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}
