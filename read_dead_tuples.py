import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

# Try using pageinspect to read raw page data including dead tuples
cmds = [
    # Install pageinspect extension if available
    "sudo -u postgres psql -d jagdamba_final -c \"CREATE EXTENSION IF NOT EXISTS pageinspect;\"",
    # Check how many pages the table has
    "sudo -u postgres psql -d jagdamba_final -c \"SELECT * FROM pg_relation_size('erp_data');\"",
    # Get item offsets on each page (including dead ones)
    "sudo -u postgres psql -d jagdamba_final -c \"SELECT * FROM heap_page_items(get_raw_page('erp_data', 0)) LIMIT 5;\"",
    "sudo -u postgres psql -d jagdamba_final -t -c \"SELECT page_count FROM pg_relation_filepath('erp_data'), LATERAL (SELECT ceil(pg_relation_size('erp_data') / 8192.0)::int AS page_count) p;\"",
]
for cmd in cmds:
    print(f'\n>>> {cmd[:100]}')
    _, o, e = c.exec_command(cmd, timeout=60)
    out = o.read().decode('utf-8', errors='replace').strip()
    if out:
        print(out[:3000])
c.close()
