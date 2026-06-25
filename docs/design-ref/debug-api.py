import urllib.request
import urllib.parse

api_base = "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image"
prompt = "test"
encoded = urllib.parse.quote(prompt)
url = f"{api_base}?prompt={encoded}&image_size=landscape_16_9"

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': '*/*',
    'Referer': 'https://www.trae.com/',
}

class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        print(f"  Redirect {code} -> {newurl[:150]}")
        return None

opener = urllib.request.build_opener(NoRedirectHandler)

# Test 1: Without extra headers
print("Test 1: No extra headers")
req1 = urllib.request.Request(url)
try:
    opener.open(req1, timeout=30)
except urllib.error.HTTPError as e:
    print(f"  Error: {e.code}")
    print(f"  Location: {e.headers.get('Location', 'NONE')}")

# Test 2: With browser headers
print("\nTest 2: With browser headers")
req2 = urllib.request.Request(url, headers=headers)
try:
    opener.open(req2, timeout=30)
except urllib.error.HTTPError as e:
    print(f"  Error: {e.code}")
    print(f  Location: {e.headers.get('Location', 'NONE')}")

# Test 3: With long prompt, no headers
print("\nTest 3: Long prompt, no headers")
long_prompt = "Ultra premium dark sci-fi website hero section with space nebula"
encoded2 = urllib.parse.quote(long_prompt)
url2 = f"{api_base}?prompt={encoded2}&image_size=landscape_16_9"
req3 = urllib.request.Request(url2)
try:
    opener.open(req3, timeout=30)
except urllib.error.HTTPError as e:
    print(f"  Error: {e.code}")
    print(f"  Location: {e.headers.get('Location', 'NONE')}")
