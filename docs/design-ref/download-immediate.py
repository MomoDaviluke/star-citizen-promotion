import requests
import os
import hashlib
import re

out_dir = r"c:\Users\Administrator\Desktop\star-citizen-promotion\docs\design-ref"
default_md5 = "19a0b822edb11957055e4588c2159058"

# Short link from WebFetch
short_url = "https://aka.doubaocdn.com/s/ZKPZ1waX54"

session = requests.Session()
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
})

# Step 1: Resolve short link to CDN URL
print(f"Resolving short link: {short_url}")
resp = session.get(short_url, allow_redirects=False, timeout=30)
print(f"Status: {resp.status_code}")
if resp.status_code in (301, 302):
    cdn_url = resp.headers.get('Location', '')
    print(f"CDN URL: {cdn_url[:150]}...")

    # Step 2: Download from CDN
    img_resp = session.get(cdn_url, timeout=120)
    data = img_resp.content
    md5 = hashlib.md5(data).hexdigest()
    is_default = md5 == default_md5
    print(f"Size: {len(data)}, MD5: {md5}, Default: {is_default}")

    # Save
    out_path = os.path.join(out_dir, "section-1-hero.png")
    with open(out_path, 'wb') as f:
        f.write(data)
    print(f"Saved to: {out_path}")
else:
    print(f"Unexpected status: {resp.status_code}")
    print(f"Body: {resp.text[:200]}")
