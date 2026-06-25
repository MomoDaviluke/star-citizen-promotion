import requests

api_base = "https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image"

with open(r"c:\Users\Administrator\.trae-cn\trae-jwt-token", 'r') as f:
    jwt_token = f.read().strip()

# Test different auth header formats
tests = [
    ("No auth", {}),
    ("Bearer", {"Authorization": f"Bearer {jwt_token}"}),
    ("Cookie trae_jwt_token", {"Cookie": f"trae_jwt_token={jwt_token}"}),
    ("X-Trae-Token", {"X-Trae-Token": jwt_token}),
    ("X-Auth-Token", {"X-Auth-Token": jwt_token}),
    ("X-JWT-Token", {"X-JWT-Token": jwt_token}),
    ("Authorization Basic", {"Authorization": f"Basic {jwt_token}"}),
]

for name, headers in tests:
    session = requests.Session()
    session.headers.update(headers)
    try:
        resp = session.get(f"{api_base}?prompt=dark+hero&image_size=landscape_16_9", timeout=30, allow_redirects=False)
        location = resp.headers.get('Location', 'NONE')
        is_default = 'default.jpeg' in location
        body = resp.text[:100] if resp.text else ''
        print(f"{name:30s} -> Status: {resp.status_code}, Default: {is_default}, Body: {body}")
    except Exception as e:
        print(f"{name:30s} -> Error: {e}")
