import os
from google import genai

client = genai.Client(api_key="AIzaSyAjn9SP0i0x2pJS7ZZ1r65pX6mLQKoRbcY")
for m in client.models.list():
  if "generateContent" in m.supported_generation_methods:
    print(m.name)