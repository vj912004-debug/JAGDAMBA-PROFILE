import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

# List all databases
cmd = 'sudo -u postgres psql -tAc "SELECT datname FROM pg_database WHERE datistemplate = false;"'
print(">>>", cmd)
_, o, _ = c.exec_command(cmd)
dbs = o.read().decode('utf-8', errors='replace').strip().split('\n')
dbs = [d.strip() for d in dbs if d.strip()]
print("Databases found:", dbs)

# For each database, check table erp_data and get row count and size
for db in dbs:
    print(f"\n--- Checking database: {db} ---")
    # check tables
    cmd_tables = f'sudo -u postgres psql -d {db} -tAc "\\dt"'
    _, o_tables, _ = c.exec_command(cmd_tables)
    tables_out = o_tables.read().decode('utf-8', errors='replace').strip()
    print("Tables:\n", tables_out)
    
    if 'erp_data' in tables_out:
        # check rows
        cmd_rows = f"sudo -u postgres psql -d {db} -c \"SELECT id, version, updated_at, pg_column_size(data) as size_bytes FROM erp_data;\""
        _, o_rows, _ = c.exec_command(cmd_rows)
        print(o_rows.read().decode('utf-8', errors='replace').strip())

c.close()
