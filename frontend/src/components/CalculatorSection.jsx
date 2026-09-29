import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Check, Send, Bot, ShoppingCart, Settings, Share2, Database, Smartphone } from 'lucide-react'
import { addLog } from './LogPanel'
import { list, item } from '../motion/variants'
import { API } from '../api'

const botTypes = [
  { value: 'visiting',    icon: Bot,         label: 'Визитка',       desc: 'Информационный бот',    price: 300 },
  { value: 'shop',        icon: ShoppingCart, label: 'Магазин',       desc: 'E-commerce решение',    price: 800 },
  { value: 'admin',       icon: Settings,     label: 'Управление',    desc: 'Административный бот',  price: 1200 },
  { value: 'automation',  icon: Share2,        label: 'Автоматизация', desc: 'Бизнес-процессы',      price: 2000 },
]

const complexityLevels = [
  { value: 'simple',  label: 'Базовая',      multiplier: 1 },
  { value: 'medium',  label: 'Продвинутая',  multiplier: 1.5 },
  { value: 'complex', label: 'Сложная',      multiplier: 2.2 },
]

const addons = [
  { key: 'hasDatabase', icon: Database,    label: 'База данных',       priceByn: 300 },
  { key: 'hasMiniApp',  icon: Smartphone,  label: 'Telegram Mini App', priceByn: 600 },
]

