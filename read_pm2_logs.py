import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

print("=== API OUT LOG (Last 100 lines) ===")
_, o, _ = c.exec_command("tail -n 100 /root/.pm2/logs/api-out.log")
print(o.read().decode('utf-8', errors='replace').strip())

print("\n=== API ERROR LOG (Last 100 lines) ===")
_, o, _ = c.exec_command("tail -n 100 /root/.pm2/logs/api-error.log")
print(o.read().decode('utf-8', errors='replace').strip())

print("\n=== Search logs for 'save' or 'restore' ===")
_, o, _ = c.exec_command("grep -i -C 2 -E 'save|restore|backup|db|err' /root/.pm2/logs/api-out.log | tail -n 100")
print(o.read().decode('utf-8', errors='replace').strip())

c.close()
