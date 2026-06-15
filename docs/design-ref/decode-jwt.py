import base64
import json

with open(r"c:\Users\Administrator\.trae-cn\trae-jwt-token", 'r') as f:
    token = f.read().strip()

# Decode JWT payload
parts = token.split('.')
payload = parts[1]
# Add padding
payload += '=' * (4 - len(payload) % 4)
decoded = base64.urlsafe_b64decode(payload)
data = json.loads(decoded)
print(json.dumps(data, indent=2))

# Check expiration
import time
exp = data.get('exp', 0)
now = int(time.time())
remaining = exp - now
print(f"\nToken expires at: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(exp))}")
print(f"Current time: {time.strftime('%Y-%m-%d %H:%M:%S', time.localtime(now))}")
print(f"Remaining: {remaining} seconds ({remaining/3600:.1f} hours)")
print(f"Token expired: {remaining < 0}")
