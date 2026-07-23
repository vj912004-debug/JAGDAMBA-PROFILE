import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

queries = [
    # Count chunks and sum size in correct TOAST table pg_toast_16409
    "SELECT count(*), sum(octet_length(chunk_data)) FROM pg_toast.pg_toast_16409;",
    # Show active chunk IDs and sizes grouped
    "SELECT chunk_id, count(*) as chunks, sum(octet_length(chunk_data)) as total_bytes FROM pg_toast.pg_toast_16409 GROUP BY chunk_id ORDER BY chunk_id;",
    # Get total relation size on disk of the TOAST table
    "SELECT pg_size_pretty(pg_total_relation_size('pg_toast.pg_toast_16409'));",
    # Check page count of pg_toast_16409
    "SELECT ceil(pg_relation_size('pg_toast.pg_toast_16409') / 8192.0)::int AS page_count;",
    # Query heap_page_items for page 0 of the TOAST table
    "SELECT lp, lp_flags, lp_len, t_xmin, t_xmax FROM heap_page_items(get_raw_page('pg_toast.pg_toast_16409', 0)) WHERE lp_len > 0 LIMIT 15;"
]

for sql in queries:
    cmd = f'sudo -u postgres psql -d jagdamba_final -c "{sql}"'
    print("\n>>>", cmd)
    _, o, e = c.exec_command(cmd)
    print(o.read().decode('utf-8', errors='replace').strip())
    err = e.read().decode('utf-8', errors='replace').strip()
    if err:
        print("ERR:", err)

c.close()
