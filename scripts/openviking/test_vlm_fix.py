
import asyncio
import logging
import sys
from pathlib import Path

# Add the .venv site-packages to path
venv_path = Path(r"f:\proje\grenzwanderer\Grenzwanderer\scripts\openviking\.venv\Lib\site-packages")
sys.path.insert(0, str(venv_path))

from openviking.models.vlm.backends.google_vlm import GoogleVLM

async def test():
    config = {
        "provider": "google",
        "api_key": "ya29.fake-token", # doesn't matter for URL verification
        "model": "gemini-1.5-flash",
        "api_base": ""
    }
    vlm = GoogleVLM(config)
    print(f"VLM api_base: {vlm.api_base}")
    url = vlm._get_url("gemini-1.5-flash")
    print(f"Generated URL: {url}")
    
    if "v1beta" in url:
        print("FAIL: Still using v1beta!")
    else:
        print("SUCCESS: Using v1/")

if __name__ == "__main__":
    asyncio.run(test())
