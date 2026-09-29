import { Bot, session } from 'grammy';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';
import axios from 'axios';
import * as cheerio from 'cheerio';
import 'dotenv/config';

import logger from './logger.js';
import prisma from './prisma.js';
import { validateTelegramInitData } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();

// Админ (Miron) — по умолчанию используем переданный ENV или значение, указанное владельцем
const ADMIN_ID = process.env.ADMIN_ID || '7925826342';

logger.info('🚀 Starting Portfolio Bot Production Server...');

// --- BOT INITIALIZATION ---
if (!process.env.BOT_TOKEN) {
  logger.error('❌ BOT_TOKEN is not set in .env!');
  process.exit(1);
}

const bot = new Bot(process.env.BOT_TOKEN);

// Sessions
bot.use(session({
  initial: () => ({
    startTime: Date.now(),
    calculatorData: {}
  })
}));

// Error Handling Middleware for Grammy
bot.catch((err) => {
  const ctx = err.ctx;
  logger.error(`Error while handling update ${ctx.update.update_id}:`, err.error);
});

// --- COMMANDS ---

// Start command
bot.command('start', async (ctx) => {
  const t0 = Date.now();
  const { id: telegramId, username, first_name } = ctx.from;
  logger.info(`🎯 /start from ${first_name} (@${username || 'no_username'})`);

  // Save user to DB in the background — don't block the welcome reply.
  // Any error is logged but never surfaces to the user.
  void prisma.user.upsert({
    where: { telegramId: BigInt(telegramId) },
    update: { visits: { increment: 1 }, username },
    create: { telegramId: BigInt(telegramId), username, visits: 1 },
  }).catch(err => logger.error('DB upsert in /start (non-fatal):', err));

  // Build the welcome reply
  const welcomeMsg = `👋 Привет, ${first_name}!\n\n` +
    `Я — профессиональное портфолио Мирона, демонстрирующее fullstack-навыки.\n\n` +
    `🚀 **Что я умею:**\n` +
    `• Показывать крутые кейсы в Mini App\n` +
    `• Рассчитывать стоимость разработки\n` +
    `• Демонстрировать интерактивные UI-фишки\n\n` +
    `Нажми кнопку ниже, чтобы открыть Dashboard!`;

  const url = process.env.FRONTEND_URL || 'http://localhost:5173';
  const inline_keyboard = url.startsWith('https://')
    ? [
        [{ text: '🚀 Открыть Dashboard', web_app: { url } }],
        [{ text: '💼 Мои кейсы', callback_data: 'view_portfolio' }, { text: '💡 Навыки', callback_data: 'view_skills' }],
        [{ text: '📩 Связаться', url: 'https://t.me/deveIoper1' }],
      ]
    : [
        [{ text: '💼 Мои кейсы', callback_data: 'view_portfolio' }, { text: '💡 Навыки', callback_data: 'view_skills' }],
        [{ text: '📩 Связаться', url: 'https://t.me/deveIoper1' }],
      ];

  try {
    await ctx.reply(welcomeMsg, {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard },
    });
    logger.info(`✅ /start reply sent in ${Date.now() - t0}ms`);
  } catch (replyError) {
    logger.error('Failed to send /start welcome:', replyError);
  }
});

// Admin Command /admin
bot.command('admin', async (ctx) => {
  const adminId = process.env.ADMIN_ID;
  if (adminId && ctx.from.id.toString() !== adminId) {
    return ctx.reply('⛔ Доступ запрещен.');
  }

  const userCount = await prisma.user.count();
  const contactedCount = await prisma.user.count({ where: { isContacted: true } });

  await ctx.reply(
    `🛠️ **Админ-панель**\n\n` +
    `👥 Всего пользователей: ${userCount}\n` +
    `📞 Оставили контакты: ${contactedCount}\n` +
    `🖥️ NODE_ENV: ${process.env.NODE_ENV}\n\n` +
    `Выберите действие:`,
    {
      parse_mode: 'Markdown',
      reply_markup: {
        inline_keyboard: [
          [{ text: "📢 Рассылка", callback_data: "admin_broadcast" }],
          [{ text: "📊 Выгрузка пользователей", callback_data: "admin_export" }]
        ]
      }
    }
  );
});

