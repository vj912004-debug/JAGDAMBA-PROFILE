import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

# Check all 3 pages for any items
for page in range(3):
    cmd = f"sudo -u postgres psql -d jagdamba_final -c \"SELECT lp, lp_flags, lp_len, t_xmin, t_xmax FROM heap_page_items(get_raw_page('erp_data', {page}));\""
    print(f'\n>>> Page {page}')
    _, o, e = c.exec_command(cmd, timeout=60)
    out = o.read().decode('utf-8', errors='replace').strip()
    print(out[:2000])

# Also try to extract data from pages with items
# lp_flags=1 means normal, lp_flags=2 means redirect, lp_flags=3 means dead
# t_xmax != 0 means the tuple was deleted/updated (dead tuple)
cmd = """sudo -u postgres psql -d jagdamba_final -c "
SELECT lp, lp_flags, lp_len, t_xmin, t_xmax, 
       octet_length(t_data) as data_bytes
FROM heap_page_items(get_raw_page('erp_data', 0))
WHERE lp_len > 0;
" """
print('\n>>> Checking page 0 items with data length')
_, o, e = c.exec_command(cmd, timeout=60)
print(o.read().decode('utf-8', errors='replace').strip())

c.close()
