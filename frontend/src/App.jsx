import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import WebApp from '@twa-dev/sdk'
import { Home, Briefcase, Calculator, Gauge, Zap } from 'lucide-react'
import HeroSection from './components/HeroSection'
import PortfolioSection from './components/PortfolioSection'
import CalculatorSection from './components/CalculatorSection'
import PlaygroundSection from './components/PlaygroundSection'
import AnalyzerSection from './components/AnalyzerSection'
import LogPanel, { addLog } from './components/LogPanel'
import GradientBg from './components/GradientBg'
import { API } from './api'

const NAV = [
  { id: 'hero',       Icon: Home,       label: 'Главная' },
  { id: 'portfolio',  Icon: Briefcase,  label: 'Кейсы'   },
  { id: 'calculator', Icon: Calculator, label: 'Цена'    },
  { id: 'playground', Icon: Zap,        label: 'Демо'    },
  { id: 'analyzer',   Icon: Gauge,      label: 'Анализ'  },
]

const pageVariants = {
  hidden:  { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0,  transition: { duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] } },
  exit:    { opacity: 0, y: -12, transition: { duration: 0.22 } },
}

function App() {
  const [activeSection, setActiveSection]   = useState('hero')
  const [isConnected,   setIsConnected]     = useState(false)
  const [isTelegramReady, setTelegramReady] = useState(false)

  // Warm up the backend on first load.
  // Render free tier sleeps after 15 min of inactivity; the first cold request
  // can take 30-60s which surfaces as an empty response in the UI. Pinging
  // /health on mount means the server is usually warm by the time the user
  // navigates to the Analyzer or Calculator.
  useEffect(() => {
    if (!API) return
    const ctrl = new AbortController()
    const t = setTimeout(() => ctrl.abort(), 60_000)
    fetch(`${API}/health`, { signal: ctrl.signal })
      .then(() => addLog('ok', 'Backend warmed up'))
      .catch(() => addLog('info', 'Backend warm-up ping skipped'))
      .finally(() => clearTimeout(t))
    return () => { clearTimeout(t); ctrl.abort() }
  }, [])

  useEffect(() => {
    let handler = null
    try {
      const webApp = WebApp || window.Telegram?.WebApp
      if (webApp) {
        // The Telegram WebApp object is injected by the client — no explicit init() call is required.
        if (typeof webApp.BackButton?.show === 'function') webApp.BackButton.show()
        handler = () => { if (activeSection !== 'hero') setActiveSection('hero') }
        if (typeof webApp.BackButton?.onClick === 'function') webApp.BackButton.onClick(handler)
        addLog('ok', 'Telegram WebApp SDK инициализирован')
      } else {
        addLog('info', 'Браузерный режим')
      }
    } catch (e) {
      addLog('error', 'Ошибка Telegram SDK', String(e))
    } finally {
      setTelegramReady(true)
    }

    return () => {
      const webApp = WebApp || window.Telegram?.WebApp
      if (handler && typeof webApp?.BackButton?.offClick === 'function') webApp.BackButton.offClick(handler)
    }
  }, [activeSection])

  const navigate = (id) => {
    addLog('info', 'Navigate: ' + id)
    setActiveSection(id)
  }

  if (!isTelegramReady) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-8 h-8 border-2 border-white/10 border-t-blue-500 rounded-full animate-spin" />
          <span className="font-mono-jb text-[11px] text-slate-600 tracking-widest uppercase">Initializing</span>
        </div>
      </div>
    )
  }

  const renderSection = () => {
    switch (activeSection) {
      case 'hero':        return <HeroSection onNavigate={navigate} isConnected={isConnected} />
      case 'portfolio':   return <PortfolioSection onNavigate={navigate} />
      case 'calculator':  return <CalculatorSection onNavigate={navigate} setIsConnected={setIsConnected} />
      case 'playground':  return <PlaygroundSection onNavigate={navigate} setIsConnected={setIsConnected} />
      case 'analyzer':    return <AnalyzerSection setIsConnected={setIsConnected} />
      default:            return <HeroSection onNavigate={navigate} />
    }
  }

  return (
    <div className="min-h-screen dot-bg" style={{ background: 'var(--bg)' }}>
      <GradientBg />
      <div className="relative z-10 tma-container">
        <AnimatePresence mode="wait">
          <motion.div key={activeSection} variants={pageVariants} initial="hidden" animate="visible" exit="exit">
            {renderSection()}
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="fixed bottom-0 left-0 right-0 z-50">
        <div className="max-w-[600px] mx-auto px-4 pb-5 pt-2">
          <div className="glass rounded-2xl" style={{ display: 'grid', gridTemplateColumns: `repeat(${NAV.length}, 1fr)` }}>
            {NAV.map(({ id, Icon, label }) => {
              const active = activeSection === id
              return (
                <motion.button
                  key={id}
                  whileTap={{ scale: 0.88 }}
                  onClick={() => navigate(id)}
                  className={"flex flex-col items-center py-3 px-1 rounded-xl transition-all duration-200 relative " + (active ? "text-white" : "text-slate-600 hover:text-slate-400")}
                >
                  {active && (
                    <motion.div layoutId="nav-bg" className="absolute inset-1 rounded-xl bg-white/[0.06]" transition={{ type: "spring", stiffness: 380, damping: 36 }} />
                  )}
                  <Icon size={17} strokeWidth={active ? 2 : 1.6} className="relative z-10" />
                  <span className="relative z-10 text-[9px] font-medium mt-1 tracking-wide font-mono-jb uppercase">{label}</span>
                  {active && (
                    <motion.div layoutId="nav-dot" className="relative z-10 mt-1 w-1 h-1 rounded-full bg-blue-400" />
                  )}
                </motion.button>
              )
            })}
          </div>
        </div>
      </div>
      <LogPanel />
    </div>
  )
}

export default App
