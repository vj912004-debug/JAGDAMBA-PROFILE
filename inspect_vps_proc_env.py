import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

# Get the process ID of the running backend api
_, o, _ = c.exec_command('pgrep -f "backend/src/index.js"')
pid = o.read().decode('utf-8', errors='replace').strip()

if pid:
    print(f"Running API PID: {pid}")
    cmd = f"cat /proc/{pid}/environ | tr '\\0' '\\n' | grep -E 'DATABASE|PORT'"
    print(f"\n>>> {cmd}")
    _, o, e = c.exec_command(cmd)
    print(o.read().decode('utf-8', errors='replace').strip())
else:
    print("API process not found running by pgrep")

c.close()
