import crypto from 'crypto';
import logger from './logger.js';

/**
 * Валидация данных инициализации Telegram Mini App
 * @param {string} initData - Строка initData из WebApp
 * @param {string} botToken - Токен бота
 * @returns {object|null} - Данные пользователя или null, если валидация не прошла
 */
export function validateTelegramInitData(initData, botToken) {
  if (!initData) return null;

  try {
    const urlParams = new URLSearchParams(initData);
    const hash = urlParams.get('hash');
    urlParams.delete('hash');

    // Сортировка параметров по алфавиту
    const params = Array.from(urlParams.entries())
      .map(([key, value]) => `${key}=${value}`)
      .sort()
      .join('\n');

    // Создание секретного ключа
    const secretKey = crypto
      .createHmac('sha256', 'WebAppData')
      .update(botToken)
      .digest();

    // Вычисление хеша
    const calculatedHash = crypto
      .createHmac('sha256', secretKey)
      .update(params)
      .digest('hex');

    if (calculatedHash === hash) {
      const userStr = urlParams.get('user');
      return userStr ? JSON.parse(userStr) : {};
    }
    
    logger.warn('⚠️ Invalid Telegram initData hash attempt');
    return null;
  } catch (error) {
    logger.error('Error validating Telegram initData:', error);
    return null;
  }
}
