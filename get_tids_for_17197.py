import paramiko
import sys
import struct

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

# Get TIDs from erp_data page 2
print("=== erp_data Page 2 Items ===")
sql_erp = """
SELECT lp, t_ctid, t_xmin, t_xmax
FROM heap_page_items(get_raw_page('erp_data', 2))
WHERE lp_len > 0;
"""
_, o, _ = c.exec_command(f'sudo -u postgres psql -d jagdamba_final -c "{sql_erp}"')
print(o.read().decode().strip())

# Get TIDs of pg_toast.pg_toast_16402 for chunk_id = 17197
print("\n=== TOAST chunks for 17197 ===")
# We will check all pages for chunk_id 17197 and print their page and lp
_, o_pages, _ = c.exec_command("sudo -u postgres psql -d jagdamba_final -t -c \"SELECT ceil(pg_relation_size('pg_toast.pg_toast_16402') / 8192.0)::int AS page_count;\"")
page_count = int(o_pages.read().decode().strip())

for page in range(page_count):
    sql_toast = f"""
    SELECT lp, t_ctid, t_xmin, t_xmax, encode(t_data, 'hex') as hex_data
    FROM heap_page_items(get_raw_page('pg_toast.pg_toast_16402', {page}))
    WHERE lp_len > 0;
    """
    _, o, _ = c.exec_command(f'sudo -u postgres psql -d jagdamba_final -t -c "{sql_toast}"')
    lines = o.read().decode('utf-8', errors='replace').strip().split('\n')
    for line in lines:
        if not line.strip():
            continue
        parts = [p.strip() for p in line.split('|')]
        if len(parts) < 5:
            continue
        lp, t_ctid, t_xmin, t_xmax, hex_data = parts[:5]
        try:
            raw_bytes = bytes.fromhex(hex_data)
            chunk_id, chunk_seq = struct.unpack('<II', raw_bytes[:8])
            if chunk_id == 17197:
                print(f"Page: {page} | lp: {lp} | TID: {t_ctid} | seq: {chunk_seq} | xmin: {t_xmin} | xmax: {t_xmax}")
        except Exception:
            pass

c.close()
