// Server API locale DebtVision (Fase 12) — non esporre OPENAI_API_KEY al frontend.
import 'dotenv/config'
import express from 'express'
import { analyzeFinanceHandler } from './api/analyze-finance.js'

const PORT = Number(process.env.API_PORT) || 3001
const app = express()

app.use(express.json({ limit: '2mb' }))

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    aiConfigured: Boolean(
      process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here',
    ),
  })
})

app.post('/api/analyze-finance', (req, res) => {
  analyzeFinanceHandler(req, res)
})

app.listen(PORT, () => {
  console.log(`[DebtVision API] http://localhost:${PORT}`)
  console.log(`[DebtVision API] POST /api/analyze-finance`)
})
