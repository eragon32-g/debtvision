import { registerHandler } from '../../lib/handlers/auth-email.js'

export default async function handler(req, res) {
  return registerHandler(req, res)
}
