import { useState } from 'react'
import { Save, RotateCcw, Sparkles, Wallet, Receipt, Check, CreditCard } from 'lucide-react'
import PageHeader from '../components/PageHeader.jsx'
import Card from '../components/Card.jsx'
import CurrencyInput from '../components/CurrencyInput.jsx'
import LoansSection from '../components/LoansSection.jsx'
import CreditEntitySection from '../components/CreditEntitySection.jsx'
import VariableInstallmentsSection from '../components/VariableInstallmentsSection.jsx'
import LiquiditySection from '../components/LiquiditySection.jsx'
import AssetsSection from '../components/AssetsSection.jsx'
import { useFinancialData } from '../hooks/useFinancialData.js'
import { createEmptyCard, createEmptyIncomeEntry, createEmptyFixedExpenseEntry } from '../utils/financialStorage.js'
import { getKnownIssuers } from '../utils/cardInterestRates.js'
import {
  getTotalIncome,
  getTotalFixedExpenses,
  getMonthlyMargin,
  formatCurrency,
} from '../utils/financeCalculations.js'

const cardTypeOptions = [
  { value: 'standard', label: 'Standard / Classic' },
  { value: 'agospay', label: 'AgosPay' },
  { value: 'agospay-zero', label: 'AgosPay Zero' },
  { value: 'verde', label: 'Verde / Green' },
  { value: 'oro', label: 'Oro / Gold' },
  { value: 'platino', label: 'Platino / Platinum' },
  { value: 'blu', label: 'Blu / Blue' },
  { value: 'explora', label: 'Explora' },
  { value: 'ita-airways', label: 'ITA Airways' },
  { value: 'ita-airways-oro', label: 'ITA Airways Oro' },
  { value: 'payback', label: 'Payback' },
  { value: 'revolving', label: 'Revolving' },
  { value: 'mediaworld', label: 'MediaWorld' },
  { value: 'creditline', label: 'CreditLine' },
  { value: 'pagocredit', label: 'PagoCREDIT' },
  { value: 'charge', label: 'Charge' },
  { value: 'mastercard', label: 'Mastercard' },
  { value: 'visa', label: 'Visa' },
  { value: 'altro', label: 'Altro' },
]

const knownCardIssuers = getKnownIssuers()

// Schema dei campi per le carte di credito (Fase 4.1)
const cardFields = [
  { key: 'name', label: 'Nome carta', type: 'text', placeholder: 'Es. Carta Gold' },
  {
    key: 'issuer',
    label: 'Emittente / Banca',
    type: 'text',
    datalist: true,
    datalistOptions: knownCardIssuers,
    placeholder: 'Es. American Express',
  },
  { key: 'cardType', label: 'Tipo carta', type: 'select', options: cardTypeOptions },
  { key: 'totalLimit', label: 'Plafond totale', type: 'currency' },
  { key: 'usedLimit', label: 'Plafond utilizzato', type: 'currency' },
  { key: 'monthlyPayment', label: 'Rata mensile', type: 'currency' },
  { key: 'billingDay', label: 'Giorno addebito', type: 'number', min: 1, max: 31, placeholder: '1-31' },
  { key: 'interestRate', label: 'Tasso interesse', type: 'percent', optional: true },
  { key: 'notes', label: 'Note', type: 'textarea', placeholder: 'Note opzionali' },
]

const cardTypeLabels = Object.fromEntries(cardTypeOptions.map((o) => [o.value, o.label]))

const incomeEntryFields = [
  { key: 'description', label: 'Descrizione', type: 'text', placeholder: 'Es. Stipendio' },
  { key: 'amount', label: 'Importo', type: 'currency' },
  { key: 'day', label: 'Giorno del mese', type: 'number', min: 1, max: 31, placeholder: '1-31' },
]

const fixedExpenseEntryFields = [
  { key: 'description', label: 'Descrizione', type: 'text', placeholder: 'Es. Affitto' },
  { key: 'amount', label: 'Importo', type: 'currency' },
  { key: 'day', label: 'Giorno del mese', type: 'number', min: 1, max: 31, placeholder: '1-31' },
]

