import requests
import os
import hashlib

out_dir = r"c:\Users\Administrator\Desktop\star-citizen-promotion\docs\design-ref"

# Short links from WebFetch - resolve them to get real CDN URLs
short_links = {
    "section-1-hero.png": "https://aka.doubaocdn.com/s/wwfu1waWES",
}

session = requests.Session()
session.headers.update({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
})

for filename, short_url in short_links.items():
    out_path = os.path.join(out_dir, filename)
    print(f"Processing {filename}...")

    # Don't follow redirects - get the real CDN URL
    resp = session.get(short_url, allow_redirects=False, timeout=30)
    print(f"  Status: {resp.status_code}")

    if resp.status_code in (301, 302, 303, 307, 308):
        cdn_url = resp.headers.get('Location', '')
        print(f"  CDN URL: {cdn_url[:150]}...")

        # Download from CDN
        img_resp = session.get(cdn_url, timeout=120)
        with open(out_path, 'wb') as f:
            f.write(img_resp.content)

        size = len(img_resp.content)
        md5 = hashlib.md5(img_resp.content).hexdigest()
        is_default = md5 == "19a0b822edb11957055e4588c2159058"
        print(f"  Downloaded: {size} bytes, Default: {is_default}, MD5: {md5}")
    else:
        print(f"  No redirect, status: {resp.status_code}")
