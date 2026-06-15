import { Link } from 'react-router-dom'
import { CheckCircle2, LogIn } from 'lucide-react'
import Card from '../components/Card.jsx'

export default function EmailConfirmedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 py-10 text-slate-200">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="inline-flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-500/10 text-brand-300 ring-1 ring-brand-500/30">
              <span className="text-sm font-bold">DV</span>
            </div>
            <div className="text-left">
              <p className="text-lg font-semibold text-slate-100">DebtVision</p>
              <p className="text-xs text-slate-500">Account verificato</p>
            </div>
          </div>
        </div>

        <Card className="p-6">
          <div className="space-y-5 py-2 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/30">
              <CheckCircle2 size={28} />
            </div>

            <div>
              <h1 className="text-xl font-semibold text-slate-100">Email confermata</h1>
              <p className="mt-2 text-sm text-brand-200">
                Il tuo account DebtVision è stato verificato correttamente.
              </p>
              <p className="mt-3 text-sm leading-relaxed text-slate-400">
                Ora puoi accedere e iniziare a salvare i tuoi dati finanziari in cloud in modo sicuro.
              </p>
            </div>

            <Link
              to="/login"
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-500"
            >
              <LogIn size={16} />
              Vai al login
            </Link>
          </div>
        </Card>
      </div>
    </div>
  )
}
