import logging
from bs4 import BeautifulSoup
import requests
import time
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Dict, Any

from bot import bot # assuming aiogram bot instance
from config import ADMIN_ID

app = FastAPI(title="Miron Portfolio API")

class AnalyzerRequest(BaseModel):
    url: str

class CalculatorLeadRequest(BaseModel):
    telegram_username: str
    project_type: str
    design: str
    database: bool
    integrations: bool
    total_byn: int

@app.post("/analyze")
async def analyze_site(req: AnalyzerRequest) -> Dict[str, Any]:
    url = req.url
    if not url.startswith('http'):
         url = 'https://' + url
         
    try:
        start_time = time.time()
        response = requests.get(url, timeout=5)
        response_time = round((time.time() - start_time) * 1000)
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        has_https = response.url.startswith('https')
        has_title = soup.title is not None and len(soup.title.text) > 0
        has_description = soup.find("meta", {"name": "description"}) is not None
        
        return {
            "success": True,
            "url": response.url,
            "has_https": has_https,
            "has_title": has_title,
            "has_description": has_description,
            "response_time_ms": response_time
        }

    except Exception as e:
        logging.error(f"Analyzer error: {e}")
        return {"success": False, "error": str(e), "message": "Сайт недоступен или ответил с ошибкой"}

@app.post("/submit_lead")
async def submit_lead(req: CalculatorLeadRequest):
    """
    Submits a lead directly to the admin via Telegram Bot (aiogram).
    """
    if not ADMIN_ID:
        raise HTTPException(status_code=500, detail="Admin ID not configured")
        
    lead_text = (
        f"🚨 **Новая заявка с калькулятора!** 🚨\n\n"
        f"👤 Клиент: @{req.telegram_username}\n"
        f"🔧 Тип проекта: {req.project_type}\n"
        f"🎨 Дизайн: {req.design}\n"
        f"💾 База Данных: {'Да' if req.database else 'Нет'}\n"
        f"🔗 Интеграции: {'Да' if req.integrations else 'Нет'}\n\n"
        f"💰 **Сумма:** ${req.total_byn}"
    )
    
    try:
        await bot.send_message(chat_id=int(ADMIN_ID), text=lead_text, parse_mode="Markdown")
        return {"success": True}
    except Exception as e:
        logging.error(f"Bot failed to send message: {e}")
        raise HTTPException(status_code=500, detail="Failed to notify admin.")