// Status command
bot.command('status', async (ctx) => {
  try {
    const userCount = await prisma.user.count();
    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);

    await ctx.reply(
      `📊 **Статус системы**\n\n` +
      `👥 Пользователей в базе: ${userCount}\n` +
      `⏱️ Аптайм: ${hours}ч ${minutes}м\n` +
      `🟢 Сервер работает стабильно`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    logger.error('Error in /status command:', error);
  }
});

// Callback Query handlers for inline buttons
bot.callbackQuery('view_portfolio', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    `💼 *Мои избранные кейсы:*\n\n` +
    `🤖 *Торговые боты* (Node.js, PostgreSQL)\n` +
    `🛒 *E-Commerce в Telegram* (React, Express)\n` +
    `🧠 *AI ассистенты* (Python, OpenAI, Tg Bot)\n\n` +
    `Следите за обновлениями, новые проекты в разработке!`,
    {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [[{ text: '◀️ Назад', callback_data: 'back_main' }]] }
    }
  ).catch(() => ctx.reply(
    `💼 *Мои избранные кейсы:*\n\n` +
    `🤖 *Торговые боты* (Node.js, PostgreSQL)\n` +
    `🛒 *E-Commerce в Telegram* (React, Express)\n` +
    `🧠 *AI ассистенты* (Python, OpenAI, Tg Bot)\n\n` +
    `Следите за обновлениями, новые проекты в разработке!`,
    {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [[{ text: '◀️ Назад', callback_data: 'back_main' }]] }
    }
  ));
});

bot.callbackQuery('view_skills', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    `💡 *Стек технологий*\n\n` +
    `Фронтенд: *React*, *Vite*, *Tailwind*, *Framer Motion*\n` +
    `Бэкенд: *Node.js*, *Express*, *Prisma ORM*, *PostgreSQL*\n` +
    `Боты: *Grammy*, *Telegraf*, *Telegram Mini Apps*\n` +
    `Инфраструктура: *Docker*, *Nginx*, *GitHub Actions*`,
    {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [[{ text: '◀️ Назад', callback_data: 'back_main' }]] }
    }
  ).catch(() => ctx.reply(
    `💡 *Стек технологий*\n\n` +
    `Фронтенд: *React*, *Vite*, *Tailwind*, *Framer Motion*\n` +
    `Бэкенд: *Node.js*, *Express*, *Prisma ORM*, *PostgreSQL*\n` +
    `Боты: *Grammy*, *Telegraf*, *Telegram Mini Apps*\n` +
    `Инфраструктура: *Docker*, *Nginx*, *GitHub Actions*`,
    {
      parse_mode: 'Markdown',
      reply_markup: { inline_keyboard: [[{ text: '◀️ Назад', callback_data: 'back_main' }]] }
    }
  ));
});

bot.callbackQuery('contact_me', async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(
    `📩 Напишите напрямую: @deveIoper1`,
    { reply_markup: { inline_keyboard: [[{ text: '◀️ Назад', callback_data: 'back_main' }]] } }
  ).catch(() => ctx.reply(`📩 Напишите напрямую: @deveIoper1`));
});

bot.callbackQuery('back_main', async (ctx) => {
  await ctx.answerCallbackQuery();
  const url = process.env.FRONTEND_URL || '';
  const inline_keyboard = url.startsWith('https://')
    ? [
        [{ text: '🚀 Открыть Dashboard', web_app: { url } }],
        [{ text: '💼 Мои кейсы', callback_data: 'view_portfolio' }, { text: '💡 Навыки', callback_data: 'view_skills' }],
        [{ text: '📩 Связаться', url: 'https://t.me/deveIoper1' }]
      ]
    : [
        [{ text: '💼 Мои кейсы', callback_data: 'view_portfolio' }, { text: '💡 Навыки', callback_data: 'view_skills' }],
        [{ text: '📩 Связаться', url: 'https://t.me/deveIoper1' }]
      ];
  const first_name = ctx.from?.first_name || 'вас';
  await ctx.editMessageText(
    `👋 Привет, ${first_name}!\n\n` +
    `Я — профессиональное портфолио Мирона.\n\n` +
    `🛠️ *Стек:* React · Node.js · PostgreSQL · grammY\n` +
    `🚀 *Хостинг:* Vercel + Render + Railway\n\n` +
    `Нажми кнопку ниже, чтобы открыть Dashboard!`,
    { parse_mode: 'Markdown', reply_markup: { inline_keyboard } }
  ).catch(() => {});
});

