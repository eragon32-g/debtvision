import { useState } from 'react'
import { Plus, Pencil, Trash2, X, Check } from 'lucide-react'
import Card from './Card.jsx'
import CurrencyInput from './CurrencyInput.jsx'

// Sezione generica e riutilizzabile per gestire una lista di entità di credito
// (carte di credito, fidi) tramite uno schema di campi.
//
// Props:
// - icon, title: intestazione della sezione
// - items: array di entità
// - fields: schema dei campi del form
//   { key, label, type: 'text'|'currency'|'number'|'percent'|'textarea', optional, min, max, placeholder }
// - createEmpty: () => nuova entità vuota
// - requiredKey: chiave obbligatoria (default 'name')
// - titleKey / subtitleKey: campi mostrati nell'intestazione di ogni riga
// - summary: (item) => [{ label, value }] mostrati nella riga
// - emptyText: testo quando la lista è vuota
// - idPrefix: prefisso per gli id degli input
// - onAdd, onUpdate, onRemove

const inputClass =
  'w-full rounded-lg border border-slate-800 bg-slate-900/80 py-2.5 px-3 text-sm text-slate-100 placeholder:text-slate-600 focus:border-brand-500/60 focus:outline-none focus:ring-1 focus:ring-brand-500/40'

function Field({ field, value, onChange, idPrefix }) {
  const id = `${idPrefix}-${field.key}`
  const label = (
    <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-slate-300">
      {field.label}
      {field.optional && <span className="ml-1 text-xs text-slate-600">(opzionale)</span>}
    </label>
  )

  if (field.type === 'currency') {
    return (
      <CurrencyInput id={id} label={field.label} value={value} onChange={onChange} />
    )
  }

  if (field.type === 'select') {
    return (
      <div>
        {label}
        <select
          id={id}
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          className={[inputClass, 'appearance-none'].join(' ')}
        >
          {(field.options ?? []).map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-slate-900 text-slate-100">
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    )
  }

  if (field.type === 'textarea') {
    return (
      <div className="sm:col-span-2">
        {label}
        <textarea
          id={id}
          rows={2}
          value={value ?? ''}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      </div>
    )
  }

  if (field.type === 'number' || field.type === 'percent') {
    return (
      <div>
        {label}
        <div className="relative">
          <input
            id={id}
            type="number"
            inputMode={field.type === 'percent' ? 'decimal' : 'numeric'}
            min={field.min ?? 0}
            max={field.max}
            step={field.type === 'percent' ? '0.01' : '1'}
            value={value === 0 || value === undefined || value === null ? '' : value}
            placeholder={field.placeholder ?? (field.type === 'percent' ? '0,00' : '0')}
            onChange={(e) => {
              const raw = e.target.value
              if (raw === '') return onChange(0)
              const parsed = parseFloat(raw)
              onChange(Number.isFinite(parsed) ? parsed : 0)
            }}
            className={[inputClass, field.type === 'percent' ? 'pr-8' : ''].join(' ')}
          />
          {field.type === 'percent' && (
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-500">
              %
            </span>
          )}
        </div>
      </div>
    )
  }

  return (
    <div>
      {label}
      <input
        id={id}
        type="text"
        value={value ?? ''}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
        className={inputClass}
      />
    </div>
  )
}

function EntityForm({ fields, initialItem, requiredKey, requiredMessage, idPrefix, onSubmit, onCancel }) {
  const [item, setItem] = useState(initialItem)

  const update = (key, value) => setItem((prev) => ({ ...prev, [key]: value }))

  const handleSubmit = (e) => {
    e.preventDefault()
    if (requiredKey && !String(item[requiredKey] ?? '').trim()) {
      window.alert(requiredMessage)
      return
    }
    onSubmit(item)
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-brand-500/30 bg-slate-900/70 p-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((field) => (
          <Field
            key={field.key}
            field={field}
            value={item[field.key]}
            onChange={(value) => update(field.key, value)}
            idPrefix={idPrefix}
          />
        ))}
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
          Salva
        </button>
      </div>
    </form>
  )
}

