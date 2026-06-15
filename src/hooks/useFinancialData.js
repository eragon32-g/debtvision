import { useCallback, useEffect, useState } from 'react'
import {
  STORAGE_KEY,
  loadFinancialData,
  saveFinancialData,
  clearFinancialData,
  getDefaultFinancialData,
  getExampleFinancialData,
  normalizeFinancialData,
} from '../utils/financialStorage.js'

// Evento custom per sincronizzare le istanze del hook nella stessa scheda
const CHANGE_EVENT = 'debtvision:financial-data-changed'

// Hook condiviso per leggere/scrivere i dati finanziari su localStorage.
// I dati vengono caricati al mount e salvati automaticamente ad ogni modifica.
export function useFinancialData() {
  const [data, setData] = useState(() => loadFinancialData())

  // Sincronizza lo stato quando i dati cambiano altrove (altra pagina o altra scheda)
  useEffect(() => {
    const handleChange = () => setData(loadFinancialData())
    const handleStorage = (event) => {
      if (!event.key || event.key === STORAGE_KEY) {
        setData(loadFinancialData())
      }
    }

    window.addEventListener(CHANGE_EVENT, handleChange)
    window.addEventListener('storage', handleStorage)
    return () => {
      window.removeEventListener(CHANGE_EVENT, handleChange)
      window.removeEventListener('storage', handleStorage)
    }
  }, [])

  // Salvataggio automatico + notifica alle altre istanze (sempre modello unificato)
  const persist = useCallback((next) => {
    const normalized = normalizeFinancialData(next)
    setData(normalized)
    saveFinancialData(normalized)
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
  }, [])

  const setField = useCallback((section, key, value) => {
    setData((prev) => {
      const next = normalizeFinancialData({
        ...prev,
        [section]: { ...prev[section], [key]: value },
      })
      saveFinancialData(next)
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
      return next
    })
  }, [])

  // --- Finanziamenti (Fase 3) ---

  const addLoan = useCallback((loan) => {
    setData((prev) => {
      const next = normalizeFinancialData({
        ...prev,
        loans: [...(prev.loans ?? []), loan],
      })
      saveFinancialData(next)
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
      return next
    })
  }, [])

  const updateLoan = useCallback((id, updatedLoan) => {
    setData((prev) => {
      const next = normalizeFinancialData({
        ...prev,
        loans: (prev.loans ?? []).map((loan) =>
          loan.id === id ? { ...loan, ...updatedLoan, id } : loan,
        ),
      })
      saveFinancialData(next)
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
      return next
    })
  }, [])

  const removeLoan = useCallback((id) => {
    setData((prev) => {
      const next = normalizeFinancialData({
        ...prev,
        loans: (prev.loans ?? []).filter((loan) => loan.id !== id),
      })
      saveFinancialData(next)
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
      return next
    })
  }, [])

  // --- Helper generico per liste (Fase 4) ---
  const mutateList = useCallback((key, updater) => {
    setData((prev) => {
      const next = normalizeFinancialData({
        ...prev,
        [key]: updater(prev[key] ?? []),
      })
      saveFinancialData(next)
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
      return next
    })
  }, [])

  // --- Carte di Credito (Fase 4) ---
  const addCard = useCallback(
    (card) => mutateList('cards', (list) => [...list, card]),
    [mutateList],
  )
  const updateCard = useCallback(
    (id, updated) =>
      mutateList('cards', (list) =>
        list.map((card) => (card.id === id ? { ...card, ...updated, id } : card)),
      ),
    [mutateList],
  )
  const removeCard = useCallback(
    (id) => mutateList('cards', (list) => list.filter((card) => card.id !== id)),
    [mutateList],
  )

  // --- Rateizzazioni Variabili (Fase 5) ---
  const VIP = 'variableInstallmentProducts'

  const addVariableProduct = useCallback(
    (product) => mutateList(VIP, (list) => [...list, product]),
    [mutateList],
  )
  const updateVariableProduct = useCallback(
    (id, updated) =>
      mutateList(VIP, (list) =>
        list.map((p) => (p.id === id ? { ...p, ...updated, id } : p)),
      ),
    [mutateList],
  )
  const removeVariableProduct = useCallback(
    (id) => mutateList(VIP, (list) => list.filter((p) => p.id !== id)),
    [mutateList],
  )

  // Rateizzazioni interne (annidate dentro un prodotto)
  const addInstallment = useCallback(
    (productId, installment) =>
      mutateList(VIP, (list) =>
        list.map((p) =>
          p.id === productId
            ? { ...p, installments: [...(p.installments ?? []), installment] }
            : p,
        ),
      ),
    [mutateList],
  )
  const updateInstallment = useCallback(
    (productId, installmentId, updated) =>
      mutateList(VIP, (list) =>
        list.map((p) =>
          p.id === productId
            ? {
                ...p,
                installments: (p.installments ?? []).map((inst) =>
                  inst.id === installmentId ? { ...inst, ...updated, id: installmentId } : inst,
                ),
              }
            : p,
        ),
      ),
    [mutateList],
  )
  const removeInstallment = useCallback(
    (productId, installmentId) =>
      mutateList(VIP, (list) =>
        list.map((p) =>
          p.id === productId
            ? {
                ...p,
                installments: (p.installments ?? []).filter(
                  (inst) => inst.id !== installmentId,
                ),
              }
            : p,
        ),
      ),
    [mutateList],
  )

  // --- Patrimonio / Asset (Fase 7) ---
  const addAsset = useCallback(
    (asset) => mutateList('assets', (list) => [...list, asset]),
    [mutateList],
  )
  const updateAsset = useCallback(
    (id, updated) =>
      mutateList('assets', (list) =>
        list.map((a) => (a.id === id ? { ...a, ...updated, id } : a)),
      ),
    [mutateList],
  )
  const removeAsset = useCallback(
    (id) => mutateList('assets', (list) => list.filter((a) => a.id !== id)),
    [mutateList],
  )

  // --- Entrate e spese fisse a voci (Fase 9) ---
  const addIncomeEntry = useCallback(
    (entry) => mutateList('incomeEntries', (list) => [...list, entry]),
    [mutateList],
  )
  const updateIncomeEntry = useCallback(
    (id, updated) =>
      mutateList('incomeEntries', (list) =>
        list.map((e) => (e.id === id ? { ...e, ...updated, id } : e)),
      ),
    [mutateList],
  )
  const removeIncomeEntry = useCallback(
    (id) => mutateList('incomeEntries', (list) => list.filter((e) => e.id !== id)),
    [mutateList],
  )

  const addFixedExpenseEntry = useCallback(
    (entry) => mutateList('fixedExpenseEntries', (list) => [...list, entry]),
    [mutateList],
  )
  const updateFixedExpenseEntry = useCallback(
    (id, updated) =>
      mutateList('fixedExpenseEntries', (list) =>
        list.map((e) => (e.id === id ? { ...e, ...updated, id } : e)),
      ),
    [mutateList],
  )
  const removeFixedExpenseEntry = useCallback(
    (id) => mutateList('fixedExpenseEntries', (list) => list.filter((e) => e.id !== id)),
    [mutateList],
  )

  // Salvataggio esplicito (pulsante "Salva dati")
  const save = useCallback(() => {
    setData((prev) => {
      const normalized = normalizeFinancialData(prev)
      saveFinancialData(normalized)
      window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
      return normalized
    })
  }, [])

  // Reset: svuota il form e cancella il localStorage
  const reset = useCallback(() => {
    clearFinancialData()
    persist(getDefaultFinancialData())
  }, [persist])

  // Carica valori realistici di esempio
  const loadExample = useCallback(() => {
    persist(getExampleFinancialData())
  }, [persist])

  return {
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
  }
}
