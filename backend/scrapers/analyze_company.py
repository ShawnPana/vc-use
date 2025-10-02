from browser_use_sdk import BrowserUse
from dotenv import load_dotenv, find_dotenv
import os

print("loading .env from", find_dotenv())
load_dotenv()

client = BrowserUse(api_key=os.getenv("BROWSER_USE_API_KEY"))