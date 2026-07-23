import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

# Scan ALL 17 pages systematically and collect all chunk info
all_chunks = {}
page_count = 17

print("Scanning all TOAST pages for chunk headers...")
for page in range(page_count):
    cmd = f"""sudo -u postgres psql -d jagdamba_final -t -c "
SELECT lp, lp_len, t_xmin, t_xmax, encode(substring(t_data, 1, 8), 'hex') as hdr
FROM heap_page_items(get_raw_page('pg_toast.pg_toast_16402', {page}))
WHERE lp_len > 0;
" """
    _, o, e = c.exec_command(cmd, timeout=30)
    out = o.read().decode('utf-8', errors='replace').strip()
    if out:
        print(f"Page {page}: {out[:200]}")

c.close()
