import requests
import json
import os
import hashlib

api_base = "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image"
out_dir = r"c:\Users\Administrator\Desktop\star-citizen-promotion\docs\design-ref"

session = requests.Session()

# Test 1: POST with JSON body
print("Test 1: POST with JSON body")
try:
    resp = session.post(api_base, json={
        "prompt": "dark sci-fi hero",
        "image_size": "landscape_16_9"
    }, timeout=30, allow_redirects=False)
    print(f"  Status: {resp.status_code}")
    print(f"  Body: {resp.text[:200]}")
except Exception as e:
    print(f"  Error: {e}")

# Test 2: POST with form data
print("\nTest 2: POST with form data")
try:
    resp = session.post(api_base, data={
        "prompt": "dark sci-fi hero",
        "image_size": "landscape_16_9"
    }, timeout=30, allow_redirects=False)
    print(f"  Status: {resp.status_code}")
    print(f"  Body: {resp.text[:200]}")
except Exception as e:
    print(f"  Error: {e}")

# Test 3: GET with different parameter names
print("\nTest 3: GET with 'q' parameter")
try:
    resp = session.get(f"{api_base}?q=dark+sci-fi+hero&image_size=landscape_16_9", timeout=30, allow_redirects=False)
    print(f"  Status: {resp.status_code}")
    if resp.status_code in (301, 302):
        loc = resp.headers.get('Location', '')
        is_default = 'default.jpeg' in loc
        print(f"  Location: {loc[:100]}, Default: {is_default}")
    else:
        print(f"  Body: {resp.text[:200]}")
except Exception as e:
    print(f"  Error: {e}")

# Test 4: Check if there's a different endpoint
print("\nTest 4: Check /api/ide/v1/ endpoints")
for endpoint in ["text_to_image", "image/generate", "generate", "images/generations"]:
    url = f"https://trae-api-cn.mchost.guru/api/ide/v1/{endpoint}?prompt=test&image_size=landscape_16_9"
    try:
        resp = session.get(url, timeout=10, allow_redirects=False)
        print(f"  {endpoint}: Status={resp.status_code}")
    except Exception as e:
        print(f"  {endpoint}: Error={e}")
