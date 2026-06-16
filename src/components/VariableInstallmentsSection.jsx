import { useState } from 'react'
import { Plus, Pencil, Trash2, X, Check, Layers, ChevronRight } from 'lucide-react'
import Card from './Card.jsx'
import CurrencyInput from './CurrencyInput.jsx'
import { createEmptyVariableProduct, createEmptyInstallment } from '../utils/financialStorage.js'
import {
  formatCurrency,
  getInternalInstallmentsMonthlyPayment,
} from '../utils/financeCalculations.js'
import {
  computeInstallmentFields,
  INSTALLMENT_AUTO_HINT,
} from '../utils/installmentDates.js'

const inputClass =
  'w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2.5 px-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-brand-500/60 focus:outline-none focus:ring-1 focus:ring-brand-500/40'

function toDateInputValue(value) {
  if (!value) return ''
  if (/^\d{4}-\d{2}$/.test(value)) return `${value}-01`
  return value
}

function ComputedField({ label, value, hint }) {
  return (
    <div>
      <p className="mb-1.5 text-sm font-medium text-slate-300">{label}</p>
      <div className="rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2.5 text-sm text-slate-200">
        {value}
      </div>
      {hint && <p className="mt-1 text-xs text-brand-300/90">{hint}</p>}
    </div>
  )
}

function formatDisplayDate(value) {
  if (!value) return '—'
  if (/^\d{4}-\d{2}$/.test(value)) {
    const [year, month] = value.split('-')
    return `${month}/${year}`
  }
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [year, month, day] = value.split('-')
    return `${day}/${month}/${year}`
  }
  return value
}

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

function FormActions({ onCancel }) {
  return (
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
        Salva
      </button>
    </div>
  )
}

function ProductForm({ initial, onSubmit, onCancel }) {
  const [product, setProduct] = useState(initial)
  const update = (key, value) => setProduct((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!String(product.name ?? '').trim()) {
      window.alert('Inserisci il nome del prodotto.')
      return
    }
    onSubmit(product)
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-brand-500/30 bg-slate-900/70 p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <TextField
          id="vip-name"
          label="Nome prodotto"
          value={product.name}
          onChange={(v) => update('name', v)}
          placeholder="Es. Cofidis"
        />
        <TextField
          id="vip-issuer"
          label="Ente / Emittente"
          value={product.issuer}
          onChange={(v) => update('issuer', v)}
          placeholder="Es. Cofidis"
        />
        <CurrencyInput
          id="vip-monthly"
          label="Rata mensile attuale totale"
          value={product.monthlyPayment}
          onChange={(v) => update('monthlyPayment', v)}
        />
        <CurrencyInput
          id="vip-remaining"
          label="Importo residuo stimato"
          value={product.remainingAmount}
          onChange={(v) => update('remainingAmount', v)}
        />
        <TextField
          id="vip-billing-day"
          label="Giorno addebito"
          type="number"
          min={1}
          max={31}
          value={product.billingDay}
          onChange={(v) => update('billingDay', v)}
          placeholder="1-31"
        />
        <div className="sm:col-span-2">
          <label htmlFor="vip-notes" className="mb-1.5 block text-sm font-medium text-slate-300">
            Note
          </label>
          <textarea
            id="vip-notes"
            rows={2}
            value={product.notes ?? ''}
            placeholder="Note opzionali"
            onChange={(e) => update('notes', e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      <FormActions onCancel={onCancel} />
    </form>
  )
}

function InstallmentForm({ initial, onSubmit, onCancel }) {
  const [inst, setInst] = useState(initial)
  const update = (key, value) => setInst((prev) => ({ ...prev, [key]: value }))
  const computed = computeInstallmentFields(inst)

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!String(inst.description ?? '').trim()) {
      window.alert('Inserisci la descrizione dell\'acquisto.')
      return
    }
    onSubmit({
      ...inst,
      ...computeInstallmentFields(inst),
    })
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-brand-500/30 bg-slate-950/40 p-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <TextField
            id="inst-desc"
            label="Descrizione acquisto"
            value={inst.description}
            onChange={(v) => update('description', v)}
            placeholder="Es. Smartphone"
          />
        </div>
        <CurrencyInput
          id="inst-initial"
          label="Importo iniziale"
          value={inst.initialAmount}
          onChange={(v) => update('initialAmount', v)}
        />
        <CurrencyInput
          id="inst-monthly"
          label="Rata mensile"
          value={inst.monthlyPayment}
          onChange={(v) => update('monthlyPayment', v)}
        />
        <TextField
          id="inst-total"
          label="Numero rate totali"
          type="number"
          min={0}
          value={inst.totalInstallments}
          onChange={(v) => update('totalInstallments', v)}
        />
        <TextField
          id="inst-start"
          label="Data inizio / acquisto"
          type="date"
          value={toDateInputValue(inst.startDate)}
          onChange={(v) => update('startDate', v)}
        />
        <ComputedField
          label="Prima rata"
          value={formatDisplayDate(computed.firstPaymentDate)}
          hint={INSTALLMENT_AUTO_HINT}
        />
        <ComputedField
          label="Rate già pagate"
          value={String(computed.paidInstallments)}
          hint={INSTALLMENT_AUTO_HINT}
        />
        <ComputedField
          label="Rate mancanti"
          value={String(computed.remainingInstallments)}
          hint={INSTALLMENT_AUTO_HINT}
        />
        <ComputedField
          label="Importo residuo"
          value={formatCurrency(computed.remainingAmount)}
          hint={INSTALLMENT_AUTO_HINT}
        />
        <ComputedField
          label="Data scadenza"
          value={formatDisplayDate(computed.endDate)}
          hint={INSTALLMENT_AUTO_HINT}
        />
        <div className="sm:col-span-2">
          <label htmlFor="inst-notes" className="mb-1.5 block text-sm font-medium text-slate-300">
            Note
          </label>
          <textarea
            id="inst-notes"
            rows={2}
            value={inst.notes ?? ''}
            placeholder="Note opzionali"
            onChange={(e) => update('notes', e.target.value)}
            className={inputClass}
          />
        </div>
      </div>
      <FormActions onCancel={onCancel} />
    </form>
  )
}

