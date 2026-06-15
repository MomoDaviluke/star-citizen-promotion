import requests

api_base = "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image"

# Check the 302 response body
session = requests.Session()
resp = session.get(f"{api_base}?prompt=dark+sci-fi+hero&image_size=landscape_16_9", allow_redirects=False, timeout=30)
print(f"Status: {resp.status_code}")
print(f"Headers: {dict(resp.headers)}")
print(f"Body: {resp.text}")
print(f"Body bytes: {resp.content}")

# Also check the "test" prompt response body
resp2 = session.get(f"{api_base}?prompt=test&image_size=landscape_16_9", allow_redirects=False, timeout=30)
print(f"\nTest prompt:")
print(f"Status: {resp2.status_code}")
print(f"Body: {resp2.text}")
print(f"Body bytes: {resp2.content}")
