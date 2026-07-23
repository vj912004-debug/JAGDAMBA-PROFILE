import paramiko, sys, json
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

# Strategy: Use pg_surgery to make dead TOAST tuples visible, then read the data
# OR: Try snapshot isolation trick using pg_get_expr

# First, let's try to directly use a SQL approach to read dead tuples from TOAST
# by scanning all TOAST page items and concatenating chunk_data

# Get all chunk IDs from all pages (including dead ones)
# by scanning heap_page_items directly
page_count = 17

# First just check what's on pages 0-16
for page in range(min(5, page_count)):
    cmd = f"""sudo -u postgres psql -d jagdamba_final -c "SELECT lp, lp_flags, lp_len, t_xmin, t_xmax, encode(substring(t_data, 1, 20), 'hex') as data_preview FROM heap_page_items(get_raw_page('pg_toast.pg_toast_16402', {page})) WHERE lp_len > 0;" """
    print(f'\n>>> TOAST Page {page}')
    _, o, e = c.exec_command(cmd, timeout=30)
    print(o.read().decode('utf-8', errors='replace').strip()[:1500])

c.close()
