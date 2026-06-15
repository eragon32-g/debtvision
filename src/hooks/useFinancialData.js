import {
  createContext,
  createElement,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useAuth } from '../contexts/AuthContext.jsx'
import {
  STORAGE_KEY,
  loadFinancialData,
  saveFinancialData,
  clearFinancialData,
  getDefaultFinancialData,
  getExampleFinancialData,
  normalizeFinancialData,
  hasMeaningfulFinancialData,
} from '../utils/financialStorage.js'
import {
  createFinancialProfile,
  fetchFinancialProfile,
  getImportStatus,
  setImportStatus,
  upsertFinancialProfile,
} from '../utils/cloudSync.js'

const CHANGE_EVENT = 'debtvision:financial-data-changed'
const CLOUD_SAVE_DEBOUNCE_MS = 1500

const FinancialDataContext = createContext(null)

export function FinancialDataProvider({ children }) {
  const { user } = useAuth()
  const [data, setData] = useState(() => loadFinancialData())
  const [profileId, setProfileId] = useState(null)
  const [cloudLoading, setCloudLoading] = useState(false)
  const [cloudSaving, setCloudSaving] = useState(false)
  const [cloudError, setCloudError] = useState(null)
  const [importPrompt, setImportPrompt] = useState(null)
  const [importing, setImporting] = useState(false)

  const profileIdRef = useRef(null)
  const saveTimerRef = useRef(null)
  const userIdRef = useRef(null)

  const notifyChange = useCallback(() => {
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT))
  }, [])

  const applyData = useCallback(
    (next) => {
      const normalized = normalizeFinancialData(next)
      setData(normalized)
      saveFinancialData(normalized)
      notifyChange()
      return normalized
    },
    [notifyChange],
  )

  const scheduleCloudSave = useCallback(
    (normalized) => {
      if (!user?.id) return

      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(async () => {
        try {
          setCloudSaving(true)
          setCloudError(null)
          const saved = await upsertFinancialProfile(
            user.id,
            profileIdRef.current,
            normalized,
          )
          profileIdRef.current = saved.id
          setProfileId(saved.id)
        } catch (err) {
          console.error('[cloud-sync]', err)
          setCloudError(err.message || 'Errore salvataggio cloud')
        } finally {
          setCloudSaving(false)
        }
      }, CLOUD_SAVE_DEBOUNCE_MS)
    },
    [user?.id],
  )

  const persist = useCallback(
    (next) => {
      const normalized = applyData(next)
      scheduleCloudSave(normalized)
      return normalized
    },
    [applyData, scheduleCloudSave],
  )

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

  useEffect(() => {
    return () => {
      clearTimeout(saveTimerRef.current)
    }
  }, [])

  useEffect(() => {
    if (!user?.id) {
      userIdRef.current = null
      profileIdRef.current = null
      setProfileId(null)
      setImportPrompt(null)
      setCloudError(null)
      return
    }

    if (userIdRef.current === user.id) return

    userIdRef.current = user.id
    let cancelled = false

    async function loadCloudProfile() {
      setCloudLoading(true)
      setCloudError(null)
      setImportPrompt(null)

      try {
        const profile = await fetchFinancialProfile(user.id)
        if (cancelled) return

        if (profile?.financial_data) {
          const normalized = normalizeFinancialData(profile.financial_data)
          profileIdRef.current = profile.id
          setProfileId(profile.id)
          applyData(normalized)
          return
        }

        const localData = loadFinancialData()
        const importStatus = getImportStatus(user.id)

        if (hasMeaningfulFinancialData(localData) && !importStatus) {
          setImportPrompt(localData)
          return
        }

        const seed = hasMeaningfulFinancialData(localData) ? localData : getDefaultFinancialData()
        const created = await createFinancialProfile(user.id, seed)
        if (cancelled) return

        profileIdRef.current = created.id
        setProfileId(created.id)
        applyData(created.financial_data ?? seed)
      } catch (err) {
        if (!cancelled) {
          console.error('[cloud-sync]', err)
          setCloudError(err.message || 'Errore caricamento dati cloud')
        }
      } finally {
        if (!cancelled) setCloudLoading(false)
      }
    }

    loadCloudProfile()

    return () => {
      cancelled = true
    }
  }, [user?.id, applyData])

  const setField = useCallback(
    (section, key, value) => {
      setData((prev) => {
        const next = normalizeFinancialData({
          ...prev,
          [section]: { ...prev[section], [key]: value },
        })
        saveFinancialData(next)
        notifyChange()
        scheduleCloudSave(next)
        return next
      })
    },
    [notifyChange, scheduleCloudSave],
  )

  const mutateList = useCallback(
    (key, updater) => {
      setData((prev) => {
        const next = normalizeFinancialData({
          ...prev,
          [key]: updater(prev[key] ?? []),
        })
        saveFinancialData(next)
        notifyChange()
        scheduleCloudSave(next)
        return next
      })
    },
    [notifyChange, scheduleCloudSave],
  )

  const addLoan = useCallback(
    (loan) => {
      setData((prev) => {
        const next = normalizeFinancialData({
          ...prev,
          loans: [...(prev.loans ?? []), loan],
        })
        saveFinancialData(next)
        notifyChange()
        scheduleCloudSave(next)
        return next
      })
    },
    [notifyChange, scheduleCloudSave],
  )

  const updateLoan = useCallback(
    (id, updatedLoan) => {
      setData((prev) => {
        const next = normalizeFinancialData({
          ...prev,
          loans: (prev.loans ?? []).map((loan) =>
            loan.id === id ? { ...loan, ...updatedLoan, id } : loan,
          ),
        })
        saveFinancialData(next)
        notifyChange()
        scheduleCloudSave(next)
        return next
      })
    },
    [notifyChange, scheduleCloudSave],
  )

  const removeLoan = useCallback(
    (id) => {
      setData((prev) => {
        const next = normalizeFinancialData({
          ...prev,
          loans: (prev.loans ?? []).filter((loan) => loan.id !== id),
        })
        saveFinancialData(next)
        notifyChange()
        scheduleCloudSave(next)
        return next
      })
    },
    [notifyChange, scheduleCloudSave],
  )

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
                installments: (p.installments ?? []).filter((inst) => inst.id !== installmentId),
              }
            : p,
        ),
      ),
    [mutateList],
  )

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

  const save = useCallback(() => {
    setData((prev) => {
      const normalized = normalizeFinancialData(prev)
      saveFinancialData(normalized)
      notifyChange()
      scheduleCloudSave(normalized)
      return normalized
    })
  }, [notifyChange, scheduleCloudSave])

  const reset = useCallback(() => {
    clearFinancialData()
    persist(getDefaultFinancialData())
  }, [persist])

  const loadExample = useCallback(() => {
    persist(getExampleFinancialData())
  }, [persist])

  const importLocalToCloud = useCallback(async () => {
    if (!user?.id || !importPrompt) return

    setImporting(true)
    setCloudError(null)
    try {
      const normalized = normalizeFinancialData(loadFinancialData())
      const saved = await createFinancialProfile(user.id, normalized)
      profileIdRef.current = saved.id
      setProfileId(saved.id)
      applyData(saved.financial_data ?? normalized)
      setImportStatus(user.id, 'imported')
      setImportPrompt(null)
    } catch (err) {
      console.error('[cloud-sync]', err)
      setCloudError(err.message || 'Errore importazione dati locali')
    } finally {
      setImporting(false)
    }
  }, [user?.id, importPrompt, applyData])

  const dismissLocalImport = useCallback(async () => {
    if (!user?.id) return

    setImporting(true)
    setCloudError(null)
    try {
      const seed = getDefaultFinancialData()
      const saved = await createFinancialProfile(user.id, seed)
      profileIdRef.current = saved.id
      setProfileId(saved.id)
      applyData(saved.financial_data ?? seed)
      setImportStatus(user.id, 'skipped')
      setImportPrompt(null)
    } catch (err) {
      console.error('[cloud-sync]', err)
      setCloudError(err.message || 'Errore creazione profilo cloud')
    } finally {
      setImporting(false)
    }
  }, [user?.id, applyData])

  const value = useMemo(
    () => ({
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
      cloudLoading,
      cloudSaving,
      cloudError,
      importPrompt,
      importing,
      importLocalToCloud,
      dismissLocalImport,
    }),
    [
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
      cloudLoading,
      cloudSaving,
      cloudError,
      importPrompt,
      importing,
      importLocalToCloud,
      dismissLocalImport,
    ],
  )

  return createElement(FinancialDataContext.Provider, { value }, children)
}

export function useFinancialData() {
  const context = useContext(FinancialDataContext)
  if (!context) {
    throw new Error('useFinancialData deve essere usato dentro FinancialDataProvider')
  }
  return context
}
