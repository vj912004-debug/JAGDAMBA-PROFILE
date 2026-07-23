import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

# The data was in the DB at 06:03 UTC. Let's try to read it directly from WAL
# More importantly - try PITR (point-in-time recovery) by reading the actual heap pages
# from the dead tuple versions in the data files

cmds = [
    # Check the current table OID
    "sudo -u postgres psql -d jagdamba_final -t -c \"SELECT oid FROM pg_class WHERE relname='erp_data';\"",
    # Get the table's relfilenode
    "sudo -u postgres psql -d jagdamba_final -t -c \"SELECT relfilenode FROM pg_class WHERE relname='erp_data';\"",
    # Check autovacuum settings - if not vacuumed, dead tuples may still be readable
    "sudo -u postgres psql -d jagdamba_final -c \"SELECT n_live_tup, n_dead_tup, last_vacuum, last_autovacuum FROM pg_stat_user_tables WHERE relname='erp_data';\"",
    # Check when last autovacuum happened
    "sudo -u postgres psql -d jagdamba_final -c \"SELECT relname, last_vacuum, last_autovacuum, n_dead_tup FROM pg_stat_user_tables;\"",
]
for cmd in cmds:
    print(f'\n>>> {cmd[:100]}')
    _, o, e = c.exec_command(cmd, timeout=60)
    out = o.read().decode('utf-8', errors='replace').strip()
    if out:
        print(out)
c.close()
