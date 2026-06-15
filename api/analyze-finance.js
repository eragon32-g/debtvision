import { analyzeFinanceHandler } from '../lib/handlers/analyze-finance.js'

export default async function handler(req, res) {
  return analyzeFinanceHandler(req, res)
}