const CalculatorSection = ({ onNavigate, setIsConnected }) => {
  const [form, setForm]       = useState({ botType: '', complexity: 'simple', hasDatabase: false, hasMiniApp: false })
  const [price, setPrice]     = useState(0)
  const [priceUsd, setPriceUsd] = useState(0)
  const [rate, setRate] = useState(null)
  const [isSaved, setIsSaved] = useState(false)

  useEffect(() => {
    if (!form.botType) return
    const bot   = botTypes.find((b) => b.value === form.botType)
    const level = complexityLevels.find((l) => l.value === form.complexity)
    let p = bot.price * level.multiplier
    if (form.hasDatabase) p += addons.find(a => a.key === 'hasDatabase').priceByn
    if (form.hasMiniApp)  p += addons.find(a => a.key === 'hasMiniApp').priceByn
    setPrice(Math.round(p))
  }, [form])

  // Fetch BYN -> USD rate once
  useEffect(() => {
    let mounted = true
    fetch(`${API}/api/exchange-rate`)
      .then((r) => r.json())
      .then((data) => {
        if (!mounted) return
        const rVal = data && (data.rate || (data.rates && data.rates.USD)) || 0.38
        setRate(rVal)
      })
      .catch(() => setRate(0.38))
    return () => { mounted = false }
  }, [])

  // Update USD price when BYN price or rate changes
  useEffect(() => {
    if (!rate) return
    setPriceUsd(Math.round(price * rate))
  }, [price, rate])

  const handleSave = async () => {
    try {
      const telegramId = window.Telegram?.WebApp?.initDataUnsafe?.user?.id
      if (telegramId) {
        await fetch(`${API}/api/save-calculation`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Telegram-Init-Data': window.Telegram?.WebApp?.initData || '',
          },
          body: JSON.stringify({ telegramId, calculation: { ...form, price_byn: price, price_usd: priceUsd || null } }),
        })
      }
      setIsSaved(true)
      setIsConnected(true)
      addLog('ok', 'Расчёт отправлен в Telegram')
    } catch (e) {
      addLog('error', 'Ошибка сохранения расчёта', String(e))
    }
  }

  return (
    <div className="pt-2 pb-4">
      {/* Header */}
      <motion.div variants={list} initial="hidden" animate="visible" className="mb-8">
        <p className="label mb-2">Калькулятор</p>
        <h2 className="section-title mb-2">Стоимость проекта</h2>
        <p className="text-slate-400 text-sm">Предварительная оценка до составления ТЗ</p>
      </motion.div>

      <div className="space-y-7">
        {/* Type */}
        <section>
          <p className="label mb-3">Тип решения</p>
          <div className="grid grid-cols-2 gap-2">
            {botTypes.map((bot) => {
              const Icon   = bot.icon
              const active = form.botType === bot.value
              return (
                <motion.button
                  key={bot.value}
                  variants={item}
                  whileHover={{ boxShadow: '0 10px 40px var(--accent-glow)', scale: 1.01 }}
                  whileTap={{ scale: 0.995 }}
                  onClick={() => { setForm((f) => ({ ...f, botType: bot.value })); setIsSaved(false) }}
                  className={`p-4 rounded-2xl text-left transition-all duration-200 border ${
                    active
                      ? 'bg-blue-500/[0.1] border-blue-500/40 shadow-[0_0_20px_rgba(59,130,246,0.08)]'
                      : 'bg-[#0d1829] border-white/[0.06] hover:border-white/[0.12]'
                  }`}
                >
                  <Icon
                    size={18}
                    className={`mb-2.5 transition-colors ${active ? 'text-blue-400' : 'text-slate-600'}`}
                    strokeWidth={1.5}
                  />
                  <p className={`font-semibold text-sm transition-colors ${active ? 'text-white' : 'text-slate-300'}`}>
                    {bot.label}
                  </p>
                  <p className={`font-mono-jb text-[10px] mt-0.5 transition-colors ${active ? 'text-blue-400' : 'text-slate-600'}`}>
                    {rate ? `от $${Math.round(bot.price * rate).toLocaleString()}` : `от ${bot.price.toLocaleString()} BYN`}
                  </p>
                </motion.button>
              )
            })}
          </div>
        </section>

        {/* Complexity */}
        <section>
          <p className="label mb-3">Сложность</p>
          <div className="grid grid-cols-3 gap-2">
            {complexityLevels.map((lv) => {
              const active = form.complexity === lv.value
              return (
                <motion.button
                  key={lv.value}
                  variants={item}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.995 }}
                  onClick={() => { setForm((f) => ({ ...f, complexity: lv.value })); setIsSaved(false) }}
                  className={`py-3 rounded-xl text-sm font-medium transition-all duration-200 border ${
                    active
                      ? 'bg-violet-500/[0.1] border-violet-500/40 text-violet-300'
                      : 'bg-[#0d1829] border-white/[0.06] text-slate-500 hover:border-white/[0.12]'
                  }`}
                >
                  {lv.label}
                </motion.button>
              )
            })}
          </div>
        </section>

        {/* Add-ons */}
        <section>
          <p className="label mb-3">Дополнения</p>
          <div className="space-y-2">
            {addons.map(({ key, icon: Icon, label, priceByn }) => {
              const active = form[key]
              return (
                <motion.button
                  key={key}
                  variants={item}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.995 }}
                  onClick={() => { setForm((f) => ({ ...f, [key]: !f[key] })); setIsSaved(false) }}
                  className={`w-full p-4 rounded-2xl flex items-center gap-3 transition-all duration-200 border ${
                    active ? 'bg-white/[0.05] border-white/[0.12]' : 'bg-[#0d1829] border-white/[0.06]'
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                    active ? 'bg-blue-500 border-blue-500' : 'border-slate-600'
                  }`}>
                    {active && <Check size={11} strokeWidth={3} className="text-white" />}
                  </div>
                  <Icon size={15} className={`transition-colors ${active ? 'text-slate-300' : 'text-slate-600'}`} strokeWidth={1.5} />
                  <span className={`flex-1 text-sm text-left transition-colors ${active ? 'text-white' : 'text-slate-400'}`}>
                    {label}
                  </span>
                  <span className="text-[11px] font-mono-jb text-emerald-400">{rate ? `+$${Math.round(priceByn * rate)}` : `+${priceByn} BYN`}</span>
                </motion.button>
              )
            })}
          </div>
        </section>

        {/* Result */}
        <div className="glass border border-white/[0.06] rounded-2xl p-6">
          <p className="label mb-4">Предварительный расчёт</p>
          <AnimatePresence mode="wait">
            <motion.div
              key={price + form.botType}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22 }}
              className="flex items-baseline gap-1.5"
            >
              {form.botType ? (
                <>
                  {rate ? (
                    <span className="font-sora text-4xl font-bold text-white">{'$' + priceUsd.toLocaleString()}</span>
                  ) : (
                    <span className="font-sora text-4xl font-bold text-white">{price.toLocaleString()} BYN</span>
                  )}
                </>
              ) : (
                <span className="font-sora text-2xl font-semibold text-slate-600">Выберите тип —</span>
              )}
            </motion.div>
          </AnimatePresence>
          {form.botType && (
            <p className="font-mono-jb text-[10px] text-slate-600 mt-2">
              * финальная стоимость уточняется после ТЗ
            </p>
          )}
        </div>

        {/* Submit */}
        <motion.button
          variants={item}
          whileHover={{ boxShadow: '0 10px 40px var(--accent-glow)', scale: 1.01 }}
          whileTap={{ scale: 0.995 }}
          onClick={handleSave}
          disabled={!form.botType || isSaved}
          className={`w-full py-4 rounded-2xl text-sm font-semibold flex items-center justify-center gap-2
                      transition-all active:scale-[0.97] disabled:cursor-not-allowed disabled:opacity-50 ${
            isSaved
              ? 'bg-emerald-500/[0.1] border border-emerald-500/30 text-emerald-400'
              : 'btn-primary'
          }`}
        >
          {isSaved ? (
            <><Check size={15} strokeWidth={2.5} /> Расчёт отправлен в Telegram</>
          ) : (
            <><Send size={14} /> Получить расчёт в Telegram</>
          )}
        </motion.button>
      </div>
    </div>
  )
}

export default CalculatorSection
