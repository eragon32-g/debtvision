import { useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, Banknote } from 'lucide-react'
import Card from './Card.jsx'
import CurrencyInput from './CurrencyInput.jsx'
import { createEmptyLoan } from '../utils/financialStorage.js'
import { formatCurrency, formatDate } from '../utils/financeCalculations.js'

const inputClass =
  'w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2.5 px-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-brand-500/60 focus:outline-none focus:ring-1 focus:ring-brand-500/40'

function TextField({ id, label, value, onChange, placeholder, type = 'text', min, max }) {
  const isNumber = type === 'number'
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-300">
        {label}
      </label>
      <input
        id={id}
        type={type}
        min={min}
        max={max}
        value={
          isNumber && (value === 0 || value === undefined || value === null) ? '' : value ?? ''
        }
        placeholder={placeholder}
        onChange={(e) => {
          if (isNumber) {
            const raw = e.target.value
            if (raw === '') return onChange(0)
            const parsed = parseFloat(raw)
            return onChange(Number.isFinite(parsed) ? parsed : 0)
          }
          onChange(e.target.value)
        }}
        className={[inputClass, type === 'date' ? '[color-scheme:dark]' : ''].join(' ')}
      />
    </div>
  )
}

function LoanForm({ initialLoan, onSubmit, onCancel }) {
  const [loan, setLoan] = useState(initialLoan)

  const update = (key, value) => setLoan((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!loan.name.trim()) {
      window.alert('Inserisci il nome del finanziamento.')
      return
    }
    onSubmit(loan)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-brand-500/30 bg-slate-900/70 p-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          id="loan-name"
          label="Nome finanziamento"
          value={loan.name}
          onChange={(v) => update('name', v)}
          placeholder="Es. Prestito auto"
        />
        <TextField
          id="loan-lender"
          label="Ente finanziario"
          value={loan.lender}
          onChange={(v) => update('lender', v)}
          placeholder="Es. Banca Esempio"
        />
        <CurrencyInput
          id="loan-initial"
          label="Importo iniziale"
          value={loan.initialAmount}
          onChange={(v) => update('initialAmount', v)}
        />
        <CurrencyInput
          id="loan-remaining"
          label="Importo residuo"
          value={loan.remainingAmount}
          onChange={(v) => update('remainingAmount', v)}
        />
        <CurrencyInput
          id="loan-payment"
          label="Rata mensile"
          value={loan.monthlyPayment}
          onChange={(v) => update('monthlyPayment', v)}
        />
        <TextField
          id="loan-billing-day"
          label="Giorno addebito"
          type="number"
          min={1}
          max={31}
          value={loan.billingDay}
          onChange={(v) => update('billingDay', v)}
          placeholder="1-31"
        />
        <div className="grid grid-cols-2 gap-4">
          <TextField
            id="loan-start"
            label="Data inizio"
            type="date"
            value={loan.startDate}
            onChange={(v) => update('startDate', v)}
          />
          <TextField
            id="loan-end"
            label="Data fine"
            type="date"
            value={loan.endDate}
            onChange={(v) => update('endDate', v)}
          />
        </div>
        <div className="sm:col-span-2">
          <label htmlFor="loan-notes" className="mb-1.5 block text-sm font-medium text-slate-300">
            Note
          </label>
          <textarea
            id="loan-notes"
            rows={2}
            value={loan.notes ?? ''}
            placeholder="Note opzionali"
            onChange={(e) => update('notes', e.target.value)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-100"
        >
          <X size={16} />
          Annulla
        </button>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-500"
        >
          <Check size={16} />
          Salva finanziamento
        </button>
      </div>
    </form>
  )
}

function LoanRow({ loan, onEdit, onRemove }) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-800/80 bg-slate-900/50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-slate-100">{loan.name}</p>
          {loan.lender && (
            <span className="truncate text-xs text-slate-500">· {loan.lender}</span>
          )}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
          <span>
            Residuo:{' '}
            <span className="font-medium text-slate-200">{formatCurrency(loan.remainingAmount)}</span>
          </span>
          <span>
            Rata:{' '}
            <span className="font-medium text-slate-200">{formatCurrency(loan.monthlyPayment)}</span>
          </span>
          {loan.billingDay > 0 && (
            <span>
              Addebito:{' '}
              <span className="font-medium text-slate-200">giorno {loan.billingDay}</span>
            </span>
          )}
          <span>
            {formatDate(loan.startDate)} → {formatDate(loan.endDate)}
          </span>
        </div>
        {loan.notes && <p className="mt-1.5 text-xs text-slate-500">{loan.notes}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={() => onEdit(loan)}
          className="rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
          aria-label="Modifica finanziamento"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={() => onRemove(loan)}
          className="rounded-md p-2 text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
          aria-label="Elimina finanziamento"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

export default function LoansSection({ loans, onAdd, onUpdate, onRemove }) {
  // editing: null | 'new' | id del finanziamento in modifica
  const [editing, setEditing] = useState(null)
  const [draft, setDraft] = useState(null)

  const startAdd = () => {
    setDraft(createEmptyLoan())
    setEditing('new')
  }

  const startEdit = (loan) => {
    setDraft({ ...loan })
    setEditing(loan.id)
  }

  const cancel = () => {
    setEditing(null)
    setDraft(null)
  }

  const handleSubmit = (loan) => {
    if (editing === 'new') {
      onAdd(loan)
    } else {
      onUpdate(loan.id, loan)
    }
    cancel()
  }

  const handleRemove = (loan) => {
    if (window.confirm(`Eliminare il finanziamento "${loan.name || 'senza nome'}"?`)) {
      onRemove(loan.id)
      if (editing === loan.id) cancel()
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10 text-brand-300">
            <Banknote size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Finanziamenti</h3>
            <p className="text-xs text-slate-500">
              {loans.length === 0
                ? 'Nessun finanziamento inserito'
                : `${loans.length} finanziamento${loans.length === 1 ? '' : 'i'}`}
            </p>
          </div>
        </div>

        {editing !== 'new' && (
          <button
            onClick={startAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-500"
          >
            <Plus size={16} />
            Aggiungi
          </button>
        )}
      </div>

      <div className="space-y-3">
        {editing === 'new' && (
          <LoanForm initialLoan={draft} onSubmit={handleSubmit} onCancel={cancel} />
        )}

        {loans.length === 0 && editing !== 'new' && (
          <div className="rounded-xl border border-dashed border-slate-800 py-8 text-center text-sm text-slate-500">
            Aggiungi il tuo primo finanziamento personale.
          </div>
        )}

        {loans.map((loan) =>
          editing === loan.id ? (
            <LoanForm
              key={loan.id}
              initialLoan={draft}
              onSubmit={handleSubmit}
              onCancel={cancel}
            />
          ) : (
            <LoanRow key={loan.id} loan={loan} onEdit={startEdit} onRemove={handleRemove} />
          ),
        )}
      </div>
    </Card>
  )
}
