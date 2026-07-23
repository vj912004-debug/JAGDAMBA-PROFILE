import urllib.request
import ssl
import json

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

urls = [
    "https://jagdambaprofile.tech/api/health",
    "https://jagdambaprofile.tech/api/erp/data"
]

for url in urls:
    print(f"\nFetching: {url}")
    try:
        with urllib.request.urlopen(url, timeout=5, context=ctx) as response:
            print("Status:", response.getcode())
            body = response.read().decode('utf-8')
            try:
                data = json.loads(body)
                print(json.dumps(data, indent=2))
            except Exception:
                print("Body (not JSON):", body[:500])
    except Exception as e:
        print("Error:", e)