bot.callbackQuery('view_stats', async (ctx) => {
  await ctx.answerCallbackQuery();
  const uptime = process.uptime();
  const hours = Math.floor(uptime / 3600);
  const minutes = Math.floor((uptime % 3600) / 60);
  await ctx.reply(`📊 Статистика:\nАптайм сервера: ${hours}ч ${minutes}м\nСледите за обновлениями!`);
});

bot.callbackQuery('admin_broadcast', async (ctx) => {
  await ctx.answerCallbackQuery({ text: 'Функция рассылки пока в разработке', show_alert: true });
});

bot.callbackQuery('admin_export', async (ctx) => {
  await ctx.answerCallbackQuery({ text: 'Функция выгрузки пока в разработке', show_alert: true });
});

// Catch-all for any other callback queries
bot.on('callback_query:data', async (ctx) => {
  await ctx.answerCallbackQuery();
});

bot.on('message:text', async (ctx) => {
  try {
    const text = ctx.message.text;

    // Не пересылаем команды
    if (!text || text.trim().startsWith('/')) return;

    // Не пересылаем сообщения от самого админа
    if (String(ctx.from.id) === String(ADMIN_ID)) return;

    // Короткая локальная помощь — отвечаем пользователю, но также пересылаем текст админу
    let replyToUser = null;
    const low = text.toLowerCase();
    if (low.includes('кейсы') || low.includes('портфолио') || low.includes('проект')) {
      replyToUser = '💼 Мои работы можно посмотреть в Mini App или на GitHub. Нажмите "💼 Мои кейсы" в стартовом меню.';
    } else if (low.includes('привет') || low.includes('здравствуй')) {
      replyToUser = 'Привет! Я бот-ассистент Мирона. Отправьте /start чтобы открыть меню.';
    } else if (low.includes('цена') || low.includes('стоимость') || low.includes('сколько')) {
      replyToUser = 'Откройте приложение (кнопка Dashboard) и воспользуйтесь встроенным калькулятором для оценки бюджета проекта!';
    } else {
      replyToUser = 'Спасибо — я переслал ваше сообщение владельцу и он свяжется с вами.';
    }

    // Формируем сообщение админу с контекстом отправителя
    const fromUser = ctx.from || {};
    const senderName = `${fromUser.first_name || ''}${fromUser.last_name ? ' ' + fromUser.last_name : ''}`.trim();
    const senderHandle = fromUser.username ? `@${fromUser.username}` : `id:${fromUser.id}`;
    const adminMsg = `✉️ Новое сообщение от ${senderName || senderHandle} (${senderHandle})\n\n${text}`;

    // Отправляем админу
    await bot.api.sendMessage(ADMIN_ID, adminMsg, { parse_mode: 'Markdown' });

    // Подтверждаем пользователю
    await ctx.reply(replyToUser);
  } catch (e) {
    logger.error('Error in message:text handler:', e);
  }
});

bot.on('message:web_app_data', async (ctx) => {
  try {
    const data = JSON.parse(ctx.message.web_app_data.data);
    logger.info(`Received web_app_data:`, data);
    await ctx.reply(`Получены данные из Mini App!\nТип проекта: ${data.projectType || 'Не указан'}\nБюджет: ${data.budget || 'Не указан'}`);
  } catch (e) {
    logger.error('Error handling web_app_data', e);
  }
});

// Help command
bot.command('help', async (ctx) => {
  await ctx.reply(
    `🤖 **Чем я могу помочь?**\n\n` +
    `/start — Запустить бота и открыть главное меню\n` +
    `/help — Показать это сообщение\n` +
    `/status — Проверить статус системы\n` +
    `/admin — Панель администратора (только для владельца)`,
    { parse_mode: 'Markdown' }
  );
});

// --- API ROUTES ---
// Render / any reverse-proxy forwards client IP in X-Forwarded-For.
// We trust exactly 1 hop so express-rate-limit can see real IPs.
app.set('trust proxy', 1);
app.use(express.json({ limit: '100kb' }));

// Exact-match allow list, extendable via FRONTEND_URL (comma-separated supported).
const allowedOrigins = (process.env.FRONTEND_URL || '')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean)
  .concat([
    'http://localhost:3000',
    'http://localhost:5173',
    'https://web.telegram.org',
    'https://telegram.org',
  ]);

