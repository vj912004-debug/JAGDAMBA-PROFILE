import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

cmds = [
    # 1. List all databases
    'sudo -u postgres psql -c "\\l"',
    # 2. List all tables in jagdamba_final
    'sudo -u postgres psql -d jagdamba_final -c "\\dt"',
    # 3. List all rows/ids in erp_data in jagdamba_final
    'sudo -u postgres psql -d jagdamba_final -c "SELECT id, version, updated_at FROM erp_data;"',
    # 4. Check if there are other databases and check their tables/rows
    'sudo -u postgres psql -tAc "SELECT datname FROM pg_database WHERE datistemplate = false;"',
    # 5. Check size and description of erp_data table
    'sudo -u postgres psql -d jagdamba_final -c "\\d erp_data"',
    # 6. Check if there are pg_dump backup files on the system
    'find / -name "*.sql" -o -name "*.dump" -o -name "*.bak" 2>/dev/null | grep -E "jagdamba|postgres|backup|db|dump" || true',
    # 7. Check local storage / server files for backup json files
    'find /root -name "*.json" 2>/dev/null | grep -i "erp" || true',
]

for cmd in cmds:
    print('\n>>>', cmd)
    _, o, e = c.exec_command(cmd, timeout=90)
    out = o.read().decode('utf-8', errors='replace')
    err = e.read().decode('utf-8', errors='replace')
    if out.strip():
        print(out.strip())
    if err.strip():
        print('ERR:', err.strip())

# If database has other names, check them
print('\nChecking other databases specifically...')
_, o, _ = c.exec_command('sudo -u postgres psql -tAc "SELECT datname FROM pg_database WHERE datistemplate = false;"')
dbs = o.read().decode('utf-8', errors='replace').strip().split('\n')
for db in dbs:
    db = db.strip()
    if db and db != 'postgres' and db != 'jagdamba_final':
        print(f'\n--- Database: {db} ---')
        _, o, _ = c.exec_command(f'sudo -u postgres psql -d {db} -c "\\dt"')
        print(o.read().decode('utf-8', errors='replace').strip())
        _, o, _ = c.exec_command(f'sudo -u postgres psql -d {db} -c "SELECT id, version, updated_at FROM erp_data;" 2>/dev/null || true')
        print(o.read().decode('utf-8', errors='replace').strip())

c.close()
