import { PrismaClient } from '@prisma/client';
import logger from './logger.js';

// Real Prisma client (used when DB is reachable)
const realPrisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'info', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
});

realPrisma.$on('query', (e) => {
  if (process.env.NODE_ENV !== 'production') {
    logger.debug(`Query: ${e.query} Params: ${e.params} Duration: ${e.duration}ms`);
  }
});

// Lightweight in-memory fallback for development when the DB is unreachable.
// It implements the minimal `user` API used by the app: `upsert`, `update`, `count`.
const fallbackStore = {
  users: new Map(), // key: telegramId string -> user object
  nextId: 1,
};

const idToKey = (id) => {
  if (id === undefined || id === null) return null;
  try { return id.toString(); } catch (e) { return String(id); }
};

const userFacade = {
  async upsert({ where, update, create }) {
    try {
      return await realPrisma.user.upsert({ where, update, create });
    } catch (err) {
      logger.warn('Prisma user.upsert failed; using in-memory fallback', err?.message || err);
      const key = idToKey(where?.telegramId ?? where?.id ?? create?.telegramId);
      if (!key) throw new Error('Missing telegramId for upsert fallback');

      let user = fallbackStore.users.get(key);
      if (user) {
        if (update) {
          if (update.visits && typeof update.visits.increment === 'number') {
            user.visits = (user.visits || 0) + update.visits.increment;
          }
          if (Object.prototype.hasOwnProperty.call(update, 'username')) {
            user.username = update.username;
          }
        }
        fallbackStore.users.set(key, user);
        return user;
      }

      const newUser = {
        id: fallbackStore.nextId++,
        username: create?.username ?? null,
        telegramId: create?.telegramId ? BigInt(create.telegramId) : BigInt(key),
        visits: create?.visits ?? 0,
        lastVisit: new Date(),
        calcHistory: create?.calcHistory ?? null,
        isContacted: create?.isContacted ?? false,
        createdAt: new Date(),
      };
      fallbackStore.users.set(key, newUser);
      return newUser;
    }
  },

  async update({ where, data }) {
    try {
      return await realPrisma.user.update({ where, data });
    } catch (err) {
      logger.warn('Prisma user.update failed; using in-memory fallback', err?.message || err);
      const key = idToKey(where?.telegramId ?? where?.id);
      if (!key) throw new Error('Missing telegramId for update fallback');
      const user = fallbackStore.users.get(key);
      if (!user) throw new Error('User not found in fallback store');
      if (Object.prototype.hasOwnProperty.call(data, 'calcHistory')) user.calcHistory = data.calcHistory;
      if (Object.prototype.hasOwnProperty.call(data, 'isContacted')) user.isContacted = data.isContacted;
      fallbackStore.users.set(key, user);
      return user;
    }
  },

  async count(args) {
    try {
      return await realPrisma.user.count(args);
    } catch (err) {
      logger.warn('Prisma user.count failed; using in-memory fallback', err?.message || err);
      const arr = Array.from(fallbackStore.users.values());
      if (args && args.where && Object.prototype.hasOwnProperty.call(args.where, 'isContacted')) {
        return arr.filter(u => u.isContacted === args.where.isContacted).length;
      }
      return arr.length;
    }
  },
};

export default {
  user: userFacade,
  async $disconnect() {
    try { await realPrisma.$disconnect(); } catch (e) { /* ignore */ }
  }
};