// Pattern-based allow list for platforms with dynamic subdomains (previews).
const allowedOriginPatterns = [
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/i,          // Vercel previews + prod
  /^https:\/\/[a-z0-9-]+\.pages\.dev$/i,           // Cloudflare Pages previews
  /^https:\/\/[a-z0-9-]+\.onrender\.com$/i,        // Render previews
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. Telegram WebView, curl, server-to-server).
    if (!origin) return callback(null, true);

    // In development allow common local origins and LAN addresses used by Vite.
    if (process.env.NODE_ENV !== 'production') {
      const o = String(origin);
      if (o.startsWith('http://localhost') || o.startsWith('http://127.0.0.1') ||
          o.includes('192.168.') || o.includes('100.127.')) {
        return callback(null, true);
      }
    }

    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (allowedOriginPatterns.some(re => re.test(origin))) return callback(null, true);

    logger.warn(`CORS blocked origin: ${origin}`);
    return callback(new Error('Not allowed by CORS'));
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'X-Telegram-Init-Data'],
}));

// Middleware: Auth (Optional but recommended for sensitive routes)
const telegramAuth = (req, res, next) => {
  const initData = req.headers['x-telegram-init-data'];
  if (!initData && process.env.NODE_ENV === 'production') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  if (initData) {
    const user = validateTelegramInitData(initData, process.env.BOT_TOKEN);
    if (!user && process.env.NODE_ENV === 'production') {
      return res.status(403).json({ error: 'Invalid auth' });
    }
    req.tgUser = user;
  }
  next();
};

