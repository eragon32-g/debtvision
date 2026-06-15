import { CloudUpload, Loader2 } from 'lucide-react'
import Card from './Card.jsx'
import { useFinancialData } from '../hooks/useFinancialData.js'

export default function LocalImportBanner() {
  const { importPrompt, importing, importLocalToCloud, dismissLocalImport } = useFinancialData()

  if (!importPrompt) return null

  return (
    <Card className="mb-6 border-brand-500/30 bg-brand-500/5 p-5">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-500/10 text-brand-300">
            <CloudUpload size={20} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Importa dati locali nel cloud</h3>
            <p className="mt-1 max-w-2xl text-sm text-slate-400">
              Abbiamo trovato dati salvati in locale su questo dispositivo. Vuoi importarli nel tuo
              profilo cloud DebtVision? Questa scelta viene proposta una sola volta.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={importLocalToCloud}
            disabled={importing}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-500 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {importing ? <Loader2 size={16} className="animate-spin" /> : <CloudUpload size={16} />}
            Importa dati locali nel cloud
          </button>
          <button
            type="button"
            onClick={dismissLocalImport}
            disabled={importing}
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-300 transition-colors hover:bg-slate-800 disabled:opacity-60"
          >
            Inizia con profilo vuoto
          </button>
        </div>
      </div>
    </Card>
  )
}
