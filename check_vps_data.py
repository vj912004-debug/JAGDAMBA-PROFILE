import paramiko
import sys
import json

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

queries = [
    "SELECT id, version, updated_at, pg_column_size(data) as data_bytes FROM erp_data;",
    "SELECT id, version, jsonb_array_length(COALESCE(data->'orders','[]'::jsonb)) as orders, jsonb_array_length(COALESCE(data->'challans','[]'::jsonb)) as challans, jsonb_array_length(COALESCE(data->'purchaseOrders','[]'::jsonb)) as purchase_orders FROM erp_data;"
]

for sql in queries:
    cmd = f'sudo -u postgres psql -d jagdamba_final -c "{sql}"'
    print("\n>>>", cmd)
    _, o, e = c.exec_command(cmd)
    print(o.read().decode('utf-8', errors='replace').strip())
    err = e.read().decode('utf-8', errors='replace').strip()
    if err:
        print("ERR:", err)

c.close()