// Logging Middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// API: Notify User
app.post('/api/notify-user', telegramAuth, async (req, res) => {
  const { telegramId, message } = req.body;
  if (!telegramId || !message) return res.status(400).json({ error: 'Missing fields' });

  try {
    await bot.api.sendMessage(telegramId, message, { parse_mode: 'Markdown' });
    res.json({ success: true });
  } catch (error) {
    logger.error('API Notify Error:', error);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// API: Save Calculation
app.post('/api/save-calculation', telegramAuth, async (req, res) => {
  const { telegramId, calculation } = req.body;
  if (!telegramId || !calculation) return res.status(400).json({ error: 'Missing fields' });

  try {
    try {
      await prisma.user.update({
        where: { telegramId: BigInt(telegramId) },
        data: { 
          calcHistory: JSON.stringify(calculation),
          isContacted: true 
        }
      });
    } catch (dbError) {
      logger.error('Failed to update DB for calculation (non-fatal):', dbError);
    }

    const addons = [];
    if (calculation.hasDatabase) addons.push('База данных');
    if (calculation.hasMiniApp) addons.push('Telegram Mini App');
    const addonsStr = addons.length ? addons.join(', ') : 'Нет';

    // Determine price in BYN and USD
    const priceByn = calculation.price_byn ?? calculation.price ?? 0;
    let priceUsd = calculation.price_usd ?? null;

    if (!priceUsd) {
      const { rate } = await getBynToUsdRate();
      priceUsd = Math.round(priceByn * rate);
    }

    const msg = `✅ **Ваш предварительный расчет стоимости сохранён!**\n\n` +
      `📊 **Детали проекта:**\n` +
      `• Тип решения: *${calculation.botType}*\n` +
      `• Сложность: *${calculation.complexity}*\n` +
      `• Дополнения: *${addonsStr}*\n\n` +
      `💰 **Примерный бюджет:** ~$${priceUsd.toLocaleString()} (~${priceByn.toLocaleString()} BYN)\n\n` +
      `Если вы готовы обсудить детали, просто нажмите кнопку ниже!`;

    const inline_keyboard = [
      [{ text: '💬 Обсудить проект', url: 'https://t.me/deveIoper1' }]
    ];

    await bot.api.sendMessage(telegramId, msg, { parse_mode: 'Markdown', reply_markup: { inline_keyboard } });
    res.json({ success: true });
  } catch (error) {
    logger.error('API Save Calc Error:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// API: Stats
app.get('/api/stats', async (req, res) => {
  try {
    const totalUsers = await prisma.user.count();
    const contactedUsers = await prisma.user.count({ where: { isContacted: true } });
    res.json({ totalUsers, contactedUsers, uptime: process.uptime() });
  } catch (error) {
    res.status(500).json({ error: 'Database Error' });
  }
});

// Lightweight health check (no DB access) — used by Render / load balancers
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// --- Exchange Rate with 1h cache ---
const EXCHANGE_CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour
let exchangeCache = { rate: null, date: null, fetchedAt: 0 };

async function getBynToUsdRate() {
  const now = Date.now();
  if (exchangeCache.rate && (now - exchangeCache.fetchedAt) < EXCHANGE_CACHE_TTL_MS) {
    return { ...exchangeCache, cached: true };
  }
  try {
    const r = await axios.get('https://api.exchangerate.host/latest?base=BYN&symbols=USD', { timeout: 4000 });
    const rate = r.data?.rates?.USD;
    if (!rate) throw new Error('No rate available');
    exchangeCache = { rate, date: r.data.date || null, fetchedAt: now };
    return { ...exchangeCache, cached: false };
  } catch (error) {
    logger.warn('Exchange rate fetch failed, using fallback:', error.message || error);
    const fallback = parseFloat(process.env.BYN_USD_RATE) || 0.38;
    return { rate: fallback, date: null, fetchedAt: now, cached: false, fallback: true };
  }
}

// API: Exchange Rate (BYN -> USD)
app.get('/api/exchange-rate', async (req, res) => {
  const data = await getBynToUsdRate();
  res.json({ success: !data.fallback, rate: data.rate, date: data.date, cached: data.cached });
});

// Rate limiter for /api/analyze (20 req / 5 min per IP)
const analyzeLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, error: 'Too many requests, try again later' },
});

// Block private / loopback hosts to prevent SSRF
function isUnsafeHost(hostname) {
  if (!hostname) return true;
  const h = hostname.toLowerCase();
  if (h === 'localhost' || h.endsWith('.local')) return true;
  // IPv4 loopback / private ranges
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(h);
  if (ipv4) {
    const [a, b] = ipv4.slice(1).map(Number);
    if (a === 10 || a === 127 || (a === 169 && b === 254) ||
        (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) ||
        a === 0) return true;
  }
  // IPv6 loopback / link-local / unique-local
  if (h === '::1' || h.startsWith('fe80:') || h.startsWith('fc') || h.startsWith('fd')) return true;
  return false;
}

// API: Analyze Site
app.post('/api/analyze', analyzeLimiter, async (req, res) => {
  let { url } = req.body;
  if (!url || typeof url !== 'string') return res.status(400).json({ success: false, error: 'URL is required' });

  url = url.trim();
  if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

  let parsed;
  try {
    parsed = new URL(url);
  } catch {
    return res.status(400).json({ success: false, error: 'Invalid URL' });
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return res.status(400).json({ success: false, error: 'Only http/https supported' });
  }
  if (isUnsafeHost(parsed.hostname)) {
    return res.status(400).json({ success: false, error: 'Host not allowed' });
  }

  try {
    const startTime = Date.now();
    const response = await axios.get(url, {
      timeout: 5000,
      maxRedirects: 3,
      maxContentLength: 2 * 1024 * 1024, // 2 MB cap
      headers: { 'User-Agent': 'MironPortfolioAnalyzer/1.0' },
      validateStatus: (s) => s >= 200 && s < 400,
    });
    const responseTime = Date.now() - startTime;

    const finalUrl = response.request?.res?.responseUrl || url;
    const $ = cheerio.load(response.data);
    const hasHttps = finalUrl.startsWith('https');
    const titleText = $('title').first().text().trim();
    const hasTitle = titleText.length > 0;
    const hasDescription = ($('meta[name="description"]').attr('content') || '').trim().length > 0;

    res.json({
      success: true,
      url: finalUrl,
      has_https: hasHttps,
      has_title: hasTitle,
      has_description: hasDescription,
      response_time_ms: responseTime,
    });
  } catch (error) {
    logger.error(`Analyzer Error for ${url}:`, error.message);
    res.json({ success: false, error: error.message, message: 'Сайт недоступен или ответил с ошибкой' });
  }
});

// API: Submit Lead directly from Mini App Analyzer/Calculator
app.post('/api/submit_lead', telegramAuth, async (req, res) => {
  const { telegram_username, project_type, design, database, integrations, total_byn } = req.body;
  const adminId = ADMIN_ID;

  if (!adminId) {
    return res.status(500).json({ error: 'ADMIN_ID is not configured' });
  }

  const msg = `🚨 **Новая заявка из Mini App!** 🚨\n\n` +
    `👤 Клиент: @${telegram_username || 'Скрыт'}\n` +
    `🔧 Раздел/Проект: ${project_type || 'Н/Д'}\n\n` +
    `Подробности:\n` +
    `🎨 Дизайн: ${design || 'Н/Д'}\n` +
    `💾 База Данных: ${database ? 'Да' : 'Нет'}\n` +
    `🔗 Интеграции: ${integrations ? 'Да' : 'Нет'}\n\n` +
    `💰 **Сумма:** $${total_byn || 0}`;

  try {
    await bot.api.sendMessage(adminId, msg, { parse_mode: 'Markdown' });
    res.json({ success: true });
  } catch (error) {
    logger.error('Failed to submit lead to admin:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// --- STATIC FILES & SPA ---
const frontendDir = join(__dirname, '../../frontend/dist');

if (existsSync(frontendDir)) {
  app.use(express.static(frontendDir));
  app.get(/^(?!\/api|\/webhook)/, (req, res) => {
    res.sendFile(join(frontendDir, 'index.html'));
  });
} else {
  logger.warn('⚠️ Frontend dist folder not found! API only mode.');
  // If frontend isn't bundled here (we deploy frontend separately),
  // redirect root and other non-API routes to the frontend app URL.
  const frontendUrl = process.env.FRONTEND_URL || 'https://portfolio-omega-coral-1l3zceejud.vercel.app';
  app.get('/', (req, res) => res.redirect(frontendUrl));
  app.get(/^(?!\/api|\/webhook)/, (req, res) => res.redirect(frontendUrl));
}

// --- SERVER START ---
const PORT = process.env.PORT || 3000;

// Ensure the persistent chat menu button next to the input field opens the Mini
// App. This affects ALL existing and future chats with the bot — it's a global
// default. Safe to call on every startup (Telegram is idempotent here).
async function ensureMenuButton() {
  const url = process.env.FRONTEND_URL;
  if (!url || !url.startsWith('https://')) {
    logger.warn('⚠️ FRONTEND_URL is not https; skipping menu button setup.');
    return;
  }
  try {
    await bot.api.setChatMenuButton({
      menu_button: {
        type: 'web_app',
        text: 'Dashboard',
        web_app: { url },
      },
    });
    logger.info(`🎛️ Menu button → ${url}`);
  } catch (err) {
    logger.error('Failed to set chat menu button:', err);
  }
}

async function startServer() {
  // grammY requires bot.init() before handleUpdate can be called in webhook mode
  await bot.init();
  logger.info(`🤖 Bot initialized: @${bot.botInfo.username}`);

  // Configure persistent Main Menu button (opens Mini App).
  await ensureMenuButton();

  if (process.env.NODE_ENV === 'production') {
    // Respond to Telegram immediately, then process update asynchronously
    app.post('/webhook', (req, res) => {
      res.sendStatus(200);
      try {
        const u = req.body || {};
        const summary = { update_id: u.update_id };
        if (u.message) {
          const m = u.message;
          summary.type = 'message';
          summary.text = typeof m.text === 'string' ? m.text.slice(0, 200) : undefined;
          summary.from = m.from && (m.from.username ? `@${m.from.username}` : `id:${m.from.id}`);
          summary.chat = m.chat && m.chat.id;
        } else if (u.callback_query) {
          summary.type = 'callback_query';
          summary.data = u.callback_query.data;
          summary.from = u.callback_query.from && (u.callback_query.from.username ? `@${u.callback_query.from.username}` : `id:${u.callback_query.from.id}`);
        } else {
          summary.type = Object.keys(u)[0] || 'unknown';
        }
        logger.info('🔔 Webhook update received', summary);
        void bot.handleUpdate(req.body).catch(err => logger.error('Async update handling error:', err));
      } catch (err) {
        logger.error('Failed to schedule update handling:', err);
      }
    });
    logger.info('🌐 Webhook mode enabled (async)');
  } else {
    bot.start();
    logger.info('🤖 Polling mode enabled');
  }

  app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT}`);
  });
}

startServer().catch(err => {
  logger.error('Fatal startup error:', err);
  process.exit(1);
});

// Graceful Shutdown
async function shutdown(signal) {
  logger.info(`🛑 ${signal} received. Shutting down...`);
  try { await prisma.$disconnect(); } catch (e) { /* ignore */ }
  process.exit(0);
}
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
