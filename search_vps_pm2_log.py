import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

cmd = "grep -a -o -E '.{0,100}purchaseOrders.{0,100}' /root/.pm2/logs/api-out.log | tail -n 50 || true"
print(">>>", cmd)
_, o, _ = c.exec_command(cmd)
print(o.read().decode('utf-8', errors='replace').strip())

cmd2 = "grep -a -o -E '.{0,100}challans.{0,100}' /root/.pm2/logs/api-out.log | tail -n 50 || true"
print("\n>>>", cmd2)
_, o2, _ = c.exec_command(cmd2)
print(o2.read().decode('utf-8', errors='replace').strip())

c.close()
