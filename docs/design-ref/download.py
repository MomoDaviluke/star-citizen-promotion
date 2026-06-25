import urllib.request
import urllib.parse
import json
import os
import hashlib

out_dir = r"c:\Users\Administrator\Desktop\star-citizen-promotion\docs\design-ref"
api_base = "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image"

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

class NoRedirectHandler(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        return None  # Don't follow redirects

opener_no_redirect = urllib.request.build_opener(NoRedirectHandler)

for filename, prompt in sections:
    encoded_prompt = urllib.parse.quote(prompt)
    url = f"{api_base}?prompt={encoded_prompt}&image_size=landscape_16_9"
    out_path = os.path.join(out_dir, filename)

    print(f"Processing {filename}...")

    try:
        req = urllib.request.Request(url)
        # Try without following redirects
        try:
            response = opener_no_redirect.open(req, timeout=30)
            # If we get here, no redirect happened - save directly
            data = response.read()
            with open(out_path, 'wb') as f:
                f.write(data)
            print(f"  Direct response: {len(data)} bytes")
        except urllib.error.HTTPError as e:
            # Redirect - get Location header
            location = e.headers.get('Location', '')
            print(f"  Redirect to: {location}")

            if 'default.jpeg' in location:
                print(f"  WARNING: Got default placeholder image")
                # Still download it for now
                response = urllib.request.urlopen(location, timeout=120)
                data = response.read()
                with open(out_path, 'wb') as f:
                    f.write(data)
                print(f"  Downloaded default: {len(data)} bytes")
            else:
                # Download the real image
                response = urllib.request.urlopen(location, timeout=120)
                data = response.read()
                with open(out_path, 'wb') as f:
                    f.write(data)
                print(f"  Downloaded: {len(data)} bytes")
    except Exception as e:
        print(f"  FAILED: {e}")

# Verify
print("\nFinal verification:")
for filename, _ in sections:
    path = os.path.join(out_dir, filename)
    if os.path.exists(path):
        size = os.path.getsize(path)
        with open(path, 'rb') as f:
            header = f.read(8)
        is_jpeg = header[0] == 0xFF and header[1] == 0xD8
        md5 = hashlib.md5(open(path, 'rb').read()).hexdigest()
        print(f"  {filename}: {size} bytes, JPEG={is_jpeg}, MD5={md5}")
    else:
        print(f"  {filename}: MISSING")
