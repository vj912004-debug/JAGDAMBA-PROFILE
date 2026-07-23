import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

# Check the actual database content
cmds = [
    # Row counts in erp_data table
    "sudo -u postgres psql -d jagdamba_final -c \"SELECT id, version, created_at, updated_at, length(data::text) as data_len FROM erp_data ORDER BY updated_at DESC LIMIT 5;\"",
    # Check data content - just keys
    "sudo -u postgres psql -d jagdamba_final -c \"SELECT id, version, updated_at, jsonb_object_keys(data) as key FROM erp_data ORDER BY id LIMIT 50;\"",
]
for cmd in cmds:
    print('>>>', cmd[:80])
    _, o, e = c.exec_command(cmd, timeout=60)
    print(o.read().decode('utf-8', errors='replace').strip())
    print()
c.close()
