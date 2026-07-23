import urllib.request
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

print("Testing HTTP to jagdambaprofile.tech...")
try:
    with urllib.request.urlopen("https://jagdambaprofile.tech/", timeout=5, context=ctx) as response:
        print("Status Code:", response.getcode())
        print("Headers:", dict(response.info()))
except Exception as e:
    print("Error:", e)
