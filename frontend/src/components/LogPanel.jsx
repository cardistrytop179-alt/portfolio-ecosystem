import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Terminal, X, ChevronDown, ChevronUp, Trash2, AlertCircle, Info, AlertTriangle, CheckCircle2 } from 'lucide-react'

const MAX_LOGS = 80

const LEVELS = {
  error: { color: 'text-red-400',     icon: AlertCircle,    bg: 'bg-red-500/10 border-red-500/20' },
  warn:  { color: 'text-amber-400',   icon: AlertTriangle,  bg: 'bg-amber-500/10 border-amber-500/20' },
  info:  { color: 'text-blue-400',    icon: Info,           bg: 'bg-blue-500/10 border-blue-500/20' },
  ok:    { color: 'text-emerald-400', icon: CheckCircle2,   bg: 'bg-emerald-500/10 border-emerald-500/20' },
}

let _addLog = null
export function addLog(level, message, detail = '') {
  if (_addLog) _addLog({ level, message, detail, ts: new Date().toLocaleTimeString('ru-RU') })
}

export default function LogPanel() {
  const [logs, setLogs]       = useState([])
  const [open, setOpen]       = useState(false)
  const [unread, setUnread]   = useState(0)
  const bottomRef             = useRef(null)

  useEffect(() => {
    _addLog = (entry) => {
      setLogs((prev) => {
        const next = [...prev, entry]
        return next.length > MAX_LOGS ? next.slice(-MAX_LOGS) : next
      })
      setUnread((n) => n + 1)
    }

    // Intercept console.error and console.warn
    const origError = console.error.bind(console)
    const origWarn  = console.warn.bind(console)

    console.error = (...args) => {
      origError(...args)
      addLog('error', args.map(String).join(' '))
    }
    console.warn = (...args) => {
      origWarn(...args)
      addLog('warn', args.map(String).join(' '))
    }

    // Intercept unhandled promise rejections
    const onUnhandled = (e) => addLog('error', 'UnhandledRejection', String(e.reason))
    window.addEventListener('unhandledrejection', onUnhandled)

    // Intercept uncaught errors
    const onError = (e) => addLog('error', e.message, `${e.filename}:${e.lineno}`)
    window.addEventListener('error', onError)

    // Log initial ready state
    addLog('ok', 'LogPanel инициализирован')

    return () => {
      console.error = origError
      console.warn  = origWarn
      window.removeEventListener('unhandledrejection', onUnhandled)
      window.removeEventListener('error', onError)
    }
  }, [])

  useEffect(() => {
    if (open) {
      setUnread(0)
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 60)
    }
  }, [open, logs])

  const errorCount = logs.filter((l) => l.level === 'error').length

  return (
    <div className="fixed bottom-[88px] right-3 z-[200]">
      {/* Toggle button */}
      <motion.button
        whileTap={{ scale: 0.93 }}
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[11px] font-mono-jb font-medium
          transition-all duration-200 shadow-lg
          ${errorCount > 0
            ? 'bg-red-500/10 border-red-500/30 text-red-400'
            : 'bg-[#0d1829] border-white/[0.07] text-slate-500 hover:text-slate-300'
          }`}
      >
        <Terminal size={12} />
        <span>Логи</span>
        {unread > 0 && !open && (
          <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold
            ${errorCount > 0 ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>
            {unread > 99 ? '99+' : unread}
          </span>
        )}
        {open ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
      </motion.button>

      {/* Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full right-0 mb-2 w-[340px] max-w-[calc(100vw-24px)]
                       bg-[#08121e] border border-white/[0.07] rounded-2xl
                       shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Terminal size={13} className="text-slate-500" />
                <span className="font-mono-jb text-[11px] text-slate-400 font-medium">
                  dev console
                </span>
                {errorCount > 0 && (
                  <span className="px-1.5 py-0.5 rounded-md bg-red-500/15 text-red-400 text-[9px] font-bold font-mono-jb">
                    {errorCount} ERR
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setLogs([])}
                  className="p-1 text-slate-600 hover:text-slate-400 transition-colors"
                >
                  <Trash2 size={12} />
                </button>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1 text-slate-600 hover:text-slate-400 transition-colors"
                >
                  <X size={12} />
                </button>
              </div>
            </div>

            {/* Log entries */}
            <div className="h-[240px] overflow-y-auto p-2 space-y-1">
              {logs.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <span className="font-mono-jb text-[11px] text-slate-700">нет логов</span>
                </div>
              ) : (
                logs.map((log, i) => {
                  const L = LEVELS[log.level] || LEVELS.info
                  const Icon = L.icon
                  return (
                    <div
                      key={i}
                      className={`flex gap-2 items-start p-2 rounded-lg border text-[11px] ${L.bg}`}
                    >
                      <Icon size={11} className={`${L.color} mt-0.5 shrink-0`} />
                      <div className="min-w-0 flex-1">
                        <span className={`font-mono-jb break-all ${L.color}`}>{log.message}</span>
                        {log.detail && (
                          <div className="text-slate-600 font-mono-jb text-[10px] mt-0.5 break-all">
                            {log.detail}
                          </div>
                        )}
                      </div>
                      <span className="font-mono-jb text-[9px] text-slate-700 shrink-0 mt-0.5">
                        {log.ts}
                      </span>
                    </div>
                  )
                })
              )}
              <div ref={bottomRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
