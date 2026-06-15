import { getEmailHealth } from '../lib/handlers/auth-email.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Metodo non consentito. Usa GET.' })
  }

  const emailHealth = getEmailHealth()

  return res.status(200).json({
    ok: true,
    aiConfigured: Boolean(
      process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key_here',
    ),
    email: emailHealth,
  })
}
