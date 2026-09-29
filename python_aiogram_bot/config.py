import os
from dotenv import load_dotenv

load_dotenv()

BOT_TOKEN = os.getenv("BOT_TOKEN", "YOUR_TELEGRAM_BOT_TOKEN")
ADMIN_ID = os.getenv("ADMIN_ID", "YOUR_ADMIN_ID")
WEBAPP_URL = os.getenv("WEBAPP_URL", "https://your_ngrok_url.ngrok-free.app")