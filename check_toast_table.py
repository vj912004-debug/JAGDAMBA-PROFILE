import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

cmds = [
    # Get the TOAST table name for erp_data
    "sudo -u postgres psql -d jagdamba_final -c \"SELECT reltoastrelid, (SELECT relname FROM pg_class WHERE oid = reltoastrelid) as toast_name FROM pg_class WHERE relname='erp_data';\"",
    # Check TOAST table size and row count  
    "sudo -u postgres psql -d jagdamba_final -c \"SELECT count(*), sum(octet_length(chunk_data)) FROM pg_toast.pg_toast_16402;\"",
    # Show TOAST chunk IDs and sizes grouped
    "sudo -u postgres psql -d jagdamba_final -c \"SELECT chunk_id, count(*) as chunks, sum(octet_length(chunk_data)) as total_bytes FROM pg_toast.pg_toast_16402 GROUP BY chunk_id ORDER BY chunk_id;\"",
    # Show the TOAST table file size on disk
    "sudo -u postgres psql -d jagdamba_final -t -c \"SELECT pg_size_pretty(pg_total_relation_size('pg_toast.pg_toast_16402'));\"",
]
for cmd in cmds:
    print(f'\n>>> {cmd[:100]}')
    _, o, e = c.exec_command(cmd, timeout=60)
    out = o.read().decode('utf-8', errors='replace').strip()
    if out:
        print(out)
c.close()
