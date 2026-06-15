import { sendPasswordResetEmailHandler } from '../../lib/handlers/auth-email.js'

export default async function handler(req, res) {
  return sendPasswordResetEmailHandler(req, res)
}
