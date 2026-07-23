import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

cmd = "ls -lhS /var/lib/postgresql/16/main/base/16384/"
print(">>>", cmd)
_, o, _ = c.exec_command(cmd)
print(o.read().decode('utf-8', errors='replace').strip())

c.close()
