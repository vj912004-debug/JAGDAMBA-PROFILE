import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

cmd = "sudo -u postgres psql -d jagdamba_final -c \"SELECT schemaname, tablename, tableowner FROM pg_tables WHERE schemaname NOT IN ('pg_catalog', 'information_schema');\""
print(">>>", cmd)
_, o, _ = c.exec_command(cmd)
print(o.read().decode('utf-8', errors='replace').strip())

c.close()
