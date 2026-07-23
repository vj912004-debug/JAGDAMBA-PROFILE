import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

# Check how many pages the TOAST table has (512KB / 8KB = 64 pages)
# Look for dead tuples in TOAST pages that contain old compressed data

cmds = [
    # Get TOAST table info
    "sudo -u postgres psql -d jagdamba_final -c \"SELECT oid, relname, relfilenode FROM pg_class WHERE oid=16409;\"",
    "sudo -u postgres psql -d jagdamba_final -c \"SELECT n_live_tup, n_dead_tup, last_vacuum, last_autovacuum FROM pg_stat_user_tables WHERE relid=16409;\"",
    # Total pages in TOAST
    "sudo -u postgres psql -d jagdamba_final -t -c \"SELECT ceil(pg_relation_size('pg_toast.pg_toast_16402') / 8192.0)::int AS page_count;\"",
    # Check first few pages of TOAST for items
    "sudo -u postgres psql -d jagdamba_final -c \"SELECT lp, lp_flags, lp_len, t_xmin, t_xmax FROM heap_page_items(get_raw_page('pg_toast.pg_toast_16402', 0)) WHERE lp_len > 0 LIMIT 10;\"",
    "sudo -u postgres psql -d jagdamba_final -c \"SELECT lp, lp_flags, lp_len, t_xmin, t_xmax FROM heap_page_items(get_raw_page('pg_toast.pg_toast_16402', 1)) WHERE lp_len > 0 LIMIT 10;\"",
    "sudo -u postgres psql -d jagdamba_final -c \"SELECT lp, lp_flags, lp_len, t_xmin, t_xmax FROM heap_page_items(get_raw_page('pg_toast.pg_toast_16402', 2)) WHERE lp_len > 0 LIMIT 10;\"",
]
for cmd in cmds:
    print(f'\n>>> {cmd[:100]}')
    _, o, e = c.exec_command(cmd, timeout=60)
    out = o.read().decode('utf-8', errors='replace').strip()
    if out:
        print(out[:2000])
c.close()
