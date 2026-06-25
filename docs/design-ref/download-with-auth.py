import requests
import urllib.parse
import os
import hashlib
import time

api_base = "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image"
out_dir = r"c:\Users\Administrator\Desktop\star-citizen-promotion\docs\design-ref"

# Read JWT token
with open(r"c:\Users\Administrator\.trae-cn\trae-jwt-token", 'r') as f:
    jwt_token = f.read().strip()

print(f"JWT token loaded (length: {len(jwt_token)})")

sections = [
    ("section-1-hero.png", "Ultra premium dark sci-fi website hero section, full-bleed deep space nebula background with dramatic blue and purple cosmic clouds, massive bold white text STELLAR NEXUS positioned at bottom center in compressed display font, small cyan label STAR CITIZEN GUILD above title, subtle radial cyan glow emanating from behind text, floating glass navigation bar at top with pill shape, single scroll indicator arrow at bottom, cinematic dark vignette overlay, awwwards quality, OLED black theme with electric cyan and amber accents, professional AAA gaming website"),
    ("section-2-fleet.png", "Premium dark sci-fi website fleet showcase section, asymmetric bento grid layout on OLED black background, left side shows large spaceship image card with double-bezel glass frame and cyan glow border, right side shows two smaller stacked cards with ship stats in large white numbers and cyan labels, dramatic amber accent line on left edge, subtle noise texture overlay, awwwards quality, Star Citizen themed, electric cyan and amber on deep black"),
    ("section-3-stats.png", "Premium dark sci-fi website metrics section, horizontal strip of 4 oversized numbers on OLED black background with subtle radial gradient glow, numbers in massive bold white font, small cyan uppercase labels below each number, thin cyan horizontal line above numbers, generous whitespace, awwwards quality, Star Citizen themed dashboard, cinematic dark theme"),
    ("section-4-pilot.png", "Premium dark sci-fi website pilot showcase section, editorial split layout, left side shows dramatic pilot portrait with amber rim light and dark background, right side shows pilot name GHOST-1 in massive white text, cyan callsign below, ship details with progress bars in amber, double-bezel card frame with glass effect, subtle scan line texture, awwwards quality, Star Citizen character profile, cinematic dark theme"),
    ("section-5-gallery.png", "Premium dark sci-fi website ship gallery section, 4 ship cards in asymmetric grid on OLED black background, each card has large spaceship image with cyan holographic glow, ship name in white bold, role badge in amber, readiness progress bar at bottom with cyan fill, cards have double-bezel glass frames with subtle border glow, awwwards quality, Star Citizen fleet display, cinematic dark theme"),
    ("section-6-dossier.png", "Premium dark sci-fi about page section, left side shows three dossier cards stacked vertically with DOSSIER labels in electric cyan, large watermark numbers in background, right side shows sticky data panel with massive statistics in white with cyan accent labels, vertical cyan data-flow line between columns, subtle noise texture, awwwards quality, Star Citizen organization profile, OLED black theme"),
    ("section-7-terminal.png", "Premium dark sci-fi recruitment page section, left sidebar shows requirements checklist with cyan checkmarks and numbered process flow with amber step circles, right side shows large terminal-style application form with dark glass card frame, TERMINAL ACTIVE status in green, input fields with bottom-border cyan style, submit button with amber accent, subtle scan lines overlay, awwwards quality, Star Citizen enlistment terminal, OLED black theme"),
    ("section-8-contact-footer.png", "Premium dark sci-fi contact page and footer section, left side shows communication channels with Discord Email QQ icons in electric cyan, right side shows message form in double-bezel glass card, bottom footer with STELLAR NEXUS logo in white and cyan, navigation links, amber accent line separator, subtle star particles in background, awwwards quality, Star Citizen comm terminal, OLED black theme"),
]

session = requests.Session()
session.headers.update({
    'Authorization': f'Bearer {jwt_token}',
    'Cookie': f'trae_jwt_token={jwt_token}',
})

default_md5 = "19a0b822edb11957055e4588c2159058"

for filename, prompt in sections:
    encoded = urllib.parse.quote(prompt)
    url = f"{api_base}?prompt={encoded}&image_size=landscape_16_9"
    out_path = os.path.join(out_dir, filename)

    print(f"\nProcessing {filename}...")

    try:
        resp = session.get(url, timeout=120, allow_redirects=False)
        print(f"  Status: {resp.status_code}")

        if resp.status_code in (301, 302, 303, 307, 308):
            location = resp.headers.get('Location', '')
            is_default = 'default.jpeg' in location
            print(f"  Redirect to: {location[:100]}...")
            print(f"  Is default: {is_default}")

            if not is_default:
                # Download the real image
                img_resp = requests.get(location, timeout=120)
                with open(out_path, 'wb') as f:
                    f.write(img_resp.content)
                md5 = hashlib.md5(img_resp.content).hexdigest()
                print(f"  Downloaded: {len(img_resp.content)} bytes, MD5: {md5}")
            else:
                print(f"  Still getting default - auth may not work via header")
                # Try with cookie
                img_resp = requests.get(location, timeout=120)
                with open(out_path, 'wb') as f:
                    f.write(img_resp.content)
                md5 = hashlib.md5(img_resp.content).hexdigest()
                print(f"  Downloaded default: {len(img_resp.content)} bytes")
        else:
            # Direct response - might be the image itself
            content_type = resp.headers.get('Content-Type', '')
            print(f"  Content-Type: {content_type}")
            if 'image' in content_type:
                with open(out_path, 'wb') as f:
                    f.write(resp.content)
                md5 = hashlib.md5(resp.content).hexdigest()
                is_default = md5 == default_md5
                print(f"  Direct image: {len(resp.content)} bytes, Default: {is_default}")
            else:
                print(f"  Body: {resp.text[:200]}")
    except Exception as e:
        print(f"  FAILED: {e}")

    time.sleep(2)

# Verify
print("\n\nFinal verification:")
for filename, _ in sections:
    path = os.path.join(out_dir, filename)
    if os.path.exists(path):
        size = os.path.getsize(path)
        with open(path, 'rb') as f:
            data = f.read()
        md5 = hashlib.md5(data).hexdigest()
        is_default = md5 == default_md5
        status = "DEFAULT" if is_default else "UNIQUE"
        print(f"  {filename}: {size} bytes, {status}")
    else:
        print(f"  {filename}: MISSING")