function InstallmentRow({ installment, onEdit, onRemove }) {
  const computed = computeInstallmentFields(installment)
  const months = computed.remainingInstallments
  const endLabel = formatDisplayDate(computed.endDate)
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-slate-800/70 bg-slate-950/30 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-100">{installment.description}</p>
        <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
          <span>
            Rata: <span className="font-medium text-slate-200">{formatCurrency(installment.monthlyPayment)}</span>
          </span>
          <span>
            Residuo: <span className="font-medium text-slate-200">{formatCurrency(computed.remainingAmount)}</span>
          </span>
          <span>
            Rate:{' '}
            <span className="font-medium text-slate-200">
              {computed.paidInstallments}/{installment.totalInstallments}
            </span>
          </span>
          <span>
            Mancano: <span className="font-medium text-slate-200">{months} {months === 1 ? 'mese' : 'mesi'}</span>
          </span>
          {endLabel !== '—' && (
            <span>
              Scadenza: <span className="font-medium text-slate-200">{endLabel}</span>
            </span>
          )}
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5">
        <button
          onClick={() => onEdit(installment)}
          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
          aria-label="Modifica rateizzazione"
        >
          <Pencil size={15} />
        </button>
        <button
          onClick={() => onRemove(installment)}
          className="rounded-md p-1.5 text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
          aria-label="Elimina rateizzazione"
        >
          <Trash2 size={15} />
        </button>
      </div>
    </div>
  )
}

