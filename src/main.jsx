import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext.jsx'
import { FinancialDataProvider } from './hooks/useFinancialData.js'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <FinancialDataProvider>
          <App />
        </FinancialDataProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
