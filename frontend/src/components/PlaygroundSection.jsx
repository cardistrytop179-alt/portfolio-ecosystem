import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Zap, CheckCircle2, XCircle, Server, Globe, Bot } from 'lucide-react'
import { addLog } from './LogPanel'
import { list, item } from '../motion/variants'
import { API } from '../api'

const STATUS = {
  idle:    { color: 'text-slate-500', label: 'Готов к тестированию' },
  testing: { color: 'text-blue-400',  label: 'Отправка запроса...' },
  success: { color: 'text-emerald-400', label: 'Соединение активно — проверьте Telegram' },
  error:   { color: 'text-red-400',   label: 'Ошибка. Убедитесь, что бот запущен.' },
}

const nodes = [
  { key: 'fe',  label: 'Frontend',  Icon: Globe,  active: ['testing', 'success'] },
  { key: 'be',  label: 'Backend',   Icon: Server, active: ['testing', 'success'] },
  { key: 'bot', label: 'Telegram',  Icon: Bot,    active: ['success'] },
]

const stackRows = [
  { title: 'UI Layer',  value: 'React · Framer Motion · Tailwind CSS' },
  { title: 'API Layer', value: 'Grammy · Express.js · Prisma ORM' },
  { title: 'Auth',      value: 'HMAC-SHA256 · Telegram InitData' },
  { title: 'Database',  value: 'PostgreSQL (Railway)' },
]

const PlaygroundSection = ({ setIsConnected }) => {
  const [status, setStatus] = useState('idle')

  const runTest = async () => {
    setStatus('testing')
    try {
      const user = window.Telegram?.WebApp?.initDataUnsafe?.user
      if (!user) {
        // Not running inside Telegram Mini App or missing init data — show friendly message
        throw new Error('no context')
      }
      const res = await fetch(`${API}/api/notify-user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Telegram-Init-Data': window.Telegram?.WebApp?.initData || '',
        },
        body: JSON.stringify({
          telegramId: user.id,
          message: '*Тест связи прошёл успешно*\n\nСообщение отправлено из Mini App через серверный API.',
        }),
      })
      if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`)
      setStatus('success')
      setIsConnected(true)
      addLog('ok', 'Тест связи прошёл успешно')
    } catch (e) {
      setStatus('error')
      addLog('error', 'Ошибка теста связи', String(e))
    } finally {
      setTimeout(() => setStatus('idle'), 4500)
    }
  }

  const s = STATUS[status]
  const isInTelegram = !!(typeof window !== 'undefined' && window.Telegram && window.Telegram.WebApp)
  const hasUserContext = !!(window.Telegram?.WebApp?.initDataUnsafe?.user)

  return (
    <div className="pt-2 pb-4">
      {/* Header */}
      <motion.div variants={list} initial="hidden" animate="visible" className="mb-8">
        <p className="label mb-2">Playground</p>
        <h2 className="section-title mb-2">Демо интеграции</h2>
        <p className="text-slate-400 text-sm">Проверка цепочки: Mini App → Backend → Telegram Bot</p>
      </motion.div>

      {/* Architecture card */}
      <motion.div variants={item} className="card p-6 mb-4">
        {/* Nodes row */}
        <div className="flex items-center mb-6">
          {nodes.map((node, idx) => {
            const isActive = node.active.includes(status)
            const { Icon } = node
            return (
              <React.Fragment key={node.key}>
                <div className="flex-1 flex flex-col items-center gap-2">
                  <div className={`w-12 h-12 rounded-2xl border flex items-center justify-center
                                  transition-all duration-400 ${
                    isActive
                      ? status === 'error' && node.key === 'bot' ? 'bg-white/[0.03] border-white/[0.07]'
                        : status === 'success' ? 'bg-emerald-500/[0.12] border-emerald-500/[0.35]'
                        : 'bg-blue-500/[0.12] border-blue-500/[0.35]'
                      : 'bg-white/[0.03] border-white/[0.07]'
                  }`}>
                    <Icon
                      size={19}
                      strokeWidth={1.5}
                      className={`transition-colors duration-400 ${
                        isActive
                          ? status === 'success' ? 'text-emerald-400'
                            : status === 'error' && node.key !== 'bot' ? 'text-red-400'
                            : 'text-blue-400'
                          : 'text-slate-600'
                      }`}
                    />
                  </div>
                  <span className="label tracking-widest" style={{ fontSize: '9px' }}>{node.label}</span>
                </div>

                {idx < nodes.length - 1 && (
                  <div className="relative w-8 flex items-center mb-5">
                    <div className={`w-full h-px transition-colors duration-400 ${
                      status === 'success' ? 'bg-emerald-400/30' : 'bg-white/[0.06]'
                    }`} />
                    {status === 'testing' && (
                      <motion.div
                        className="absolute h-[3px] w-3 rounded-full bg-gradient-to-r from-transparent via-blue-400 to-transparent"
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ repeat: Infinity, duration: 0.9, ease: 'linear', delay: idx * 0.35 }}
                      />
                    )}
                  </div>
                )}
              </React.Fragment>
            )
          })}
        </div>

        {/* Status line */}
        <div className="flex items-center gap-2.5 pt-4 border-t border-white/[0.04]">
          <AnimatePresence mode="wait">
            {status === 'idle' && (
              <motion.div key="idle" className="w-1.5 h-1.5 rounded-full bg-slate-700" initial={{ opacity: 0 }} animate={{ opacity: 1 }} />
            )}
            {status === 'testing' && (
              <motion.div key="spin" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="w-3.5 h-3.5 border border-blue-400 border-t-transparent rounded-full animate-spin" />
            )}
            {status === 'success' && (
              <motion.div key="ok" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <CheckCircle2 size={14} className="text-emerald-400" />
              </motion.div>
            )}
            {status === 'error' && (
              <motion.div key="err" initial={{ scale: 0.6, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <XCircle size={14} className="text-red-400" />
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence mode="wait">
            <motion.p
              key={status}
              initial={{ opacity: 0, x: 4 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              className={`font-mono-jb text-[11px] transition-colors ${s.color}`}
            >
              {s.label}
            </motion.p>
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Run button */}
      <motion.button
        variants={item}
        whileHover={{ boxShadow: '0 10px 40px var(--accent-glow)', scale: 1.01 }}
        whileTap={{ scale: 0.995 }}
        onClick={runTest}
        disabled={status === 'testing' || !hasUserContext}
        className={`w-full py-4 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2
                    transition-all mb-5 active:scale-[0.97] disabled:opacity-60 ${
          status === 'testing'
            ? 'bg-[#0d1829] border border-white/[0.07] text-slate-500 cursor-not-allowed'
            : !hasUserContext ? 'bg-[#0b0e14] border border-white/[0.04] text-slate-500 cursor-not-allowed' : 'btn-primary'
        }`}
      >
        {status === 'testing' ? (
          <><div className="w-4 h-4 border border-slate-500 border-t-blue-400 rounded-full animate-spin" /> Тестирование...</>
        ) : !hasUserContext ? (
          <><Zap size={15} strokeWidth={2} /> Откройте в Mini App для теста</>
        ) : (
          <><Zap size={15} strokeWidth={2} /> Запустить тест связи</>
        )}
      </motion.button>

      {/* Stack cards */}
      <div className="space-y-2">
        {stackRows.map((row, i) => (
          <motion.div key={row.title} variants={item} className="card px-4 py-3 flex items-center gap-4">
            <p className="label w-20 shrink-0">{row.title}</p>
            <p className="font-mono-jb text-[11px] text-slate-400">{row.value}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default PlaygroundSection