function EntityRow({ item, titleKey, subtitleKey, summary, onEdit, onRemove }) {
  const chips = summary ? summary(item) : []
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-slate-800/80 bg-slate-900/50 p-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold text-slate-100">{item[titleKey]}</p>
          {subtitleKey && item[subtitleKey] && (
            <span className="truncate text-xs text-slate-500">· {item[subtitleKey]}</span>
          )}
        </div>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-400">
          {chips.map((chip) => (
            <span key={chip.label}>
              {chip.label}:{' '}
              <span className="font-medium text-slate-200">{chip.value}</span>
            </span>
          ))}
        </div>
        {item.notes && <p className="mt-1.5 text-xs text-slate-500">{item.notes}</p>}
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <button
          onClick={() => onEdit(item)}
          className="rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-slate-100"
          aria-label="Modifica"
        >
          <Pencil size={16} />
        </button>
        <button
          onClick={() => onRemove(item)}
          className="rounded-md p-2 text-slate-400 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
          aria-label="Elimina"
        >
          <Trash2 size={16} />
        </button>
      </div>
    </div>
  )
}

export default function CreditEntitySection({
  icon: Icon,
  title,
  items,
  fields,
  createEmpty,
  requiredKey = 'name',
  requiredMessage = 'Inserisci il nome.',
  titleKey = 'name',
  subtitleKey,
  summary,
  emptyText,
  itemNoun = 'elemento',
  itemNounPlural = 'elementi',
  idPrefix = 'entity',
  onAdd,
  onUpdate,
  onRemove,
}) {
  const [editing, setEditing] = useState(null) // null | 'new' | id
  const [draft, setDraft] = useState(null)

  const startAdd = () => {
    setDraft(createEmpty())
    setEditing('new')
  }

  const startEdit = (item) => {
    setDraft({ ...item })
    setEditing(item.id)
  }

  const cancel = () => {
    setEditing(null)
    setDraft(null)
  }

  const handleSubmit = (item) => {
    if (editing === 'new') {
      onAdd(item)
    } else {
      onUpdate(item.id, item)
    }
    cancel()
  }

  const handleRemove = (item) => {
    if (window.confirm(`Eliminare "${item[titleKey] || 'senza nome'}"?`)) {
      onRemove(item.id)
      if (editing === item.id) cancel()
    }
  }

  return (
    <Card className="p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500/10 text-brand-300">
            <Icon size={18} />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-100">{title}</h3>
            <p className="text-xs text-slate-500">
              {items.length === 0
                ? `Nessun ${itemNoun} inserito`
                : `${items.length} ${items.length === 1 ? itemNoun : itemNounPlural}`}
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
          <EntityForm
            fields={fields}
            initialItem={draft}
            requiredKey={requiredKey}
            requiredMessage={requiredMessage}
            idPrefix={`${idPrefix}-new`}
            onSubmit={handleSubmit}
            onCancel={cancel}
          />
        )}

        {items.length === 0 && editing !== 'new' && (
          <div className="rounded-xl border border-dashed border-slate-800 py-8 text-center text-sm text-slate-500">
            {emptyText}
          </div>
        )}

        {items.map((item) =>
          editing === item.id ? (
            <EntityForm
              key={item.id}
              fields={fields}
              initialItem={draft}
              requiredKey={requiredKey}
              requiredMessage={requiredMessage}
              idPrefix={`${idPrefix}-${item.id}`}
              onSubmit={handleSubmit}
              onCancel={cancel}
            />
          ) : (
            <EntityRow
              key={item.id}
              item={item}
              titleKey={titleKey}
              subtitleKey={subtitleKey}
              summary={summary}
              onEdit={startEdit}
              onRemove={handleRemove}
            />
          ),
        )}
      </div>
    </Card>
  )
}
