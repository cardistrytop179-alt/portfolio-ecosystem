import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, CheckCircle2, XCircle, Globe, Shield, Zap, FileText } from 'lucide-react'
import { addLog } from './LogPanel'
import { list, item } from '../motion/variants'
import { API } from '../api'

const AnalyzerSection = ({ setIsConnected }) => {
  const [url, setUrl] = useState('')
  const [status, setStatus] = useState('idle') // idle | analyzing | success | error
  const [result, setResult] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  // Single attempt. Returns parsed data or throws.
  const callAnalyze = async (signal) => {
    const res = await fetch(`${API}/api/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      signal,
    })
    const text = await res.text()
    if (!text) throw new Error('EMPTY_RESPONSE')
    let data
    try { data = JSON.parse(text) } catch { throw new Error('Некорректный ответ сервера') }
    if (!res.ok || !data.success) {
      throw new Error(data.message || data.error || 'Server Error')
    }
    return data
  }

  const handleAnalyze = async () => {
    if (!url) return
    setStatus('analyzing')
    setResult(null)
    setErrorMsg('')
    addLog('info', `Начат анализ: ${url}`)

    // First attempt with a 15s timeout. If backend is sleeping (Render free
    // tier) the first request usually fails fast — we then wake it via /health
    // and retry once with a 45s timeout.
    const attempt = async (timeoutMs) => {
      const ctrl = new AbortController()
      const timer = setTimeout(() => ctrl.abort(), timeoutMs)
      try {
        return await callAnalyze(ctrl.signal)
      } finally {
        clearTimeout(timer)
      }
    }

    try {
      let data
      try {
        data = await attempt(15_000)
      } catch (firstErr) {
        const looksLikeCold = firstErr.name === 'AbortError' ||
                              firstErr.message === 'EMPTY_RESPONSE' ||
                              /Failed to fetch|NetworkError/i.test(firstErr.message)
        if (!looksLikeCold) throw firstErr

        // Wake the backend and retry once.
        setErrorMsg('Сервер просыпается, подождите ~30 сек...')
        addLog('info', 'Cold start detected — waking backend via /health')
        try { await fetch(`${API}/health`, { cache: 'no-store' }) } catch { /* ignore */ }
        data = await attempt(45_000)
        setErrorMsg('')
      }

      setResult(data)
      setStatus('success')
      setIsConnected(true)
      addLog('ok', `Успешно проанализирован: ${data.url}`)
    } catch (e) {
      setStatus('error')
      const msg = e.name === 'AbortError' ? 'Сервер не отвечает. Попробуйте ещё раз.'
                : e.message === 'EMPTY_RESPONSE' ? 'Сервер вернул пустой ответ'
                : e.message
      setErrorMsg(msg)
      addLog('error', 'Ошибка анализа сайта', String(e))
    }
  }

  const handleSendLead = async () => {
    try {
      const telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user
      if (telegramUser) {
        await fetch(`${API}/api/submit_lead`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Telegram-Init-Data': window.Telegram?.WebApp?.initData || '',
          },
          body: JSON.stringify({
            telegram_username: telegramUser.username || telegramUser.first_name,
            project_type: 'Аудит: ' + (result?.url || url),
            design: 'Н/Д',
            database: false,
            integrations: false,
            total_byn: 0,
          }),
        })
      }
      addLog('ok', 'Заявка отправлена!')
      // Optionally show a toast or alert
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.showAlert('Ваша заявка успешно отправлена админу!');
      }
    } catch (e) {
      addLog('error', 'Ошибка отправки лида', String(e))
    }
  }

  return (
    <div className="pt-2 pb-4">
      {/* Header */}
      <motion.div variants={list} initial="hidden" animate="visible" className="mb-8">
        <p className="label mb-2">Инструменты</p>
        <h2 className="section-title mb-2">Анализатор сайтов</h2>
        <p className="text-slate-400 text-sm">Быстрый технический аудит (SEO & SSL)</p>
      </motion.div>

      {/* Input Area */}
      <motion.div variants={item} className="mb-6 relative">
        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
          <Globe size={18} className={status === 'analyzing' ? 'text-blue-400 animate-pulse' : 'text-slate-500'} />
        </div>
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com"
          className="w-full bg-[#0d1829] border border-white/[0.06] rounded-2xl py-4 pl-11 pr-4 
                     text-white placeholder:text-slate-600 outline-none focus:border-blue-500/50 
                     transition-all font-mono-jb text-sm"
          onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
          disabled={status === 'analyzing'}
        />
        <button
          onClick={handleAnalyze}
          disabled={!url || status === 'analyzing'}
          className="absolute inset-y-2 right-2 px-4 bg-white/10 hover:bg-white/15 
                     text-white rounded-xl text-xs font-semibold transition-all
                     disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {status === 'analyzing' ? (
             <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
          ) : (
            <Search size={14} />
          )}
          Анализ
        </button>
      </motion.div>

      {/* Status / Error / Hint Message */}
      <AnimatePresence>
        {status === 'analyzing' && errorMsg && (
          <motion.div
            key="hint"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 mb-6 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-start gap-3"
          >
            <div className="w-[18px] h-[18px] border-2 border-blue-400/20 border-t-blue-400 rounded-full animate-spin shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-blue-400 mb-1">Подождите</h3>
              <p className="text-xs text-blue-300 font-mono-jb">{errorMsg}</p>
            </div>
          </motion.div>
        )}
        {status === 'error' && (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 mb-6 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3"
          >
            <XCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-semibold text-red-400 mb-1">Ошибка анализа</h3>
              <p className="text-xs text-red-300 font-mono-jb">{errorMsg}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results Dashboard */}
      <AnimatePresence mode="wait">
        {status === 'success' && result && (
          <motion.div
            key="result"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-4"
          >
            <div className="grid grid-cols-2 gap-3">
              {/* HTTPS */}
              <div className="card p-4 flex flex-col items-center justify-center text-center">
                <Shield size={24} className={`mb-3 ${result.has_https ? 'text-emerald-400' : 'text-red-400'}`} />
                <span className="font-mono-jb text-[10px] text-slate-500 mb-1">SSL Сертификат</span>
                <span className={`text-sm font-semibold ${result.has_https ? 'text-emerald-500' : 'text-red-500'}`}>
                  {result.has_https ? 'Защищен (HTTPS)' : 'Незащищен (HTTP)'}
                </span>
              </div>
              
              {/* Response Time */}
              <div className="card p-4 flex flex-col items-center justify-center text-center">
                <Zap size={24} className="mb-3 text-blue-400" />
                <span className="font-mono-jb text-[10px] text-slate-500 mb-1">Скорость ответа</span>
                <span className="text-sm font-semibold text-white">
                  {result.response_time_ms} ms
                </span>
                <span className="text-[10px] text-slate-500 mt-1">
                  {result.response_time_ms < 500 ? 'Отличная' : result.response_time_ms < 1500 ? 'Средняя' : 'Медленная'}
                </span>
              </div>

              {/* Title tag */}
              <div className="card p-4 flex flex-col items-center justify-center text-center">
                <FileText size={24} className={`mb-3 ${result.has_title ? 'text-emerald-400' : 'text-orange-400'}`} />
                <span className="font-mono-jb text-[10px] text-slate-500 mb-1">&lt;title&gt;</span>
                <span className={`text-sm font-semibold ${result.has_title ? 'text-emerald-500' : 'text-orange-400'}`}>
                  {result.has_title ? 'Присутствует' : 'Отсутствует'}
                </span>
              </div>

              {/* Meta Description */}
              <div className="card p-4 flex flex-col items-center justify-center text-center">
                <FileText size={24} className={`mb-3 ${result.has_description ? 'text-emerald-400' : 'text-orange-400'}`} />
                <span className="font-mono-jb text-[10px] text-slate-500 mb-1">Meta Description</span>
                <span className={`text-sm font-semibold ${result.has_description ? 'text-emerald-500' : 'text-orange-400'}`}>
                  {result.has_description ? 'Присутствует' : 'Отсутствует'}
                </span>
              </div>
            </div>

            <motion.button
              whileHover={{ boxShadow: '0 10px 40px var(--accent-glow)', scale: 1.01 }}
              whileTap={{ scale: 0.995 }}
              onClick={handleSendLead}
              className="w-full py-4 rounded-2xl btn-primary text-sm font-semibold flex items-center justify-center gap-2 transition-all mt-4"
            >
              <CheckCircle2 size={16} />
              Отправить заявку админу
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AnalyzerSection