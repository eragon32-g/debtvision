import { sendVerificationEmailHandler } from '../../lib/handlers/auth-email.js'

export default async function handler(req, res) {
  return sendVerificationEmailHandler(req, res)
}
