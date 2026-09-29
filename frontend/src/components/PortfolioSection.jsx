import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronRight, CheckCircle2 } from 'lucide-react'
import { list, item } from '../motion/variants'

const projects = [
  {
    id: 1,
    label: 'Финтех',
    title: 'HashHedge Automation',
    subtitle: 'Crypto trading bot',
    description:
      'Высокопроизводительный торговый бот с интеграцией Binance API. Система риск-менеджмента, автоматическое исполнение стратегий и мониторинг в реальном времени.',
    tech: ['Node.js', 'Grammy', 'PostgreSQL', 'Binance API'],
    accentClass: 'from-emerald-400 to-teal-500',
    accentBg:    'rgba(16,185,129,0.08)',
    accentBorder:'rgba(16,185,129,0.22)',
    accentText:  '#34d399',
    features: [
      'Торговля 24/7 без простоев',
      'Risk management & stop-loss',
      'Real-time Telegram notifications',
      'PnL аналитика и история сделок',
    ],
  },
  {
    id: 2,
    label: 'AI / Парсинг',
    title: 'Kufar AI Parser',
    subtitle: 'Smart listing monitor',
    description:
      'Система мониторинга с использованием AI для анализа выгодности предложений. Мгновенные push-уведомления о новых лотах ниже рыночной цены.',
    tech: ['Python', 'OpenAI API', 'PostgreSQL', 'Telegram SDK'],
    accentClass: 'from-orange-400 to-red-500',
    accentBg:    'rgba(249,115,22,0.08)',
    accentBorder:'rgba(249,115,22,0.22)',
    accentText:  '#fb923c',
    features: [
      'AI-фильтрация нерелевантных объявлений',
      'Скорость обработки < 1 секунды',
      'Авто-отклик на объявления',
      'История и аналитика цен',
    ],
  },
  {
    id: 3,
    label: 'E-Commerce',
    title: 'Telegram Marketplace',
    subtitle: 'In-app shopping solution',
    description:
      'Полноценный маркетплейс внутри Telegram с корзиной, оплатой (Stars / Crypto) и admin-панелью для управления заказами и остатками.',
    tech: ['React', 'Express', 'Prisma', 'Telegram Payments'],
    accentClass: 'from-blue-400 to-indigo-500',
    accentBg:    'rgba(59,130,246,0.08)',
    accentBorder:'rgba(59,130,246,0.22)',
    accentText:  '#60a5fa',
    features: [
      'Оплата в один клик (Stars / Crypto)',
      'Каталог с поиском и фильтрами',
      'Дашборд статистики продаж',
      'Рассылки и ретаргетинг',
    ],
  },
]

const PortfolioSection = ({ onNavigate }) => {
  const [selected, setSelected] = useState(null)

  return (
    <div className="pt-2 pb-4">
      {/* Header */}
      <motion.div variants={list} initial="hidden" animate="visible" className="mb-8">
        <p className="label mb-2">Кейсы / Portfolio</p>
        <h2 className="section-title mb-2">Выбранные проекты</h2>
        <p className="text-slate-400 text-sm">Автоматизация бизнес-процессов и Telegram-решения</p>
      </motion.div>

      {/* Project list */}
      <div className="space-y-3">
        <motion.div variants={list} initial="hidden" animate="visible" className="space-y-3">
          {projects.map((p) => (
            <motion.button
              key={p.id}
              variants={item}
              whileHover={{ boxShadow: '0 10px 40px var(--accent-glow)', scale: 1.01 }}
              whileTap={{ scale: 0.995 }}
              onClick={() => setSelected(p)}
              className="w-full group"
            >
              <div className="card card-interactive p-4 text-left relative overflow-hidden">
                {/* accent side bar */}
                <div
                  className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-full bg-gradient-to-b ${p.accentClass}
                               opacity-50 group-hover:opacity-90 transition-opacity duration-300`}
                />
                <div className="pl-4 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span
                      className="font-mono-jb text-[10px] font-medium tracking-wider px-2 py-0.5 rounded mb-1.5 inline-block border"
                      style={{ color: p.accentText, background: p.accentBg, borderColor: p.accentBorder }}
                    >
                      {p.label}
                    </span>
                    <h3 className="font-space font-semibold text-white text-[0.92rem] leading-tight">{p.title}</h3>
                    <p className="text-slate-500 text-[11px] mt-0.5">{p.subtitle}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {p.tech.slice(0, 3).map((t) => (
                        <span key={t} className="font-mono-jb text-[10px] text-slate-500">{t}</span>
                      ))}
                      {p.tech.length > 3 && (
                        <span className="font-mono-jb text-[10px] text-slate-600">+{p.tech.length - 3}</span>
                      )}
                    </div>
                  </div>
                  <ChevronRight
                    size={16}
                    className="text-slate-600 group-hover:text-slate-400 shrink-0 transition-colors"
                  />
                </div>
              </div>
            </motion.button>
          ))}
        </motion.div>
      </div>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-sm z-[100] flex items-end"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 32 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full glass rounded-t-[28px] p-6 max-h-[88vh] overflow-y-auto border-t border-white/[0.06]"
            >
              {/* drag handle */}
              <div className="w-10 h-1 bg-white/[0.08] rounded-full mx-auto mb-6" />

              {/* Modal header */}
              <div className="flex items-start justify-between mb-5">
                <div>
                  <span
                    className="font-mono-jb text-[10px] tracking-wider px-2 py-0.5 rounded mb-2 inline-block border"
                    style={{ color: selected.accentText, background: selected.accentBg, borderColor: selected.accentBorder }}
                  >
                    {selected.label}
                  </span>
                  <h2 className="font-sora text-xl font-bold text-white">{selected.title}</h2>
                  <p className="text-slate-400 text-sm">{selected.subtitle}</p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelected(null)}
                  className="p-2 rounded-xl border border-white/[0.07] text-slate-500
                             hover:text-white hover:border-white/[0.14] transition-all"
                >
                  <X size={16} />
                </motion.button>
              </div>

              {/* Description */}
              <p className="text-slate-300 text-sm leading-relaxed mb-6">{selected.description}</p>

              {/* Tech stack */}
              <div className="mb-6">
                <p className="label mb-2.5">Tech Stack</p>
                <div className="flex flex-wrap gap-2">
                  {selected.tech.map((t) => (
                    <span
                      key={t}
                      className="font-mono-jb text-[11px] px-2.5 py-1 bg-white/[0.04]
                                 border border-white/[0.08] rounded-lg text-slate-300"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Features */}
              <div className="mb-8">
                <p className="label mb-3">Ключевые фичи</p>
                <div className="space-y-2.5">
                  {selected.features.map((f) => (
                    <div key={f} className="flex items-center gap-2.5 text-[0.875rem] text-slate-300">
                      <CheckCircle2 size={14} className="text-emerald-400 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={() => setSelected(null)}
                  className="flex-1 py-3.5 rounded-2xl text-sm font-semibold
                             bg-white/[0.04] border border-white/[0.08] text-slate-400
                             hover:text-white transition-colors"
                >
                  Закрыть
                </button>
                <button
                  onClick={() => { setSelected(null); onNavigate('calculator') }}
                  className="flex-[1.5] py-3.5 rounded-2xl text-sm font-semibold btn-primary"
                >
                  Хочу такой же
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default PortfolioSection