export default function FinancialData() {
  const {
    data,
    setField,
    addLoan,
    updateLoan,
    removeLoan,
    addCard,
    updateCard,
    removeCard,
    addVariableProduct,
    updateVariableProduct,
    removeVariableProduct,
    addInstallment,
    updateInstallment,
    removeInstallment,
    addAsset,
    updateAsset,
    removeAsset,
    addIncomeEntry,
    updateIncomeEntry,
    removeIncomeEntry,
    addFixedExpenseEntry,
    updateFixedExpenseEntry,
    removeFixedExpenseEntry,
    save,
    reset,
    loadExample,
  } = useFinancialData()
  const [saved, setSaved] = useState(false)

  const totalIncome = getTotalIncome(data)
  const totalExpenses = getTotalFixedExpenses(data)
  const margin = getMonthlyMargin(data)

  const handleSave = () => {
    save()
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleReset = () => {
    if (window.confirm('Vuoi davvero azzerare tutti i dati? L\'operazione cancella anche il salvataggio locale.')) {
      reset()
    }
  }

  return (
    <div>
      <PageHeader
        title="Financial Data"
        subtitle="Inserisci entrate e spese fisse mensili. I dati vengono salvati automaticamente sul dispositivo."
        actions={
          <>
            <button
              onClick={loadExample}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-slate-800 hover:text-slate-100"
            >
              <Sparkles size={16} />
              Carica esempio
            </button>
            <button
              onClick={handleReset}
              className="inline-flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm font-medium text-slate-300 transition-colors hover:bg-rose-500/10 hover:text-rose-300"
            >
              <RotateCcw size={16} />
              Reset dati
            </button>
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 rounded-lg bg-brand-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-brand-500"
            >
              {saved ? <Check size={16} /> : <Save size={16} />}
              {saved ? 'Salvato' : 'Salva dati'}
            </button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Sezione Entrate */}
        <CreditEntitySection
          icon={Wallet}
          title="Entrate"
          titleKey="description"
          items={data.incomeEntries ?? []}
          fields={incomeEntryFields}
          createEmpty={createEmptyIncomeEntry}
          requiredKey="description"
          requiredMessage="Inserisci la descrizione dell'entrata."
          itemNoun="entrata"
          itemNounPlural="entrate"
          idPrefix="income-entry"
          emptyText="Aggiungi la tua prima entrata mensile."
          summary={(entry) => [
            { label: 'Importo', value: formatCurrency(entry.amount) },
            { label: 'Giorno', value: entry.day ? `Giorno ${entry.day}` : '—' },
          ]}
          onAdd={addIncomeEntry}
          onUpdate={updateIncomeEntry}
          onRemove={removeIncomeEntry}
        />

        {/* Sezione Spese Fisse */}
        <CreditEntitySection
          icon={Receipt}
          title="Spese fisse"
          titleKey="description"
          items={data.fixedExpenseEntries ?? []}
          fields={fixedExpenseEntryFields}
          createEmpty={createEmptyFixedExpenseEntry}
          requiredKey="description"
          requiredMessage="Inserisci la descrizione della spesa."
          itemNoun="spesa"
          itemNounPlural="spese"
          idPrefix="expense-entry"
          emptyText="Aggiungi la tua prima spesa fissa mensile."
          summary={(entry) => [
            { label: 'Importo', value: formatCurrency(entry.amount) },
            { label: 'Giorno', value: entry.day ? `Giorno ${entry.day}` : '—' },
          ]}
          onAdd={addFixedExpenseEntry}
          onUpdate={updateFixedExpenseEntry}
          onRemove={removeFixedExpenseEntry}
        />
      </div>

      {/* Sezione Finanziamenti */}
      <div className="mt-6">
        <LoansSection
          loans={data.loans ?? []}
          onAdd={addLoan}
          onUpdate={updateLoan}
          onRemove={removeLoan}
        />
      </div>

      {/* Sezione Carte di Credito */}
      <div className="mt-6">
        <CreditEntitySection
          icon={CreditCard}
          title="Carte di Credito"
          items={data.cards ?? []}
          fields={cardFields}
          createEmpty={createEmptyCard}
          requiredMessage="Inserisci il nome della carta."
          subtitleKey="issuer"
          itemNoun="carta"
          itemNounPlural="carte"
          idPrefix="card"
          cardInterestSuggestion
          emptyText="Aggiungi la tua prima carta di credito."
          summary={(card) => [
            { label: 'Tipo', value: cardTypeLabels[card.cardType] ?? '—' },
            { label: 'Plafond', value: formatCurrency(card.totalLimit) },
            { label: 'Utilizzato', value: formatCurrency(card.usedLimit) },
            {
              label: 'Disponibile',
              value: formatCurrency((card.totalLimit ?? 0) - (card.usedLimit ?? 0)),
            },
            { label: 'Rata', value: formatCurrency(card.monthlyPayment) },
          ]}
          onAdd={addCard}
          onUpdate={updateCard}
          onRemove={removeCard}
        />
      </div>

      {/* Sezione Rateizzazioni Variabili */}
      <div className="mt-6">
        <VariableInstallmentsSection
          products={data.variableInstallmentProducts ?? []}
          onAddProduct={addVariableProduct}
          onUpdateProduct={updateVariableProduct}
          onRemoveProduct={removeVariableProduct}
          onAddInstallment={addInstallment}
          onUpdateInstallment={updateInstallment}
          onRemoveInstallment={removeInstallment}
        />
      </div>

      {/* Sezione Liquidità (Fase 7) */}
      <div className="mt-6">
        <LiquiditySection
          liquidity={data.liquidity ?? {}}
          onChange={(key, value) => setField('liquidity', key, value)}
        />
      </div>

      {/* Sezione Patrimonio (Fase 7) */}
      <div className="mt-6">
        <AssetsSection
          assets={data.assets ?? []}
          onAdd={addAsset}
          onUpdate={updateAsset}
          onRemove={removeAsset}
        />
      </div>

      {/* Riepilogo rapido in tempo reale */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-400">Entrate totali</p>
          <p className="mt-1 text-lg font-semibold text-slate-100">{formatCurrency(totalIncome)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-400">Spese totali</p>
          <p className="mt-1 text-lg font-semibold text-slate-100">{formatCurrency(totalExpenses)}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs font-medium text-slate-400">Margine mensile</p>
          <p
            className={[
              'mt-1 text-lg font-semibold',
              margin < 0 ? 'text-rose-400' : 'text-emerald-400',
            ].join(' ')}
          >
            {formatCurrency(margin)}
          </p>
        </Card>
      </div>
    </div>
  )
}
