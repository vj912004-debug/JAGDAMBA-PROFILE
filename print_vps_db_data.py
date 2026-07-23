import paramiko
import json
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

cmd = "sudo -u postgres psql -d jagdamba_final -t -A -c \"SELECT data FROM erp_data WHERE id='main';\""
_, o, e = c.exec_command(cmd)
out = o.read().decode('utf-8', errors='replace').strip()

if out:
    try:
        data = json.loads(out)
        print("KEYS IN DATA:")
        for k, v in data.items():
            if isinstance(v, list):
                print(f"  {k}: list of length {len(v)}")
                if len(v) > 0:
                    print(f"    first item: {json.dumps(v[0])[:150]}")
            else:
                print(f"  {k}: {type(v).__name__} = {json.dumps(v)[:100]}")
    except Exception as ex:
        print("Error parsing JSON:", ex)
        print("Raw output first 500 chars:", out[:500])
else:
    print("No output from query.")

c.close()
