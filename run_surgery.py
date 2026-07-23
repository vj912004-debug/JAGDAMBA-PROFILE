import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

cmds = [
    # 1. Create pg_surgery extension if not exists
    "sudo -u postgres psql -d jagdamba_final -c \"CREATE EXTENSION IF NOT EXISTS pg_surgery;\"",
    
    # 2. Freeze the old toast chunks to make them visible and active
    "sudo -u postgres psql -d jagdamba_final -c \"SELECT heap_force_freeze('pg_toast.pg_toast_16402', ARRAY['(7,1)', '(7,2)', '(7,3)']::tid[]);\"",
    
    # 3. Freeze the old main row in erp_data (pointing to 17197) at TID (2,26)
    "sudo -u postgres psql -d jagdamba_final -c \"SELECT heap_force_freeze('erp_data', ARRAY['(2,26)']::tid[]);\"",
    
    # 4. Kill the current empty main row at TID (2,32)
    "sudo -u postgres psql -d jagdamba_final -c \"SELECT heap_force_kill('erp_data', ARRAY['(2,32)']::tid[]);\"",
    
    # 5. Check if the table query now succeeds and returns recovered row
    "sudo -u postgres psql -d jagdamba_final -c \"SELECT id, version, updated_at FROM erp_data;\"",
    
    # 6. Verify row contents and lengths of arrays to confirm recovery
    "sudo -u postgres psql -d jagdamba_final -c \"SELECT id, jsonb_array_length(COALESCE(data->'orders', '[]'::jsonb)) as orders, jsonb_array_length(COALESCE(data->'challans', '[]'::jsonb)) as challans, jsonb_array_length(COALESCE(data->'purchaseOrders', '[]'::jsonb)) as purchase_orders FROM erp_data;\""
]

for cmd in cmds:
    print("\n>>>", cmd)
    _, o, e = c.exec_command(cmd)
    print(o.read().decode('utf-8', errors='replace').strip())
    err = e.read().decode('utf-8', errors='replace').strip()
    if err:
        print("ERR:", err)

c.close()
