import urllib.request
import urllib.parse
import hashlib

api_base = "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image"

class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None

opener = urllib.request.build_opener(NoRedirectHandler)

prompts = [
    "test",
    "dark sci-fi",
    "dark sci-fi hero section",
    "dark sci-fi hero section with nebula",
    "dark sci-fi hero section with space nebula background",
    "dark sci-fi hero section with space nebula background and STELLAR NEXUS text",
    "Ultra premium dark sci-fi website hero section with space nebula and STELLAR NEXUS text and cyan glow",
    "Ultra premium dark sci-fi website hero section, full-bleed deep space nebula background with dramatic blue and purple cosmic clouds, massive bold white text STELLAR NEXUS",
]

for prompt in prompts:
    encoded = urllib.parse.quote(prompt)
    url = f"{api_base}?prompt={encoded}&image_size=landscape_16_9"
    req = urllib.request.Request(url)
    try:
        opener.open(req, timeout=30)
        print(f"  [{len(prompt):3d} chars] No redirect")
    except urllib.error.HTTPError as e:
        location = e.headers.get('Location', 'NONE')
        is_default = 'default.jpeg' in location
        code = e.code
        print(f"  [{len(prompt):3d} chars] Code={code}, Default={is_default}, URL={location[:80]}")
