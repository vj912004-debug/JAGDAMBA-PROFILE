import paramiko, sys, struct, zlib
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

# Find the chunk IDs from pages - each dead tuple's first 8 bytes encode chunk_id and chunk_seq
# The hex preview shows chunk_id in little-endian bytes 0-3

# From page 0: 2643000000000000 = chunk_id 0x4326 = 17190, seq=0
# From page 0: 2643000001000000 = chunk_id 0x4326 = 17190, seq=1
# From page 0: 2643000002000000 = chunk_id 0x4326 = 17190, seq=2
# This is the version at xmin=1679, replaced at xmax=1680

# The LAST version before the wipe should be around xmin=1687 or 1688
# Let's check pages 14-16 for the most recent dead chunks

for page in range(14, 17):
    cmd = f"""sudo -u postgres psql -d jagdamba_final -c "SELECT lp, lp_flags, lp_len, t_xmin, t_xmax, encode(substring(t_data, 1, 8), 'hex') as chunk_header FROM heap_page_items(get_raw_page('pg_toast.pg_toast_16402', {page})) WHERE lp_len > 0;" """
    print(f'\n>>> TOAST Page {page}')
    _, o, e = c.exec_command(cmd, timeout=30)
    print(o.read().decode('utf-8', errors='replace').strip())

# Also get current live toast chunk id
cmd = "sudo -u postgres psql -d jagdamba_final -c \"SELECT chunk_id, chunk_seq, octet_length(chunk_data) FROM pg_toast.pg_toast_16402 ORDER BY chunk_id, chunk_seq;\""
print('\n>>> Current live TOAST chunks')
_, o, e = c.exec_command(cmd, timeout=30)
print(o.read().decode('utf-8', errors='replace').strip())

c.close()
