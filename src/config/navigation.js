import { LayoutDashboard, Database, TrendingUp, FileBarChart, FlaskConical } from 'lucide-react'

// Voci di navigazione condivise tra Sidebar e Topbar
export const navItems = [
  {
    label: 'Dashboard',
    path: '/',
    icon: LayoutDashboard,
    description: 'Panoramica generale della situazione finanziaria',
  },
  {
    label: 'Financial Data',
    path: '/financial-data',
    icon: Database,
    description: 'Debiti, finanziamenti, carte, fidi e rateizzazioni',
  },
  {
    label: 'Forecast',
    path: '/forecast',
    icon: TrendingUp,
    description: 'Proiezioni e previsioni dei flussi futuri',
  },
  {
    label: 'Report',
    path: '/report',
    icon: FileBarChart,
    description: 'Report e analisi dettagliate',
  },
  {
    label: 'Scenario Simulator',
    path: '/scenario-simulator',
    icon: FlaskConical,
    description: 'Simula scenari decisionali e confronta l\'impatto',
  },
]
