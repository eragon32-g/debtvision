# DebtVision

App web per la gestione di **debiti, finanziamenti, carte di credito, fidi e rateizzazioni variabili** (tipo Cofidis).

## Stack

- **React 18**
- **Vite**
- **TailwindCSS**
- **React Router** (navigazione)
- **lucide-react** (icone)

## Fase 1 (attuale)

Questa fase include solo lo scheletro dell'interfaccia:

- Struttura del progetto
- Layout principale (Sidebar sinistra + Topbar)
- Dashboard vuota con card placeholder
- Pagine: **Dashboard**, **Financial Data**, **Forecast**, **Report**

Design: tema scuro professionale, stile applicazione finanziaria moderna, con accento sobrio blu/teal.

> Non sono inclusi: form finanziari, API, login/autenticazione, database.

## Requisiti

- [Node.js](https://nodejs.org/) 18+ (consigliato 20+)

## Avvio

```bash
# 1. Installa le dipendenze
npm install

# 2. Avvia il server di sviluppo
npm run dev
```

L'app sarà disponibile su [http://localhost:5173](http://localhost:5173).

## Altri comandi

```bash
npm run build     # build di produzione (cartella dist/)
npm run preview   # anteprima della build di produzione
```

## Struttura

```text
src/
├── main.jsx              # entry point
├── App.jsx               # definizione delle route
├── index.css            # Tailwind + tema scuro
├── config/
│   └── navigation.js     # voci di navigazione condivise
├── layout/
│   ├── MainLayout.jsx    # Sidebar + Topbar + contenuto
│   ├── Sidebar.jsx       # sidebar sinistra
│   └── Topbar.jsx        # barra superiore
├── components/
│   ├── NavItem.jsx       # voce di navigazione
│   ├── PageHeader.jsx    # intestazione pagina
│   ├── Card.jsx          # contenitore generico
│   ├── StatCard.jsx      # card statistica placeholder
│   └── EmptyState.jsx    # stato vuoto
└── pages/
    ├── Dashboard.jsx
    ├── FinancialData.jsx
    ├── Forecast.jsx
    └── Report.jsx
```