function ProductCard({
  product,
  onEditProduct,
  onRemoveProduct,
  onAddInstallment,
  onUpdateInstallment,
  onRemoveInstallment,
}) {
  const [editingInstallment, setEditingInstallment] = useState(null) // null | 'new' | id
  const [draft, setDraft] = useState(null)

  const installments = product.installments ?? []
  const internalMonthly = getInternalInstallmentsMonthlyPayment(product)

  const startAddInstallment = () => {
    setDraft(createEmptyInstallment())
    setEditingInstallment('new')
  }
  const startEditInstallment = (inst) => {
    setDraft({ ...inst })
    setEditingInstallment(inst.id)
  }
  const cancelInstallment = () => {
    setEditingInstallment(null)
    setDraft(null)
  }
  const submitInstallment = (inst) => {
    if (editingInstallment === 'new') {
      onAddInstallment(product.id, inst)
    } else {
      onUpdateInstallment(product.id, inst.id, inst)
    }
    cancelInstallment()
  }
  const removeInstallment = (inst) => {
    if (window.confirm(`Eliminare la rateizzazione "${inst.description || 'senza descrizione'}"?`)) {
      onRemoveInstallment(product.id, inst.id)
      if (editingInstallment === inst.id) cancelInstallment()
    }
  }

  return (
    <div className="rounded-xl border border-slate-800/80 bg-slate-900/50 p-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold text-slate-100">{product.name}</p>
            {product.issuer && <span className="truncate text-xs text-slate-500">· {product.issuer}</span>}
          </div>
          <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
            <span>
              Rata totale: <span className="font-medium text-slate-200">{formatCurrency(product.monthlyPayment)}</span>
            </span>
            <span>
              Residuo stimato: <span className="font-medium text-slate-200">{formatCurrency(product.remainingAmount)}</span>
            </span>
            {product.billingDay > 0 && (
              <span>
                Addebito: <span className="font-medium text-slate-200">giorno {product.billingDay}</span>
              </span>
            )}
            <span>
              Somma rate interne: <span className="font-medium text-slate-200">{formatCurrency(internalMonthly)}</span>
            </span>
          </div>
          {product.notes && <p className="mt-1.5 text-xs text-slate-500">{product.notes}</p>}
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={() => onEditProduct(product)}
            className="rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
            aria-label="Modifica prodotto"
          >
            <Pencil size={16} />
          </button>
          <button
            onClick={() => onRemoveProduct(product)}
            className="rounded-md p-2 text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
            aria-label="Elimina prodotto"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {/* Rateizzazioni interne */}
      <div className="mt-4 border-t border-slate-800/60 pt-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
            <ChevronRight size={14} />
            Rateizzazioni interne
          </div>
          {editingInstallment !== 'new' && (
            <button
              onClick={startAddInstallment}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-800 bg-slate-900/70 px-2.5 py-1.5 text-xs font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-100"
            >
              <Plus size={14} />
              Aggiungi rateizzazione
            </button>
          )}
        </div>

        <div className="space-y-2.5">
          {editingInstallment === 'new' && (
            <InstallmentForm initial={draft} onSubmit={submitInstallment} onCancel={cancelInstallment} />
          )}

          {installments.length === 0 && editingInstallment !== 'new' && (
            <p className="rounded-lg border border-dashed border-slate-800 py-4 text-center text-xs text-slate-500">
              Nessuna rateizzazione interna.
            </p>
          )}

          {installments.map((inst) =>
            editingInstallment === inst.id ? (
              <InstallmentForm
                key={inst.id}
                initial={draft}
                onSubmit={submitInstallment}
                onCancel={cancelInstallment}
              />
            ) : (
              <InstallmentRow
                key={inst.id}
                installment={inst}
                onEdit={startEditInstallment}
                onRemove={removeInstallment}
              />
            ),
          )}
        </div>
      </div>
    </div>
  )
}

export default function VariableInstallmentsSection({
  products,
  onAddProduct,
  onUpdateProduct,
  onRemoveProduct,
  onAddInstallment,
  onUpdateInstallment,
  onRemoveInstallment,
}) {
  const [editingProduct, setEditingProduct] = useState(null) // null | 'new' | id
  const [draft, setDraft] = useState(null)

  const startAdd = () => {
    setDraft(createEmptyVariableProduct())
    setEditingProduct('new')
  }
  const startEdit = (product) => {
    setDraft({ ...product })
    setEditingProduct(product.id)
  }
  const cancel = () => {
    setEditingProduct(null)
    setDraft(null)
  }
  const handleSubmit = (product) => {
    if (editingProduct === 'new') {
      onAddProduct(product)
    } else {
      onUpdateProduct(product.id, product)
    }
    cancel()
  }
  const handleRemove = (product) => {
    if (window.confirm(`Eliminare il prodotto "${product.name || 'senza nome'}" e le sue rateizzazioni?`)) {
      onRemoveProduct(product.id)
      if (editingProduct === product.id) cancel()
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10 text-brand-300">
            <Layers size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Rateizzazioni Variabili</h3>
            <p className="text-xs text-slate-500">
              {products.length === 0
                ? 'Nessun prodotto inserito'
                : `${products.length} prodott${products.length === 1 ? 'o' : 'i'}`}
            </p>
          </div>
        </div>

        {editingProduct !== 'new' && (
          <button
            onClick={startAdd}
            className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-500"
          >
            <Plus size={16} />
            Aggiungi prodotto
          </button>
        )}
      </div>

      <div className="space-y-4">
        {editingProduct === 'new' && (
          <ProductForm initial={draft} onSubmit={handleSubmit} onCancel={cancel} />
        )}

        {products.length === 0 && editingProduct !== 'new' && (
          <div className="rounded-xl border border-dashed border-slate-800 py-8 text-center text-sm text-slate-500">
            Aggiungi un prodotto di rateizzazione variabile (es. Cofidis).
          </div>
        )}

        {products.map((product) =>
          editingProduct === product.id ? (
            <ProductForm key={product.id} initial={draft} onSubmit={handleSubmit} onCancel={cancel} />
          ) : (
            <ProductCard
              key={product.id}
              product={product}
              onEditProduct={startEdit}
              onRemoveProduct={handleRemove}
              onAddInstallment={onAddInstallment}
              onUpdateInstallment={onUpdateInstallment}
              onRemoveInstallment={onRemoveInstallment}
            />
          ),
        )}
      </div>
    </Card>
  )
}
