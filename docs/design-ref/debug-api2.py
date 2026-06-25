import urllib.request
import urllib.parse

api_base = "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image"

class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

opener = urllib.request.build_opener(NoRedirectHandler)

# Test 1: "test" prompt
print("Test 1: prompt='test'")
url1 = f"{api_base}?prompt=test&image_size=landscape_16_9"
req1 = urllib.request.Request(url1)
try:
    opener.open(req1, timeout=30)
except urllib.error.HTTPError as e:
    loc = e.headers.get('Location', 'NONE')
    print(f"  Code: {e.code}, Location: {loc[:120]}")

# Test 2: Long prompt
print("\nTest 2: long prompt")
prompt2 = "Ultra premium dark sci-fi website hero section with space nebula"
encoded2 = urllib.parse.quote(prompt2)
url2 = f"{api_base}?prompt={encoded2}&image_size=landscape_16_9"
req2 = urllib.request.Request(url2)
try:
    opener.open(req2, timeout=30)
except urllib.error.HTTPError as e:
    loc = e.headers.get('Location', 'NONE')
    print(f"  Code: {e.code}, Location: {loc[:120]}")

# Test 3: Read the response body for test 2
print("\nTest 3: Read response body for long prompt")
try:
    opener2 = urllib.request.build_opener()
    req3 = urllib.request.Request(url2)
    resp = opener2.open(req3, timeout=120)
    data = resp.read()
    print(f"  Response size: {len(data)} bytes")
    print(f"  First bytes: {data[:20].hex()}")
except Exception as e:
    print(f"  Error: {e}")
