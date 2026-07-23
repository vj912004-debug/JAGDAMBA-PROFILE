import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

cmds = [
    "crontab -l",
    "sudo -u postgres crontab -l",
    "ls -la /etc/cron.daily/",
    "ls -la /etc/cron.hourly/"
]

for cmd in cmds:
    print("\n>>>", cmd)
    _, o, _ = c.exec_command(cmd)
    print(o.read().decode('utf-8', errors='replace').strip())

c.close()
