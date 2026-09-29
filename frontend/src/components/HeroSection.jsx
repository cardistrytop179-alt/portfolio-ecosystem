﻿import React from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, MessageCircle, Code2, Zap, Users } from 'lucide-react'
import { list, item } from '../motion/variants'

const metrics = [
  { value: '15+', label: 'Проектов' },
  { value: '3+',  label: 'Года' },
  { value: '10+', label: 'Клиентов' },
]

const skills = [
  { name: 'React',      color: 'tag-cyan'   },
  { name: 'Node.js',    color: 'tag-green'  },
  { name: 'Grammy',     color: 'tag-blue'   },
  { name: 'PostgreSQL', color: 'tag-purple' },
  { name: 'Prisma',     color: 'tag-blue'   },
  { name: 'TypeScript', color: 'tag-cyan'   },
  { name: 'Docker',     color: 'tag-amber'  },
  { name: 'Redis',      color: 'tag-amber'  },
]

const HeroSection = ({ onNavigate, isConnected }) => (
  <div className="pt-2">
    <motion.div variants={list} initial="hidden" animate="visible" className="space-y-8">

      {/* Status bar */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          <span className="font-mono-jb text-[10px] font-medium tracking-widest uppercase text-emerald-400">
            Доступен для проектов
          </span>
        </div>
        <motion.button
          whileHover={{ boxShadow: '0 10px 40px var(--accent-glow)', scale: 1.02 }}
          whileTap={{ scale: 0.995 }}
          onClick={() => window.open('https://t.me/deveIoper1', '_blank')}
          className="flex items-center gap-1.5 text-[11px] font-medium text-slate-400 hover:text-white
                     border border-white/[0.07] hover:border-white/[0.14] px-3 py-1.5 rounded-lg
                     transition-all duration-200"
        >
          <MessageCircle size={12} />
          Написать
        </motion.button>
      </motion.div>

      {/* Name */}
      <motion.div variants={item}>
        <p className="label mb-3">// fullstack developer</p>
        <h1 className="heading text-[2.5rem] text-white mb-3">
          Miron
          <br />
          <span className="grad-text">Developer</span>
        </h1>
        <p className="text-slate-400 text-[0.9rem] leading-relaxed">
          Telegram-боты, Mini Apps и fullstack-решения.
          <br />
          Строю продукты под ключ — от архитектуры до деплоя.
        </p>
      </motion.div>

      {/* Metrics */}
      <motion.div variants={item} className="grid grid-cols-3 gap-3">
        {metrics.map((m) => (
          <motion.div key={m.label} variants={item} className="card flex flex-col items-center py-4 px-2">
            <span className="font-space text-2xl font-bold text-white mb-0.5">{m.value}</span>
            <span className="text-[11px] text-slate-500 font-medium">{m.label}</span>
          </motion.div>
        ))}
      </motion.div>

      {/* Tech stack */}
      <motion.div variants={item}>
        <p className="label mb-3">Стек технологий</p>
        <div className="flex flex-wrap gap-2">
          {skills.map((s) => (
            <span key={s.name} className={`tag ${s.color}`}>{s.name}</span>
          ))}
        </div>
      </motion.div>

      {/* CTA buttons */}
      <motion.div variants={item} className="flex gap-3">
        <motion.button
          variants={item}
          whileHover={{ boxShadow: '0 12px 44px var(--accent-glow)', scale: 1.02 }}
          whileTap={{ scale: 0.995 }}
          onClick={() => onNavigate('portfolio')}
          className="flex-1 btn-primary py-3.5"
        >
          Посмотреть кейсы
          <ArrowRight size={15} />
        </motion.button>
        <motion.button
          variants={item}
          whileHover={{ boxShadow: '0 6px 28px var(--accent-glow)', scale: 1.01 }}
          whileTap={{ scale: 0.995 }}
          onClick={() => onNavigate('calculator')}
          className="flex-[0.65] btn-ghost py-3.5"
        >
          Цена
        </motion.button>
      </motion.div>

      {/* Service cards */}
      <motion.div variants={item} className="space-y-2.5">
        {[
          {
            id: 'calculator',
            icon: Code2,
            iconBg: 'bg-blue-500/[0.09] border-blue-500/20',
            iconColor: 'text-blue-400',
            title: 'Калькулятор цены',
            sub: 'Оцените бюджет проекта за 1 мин',
          },
          {
            id: 'playground',
            icon: Zap,
            iconBg: 'bg-violet-500/[0.09] border-violet-500/20',
            iconColor: 'text-violet-400',
            title: 'Демо интеграции',
            sub: 'Проверка связи Frontend ↔ Backend ↔ Bot',
          },
        ].map((srv) => {
          const Icon = srv.icon
          return (
            <motion.button
              key={srv.id}
              variants={item}
              whileHover={{ boxShadow: '0 10px 40px var(--accent-glow)', scale: 1.01 }}
              whileTap={{ scale: 0.995 }}
              onClick={() => onNavigate(srv.id)}
              className="w-full group card card-interactive flex items-center gap-4 p-4 text-left"
            >
              <div className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 transition-colors ${srv.iconBg}`}>
                <Icon size={18} className={srv.iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-[0.875rem] text-white">{srv.title}</p>
                <p className="text-xs text-slate-500 mt-0.5 truncate">{srv.sub}</p>
              </div>
              <ArrowRight size={14} className="text-slate-600 group-hover:text-slate-400 shrink-0 transition-colors" />
            </motion.button>
          )
        })}
      </motion.div>

    </motion.div>
  </div>
)

export default HeroSection
