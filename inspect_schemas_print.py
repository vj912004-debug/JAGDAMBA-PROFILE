import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

def run_cmd(cmd):
    _, o, _ = c.exec_command(cmd)
    res = o.read().decode('utf-8', errors='replace').strip()
    print(f"\n=== Result for {cmd} ===")
    print(res)

run_cmd('sudo -u postgres psql -d jagdamba_final -c "SELECT schema_name FROM information_schema.schemata;"')
run_cmd('sudo -u postgres psql -d jagdamba_final -c "SELECT table_schema, table_name FROM information_schema.tables WHERE table_schema NOT IN (\'pg_catalog\', \'information_schema\');"')

c.close()
