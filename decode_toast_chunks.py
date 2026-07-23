import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

# Strategy: Use pg_surgery to make old TOAST chunks visible by zeroing out xmax
# Then read the data through normal SQL
# 
# The dead chunk 17189 (0x2543) at xmin=1677, xmax=1679 is the one just before the wipe
# But the LARGEST data before the empty wipe was around chunk 17196/17197

# First, let's identify all distinct chunk IDs from the dead TOAST pages
# by reading the raw hex and decoding the chunk_id from bytes 0-3 (little-endian int32)

# Let's get the chunk data from all pages that have chunks
cmd = """sudo -u postgres psql -d jagdamba_final -t -c "
SELECT DISTINCT
  ('x' || lpad(to_hex(get_byte(t_data, 3)), 2, '0') ||
         lpad(to_hex(get_byte(t_data, 2)), 2, '0') ||
         lpad(to_hex(get_byte(t_data, 1)), 2, '0') ||
         lpad(to_hex(get_byte(t_data, 0)), 2, '0'))::bit(32)::int AS chunk_id,
  t_xmin, t_xmax, lp_len
FROM heap_page_items(get_raw_page('pg_toast.pg_toast_16402', 0))
WHERE lp_len > 100
UNION ALL
SELECT 
  ('x' || lpad(to_hex(get_byte(t_data, 3)), 2, '0') ||
         lpad(to_hex(get_byte(t_data, 2)), 2, '0') ||
         lpad(to_hex(get_byte(t_data, 1)), 2, '0') ||
         lpad(to_hex(get_byte(t_data, 0)), 2, '0'))::bit(32)::int AS chunk_id,
  t_xmin, t_xmax, lp_len
FROM heap_page_items(get_raw_page('pg_toast.pg_toast_16402', 15))
WHERE lp_len > 100
UNION ALL
SELECT 
  ('x' || lpad(to_hex(get_byte(t_data, 3)), 2, '0') ||
         lpad(to_hex(get_byte(t_data, 2)), 2, '0') ||
         lpad(to_hex(get_byte(t_data, 1)), 2, '0') ||
         lpad(to_hex(get_byte(t_data, 0)), 2, '0'))::bit(32)::int AS chunk_id,
  t_xmin, t_xmax, lp_len
FROM heap_page_items(get_raw_page('pg_toast.pg_toast_16402', 16))
WHERE lp_len > 100
ORDER BY chunk_id;
" """
print('>>> All unique chunk IDs across sampled pages')
_, o, e = c.exec_command(cmd, timeout=60)
print(o.read().decode('utf-8', errors='replace').strip())

# The highest chunk_id before 17198 (current) should be the most recent pre-wipe data
# Let's also check pages 12 and 13
for page in [12, 13]:
    cmd2 = f"""sudo -u postgres psql -d jagdamba_final -c "SELECT lp, lp_len, t_xmin, t_xmax, encode(substring(t_data, 1, 8), 'hex') as hdr FROM heap_page_items(get_raw_page('pg_toast.pg_toast_16402', {page})) WHERE lp_len > 0;" """
    print(f'\n>>> TOAST Page {page}')
    _, o, e = c.exec_command(cmd2, timeout=30)
    print(o.read().decode('utf-8', errors='replace').strip())

c.close()
