import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

cmds = [
    'sudo -u postgres psql -d jagdamba_final -c "SELECT schema_name FROM information_schema.schemata;"',
    'sudo -u postgres psql -d jagdamba_final -c "SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN (\'pg_catalog\', \'information_schema\');"',
    'sudo -u postgres psql -d jagdamba_final -c "SELECT * FROM erp_data LIMIT 1;"',
]

for cmd in cmds:
    print('\n>>>', cmd)
    _, o, e = c.exec_command(cmd, timeout=90)
    out = o.read().decode('utf-8', errors='replace')
    if out.strip():
        print(out.strip())

c.close()
