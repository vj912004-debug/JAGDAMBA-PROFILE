import paramiko
import base64
import sys
import re

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

# Get the base64 content
_, o, _ = c.exec_command("cat /tmp/toast_chunk_17197.b64")
b64_content = o.read().decode('utf-8', errors='replace')

# Clean base64 content
cleaned = re.sub(r'[^a-zA-Z0-9+/=]', '', b64_content)
# Add padding if necessary
padding = len(cleaned) % 4
if padding:
    cleaned += '=' * (4 - padding)

try:
    decoded = base64.b64decode(cleaned)
    print("Decoded length:", len(decoded))
    print("First 300 bytes (as repr):")
    print(repr(decoded[:300]))
    print("\nFirst 300 bytes (decoded as ascii):")
    print(decoded[:300].decode('ascii', errors='replace'))
except Exception as e:
    print("Error:", e)

c.close()
