import asyncio
import logging
from uvicorn import Config, Server
import multiprocessing
from bot import main as bot_main
from api import app

def run_api():
    config = Config(app, host="0.0.0.0", port=8000, log_level="info")
    server = Server(config=config)
    server.run()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    
    # Run FastAPI in a separate process
    # so it does not block the aiogram long-polling loop
    api_process = multiprocessing.Process(target=run_api)
    api_process.start()
    
    try:
        # Start Telegram Bot Long-Polling
        asyncio.run(bot_main())
    except KeyboardInterrupt:
        api_process.terminate()
        api_process.join()