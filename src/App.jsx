import { Routes, Route } from 'react-router-dom'
import MainLayout from './layout/MainLayout.jsx'
import Dashboard from './pages/Dashboard.jsx'
import FinancialData from './pages/FinancialData.jsx'
import Forecast from './pages/Forecast.jsx'
import Report from './pages/Report.jsx'
import ScenarioSimulator from './pages/ScenarioSimulator.jsx'

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/financial-data" element={<FinancialData />} />
        <Route path="/forecast" element={<Forecast />} />
        <Route path="/report" element={<Report />} />
        <Route path="/scenario-simulator" element={<ScenarioSimulator />} />
      </Route>
    </Routes>
  )
}
