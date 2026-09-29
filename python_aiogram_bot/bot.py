import asyncio
import logging
from aiogram import Bot, Dispatcher
from aiogram.enums import ParseMode
from aiogram.filters import CommandStart
from aiogram.types import Message, InlineKeyboardMarkup, InlineKeyboardButton, WebAppInfo
from config import BOT_TOKEN, WEBAPP_URL, ADMIN_ID

# Initialize bot and dispatcher
bot = Bot(token=BOT_TOKEN)
dp = Dispatcher()

# WebApp setup
web_app = WebAppInfo(url=WEBAPP_URL)

@dp.message(CommandStart())
async def command_start_handler(message: Message) -> None:
    """
    This handler receives messages with `/start` command
    """
    markup = InlineKeyboardMarkup(inline_keyboard=[
        [InlineKeyboardButton(text="🚀 Открыть портфолио", web_app=web_app)],
        [InlineKeyboardButton(text="📩 Связаться со мной", url="https://t.me/deveIoper1")]
    ])
    
    welcome_text = (
        f"👋 Привет, {message.from_user.first_name}!\n\n"
        f"Я — бот-портфолио **@deveIoper1**. Здесь ты можешь:\n"
        f"🔹 Посмотреть мои лучшие Full-Stack кейсы\n"
        f"🔹 Рассчитать стоимость своего проекта (в $)\n"
        f"🔹 Сделать быстрый SEO-аудит (Анализатор сайтов)\n\n"
        f"Нажми кнопку ниже, чтобы запустить Mini App 👇"
    )

    await message.answer(welcome_text, reply_markup=markup, parse_mode=ParseMode.MARKDOWN)

async def main() -> None:
    """
    Entry point for the aiogram bot long-polling
    """
    logging.info("Starting Telegram Bot...")
    await dp.start_polling(bot)

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    asyncio.run(main())