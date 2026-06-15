import CreditEntitySection from './CreditEntitySection.jsx'
import { createEmptyAsset } from '../utils/financialStorage.js'
import { formatCurrency } from '../utils/financeCalculations.js'
import { Landmark } from 'lucide-react'

const assetCategoryOptions = [
  { value: 'auto', label: 'Auto' },
  { value: 'investimenti', label: 'Investimenti' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'altri', label: 'Altri beni' },
]

const categoryLabels = Object.fromEntries(
  assetCategoryOptions.map((o) => [o.value, o.label]),
)

const assetFields = [
  {
    key: 'category',
    label: 'Categoria',
    type: 'select',
    options: assetCategoryOptions,
  },
  { key: 'description', label: 'Descrizione', type: 'text', placeholder: 'Es. Auto familiare' },
  { key: 'value', label: 'Valore stimato', type: 'currency' },
]

export default function AssetsSection({ assets, onAdd, onUpdate, onRemove }) {
  return (
    <CreditEntitySection
      icon={Landmark}
      title="Patrimonio"
      items={assets}
      fields={assetFields}
      createEmpty={createEmptyAsset}
      requiredKey="description"
      requiredMessage="Inserisci la descrizione del bene."
      titleKey="description"
      itemNoun="bene"
      itemNounPlural="beni"
      idPrefix="asset"
      emptyText="Aggiungi il tuo primo bene patrimoniale."
      summary={(asset) => [
        { label: 'Categoria', value: categoryLabels[asset.category] ?? '—' },
        { label: 'Valore', value: formatCurrency(asset.value) },
      ]}
      onAdd={onAdd}
      onUpdate={onUpdate}
      onRemove={onRemove}
    />
  )
}
