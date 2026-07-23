import paramiko, sys, struct
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

# chunk_id 17197 (0x432d) is the last pre-wipe version
# Chunk 0: page 7, lp 1 (xmin=1687, xmax=1688) - 2032 bytes
# Chunk 1: page 7, lp 2 (xmin=1687, xmax=1688) - 2032 bytes  
# Chunk 2: page 7, lp 3 (xmin=1687, xmax=1688) - 446 bytes

# Extract the raw chunk data from the heap page items
# t_data format: 8 bytes header (chunk_id int32, chunk_seq int32) + raw data
# We need to skip the 8 byte header to get the actual chunk_data

print("Extracting dead TOAST chunks for chunk_id 17197...")

# Get all 3 chunks' data encoded as base64
cmd = """sudo -u postgres psql -d jagdamba_final -t -c "
SELECT encode(substring(t_data, 9), 'base64') as chunk_data_b64
FROM heap_page_items(get_raw_page('pg_toast.pg_toast_16402', 7))
WHERE lp_len > 0
ORDER BY lp;
" """
_, o, e = c.exec_command(cmd, timeout=60)
output = o.read().decode('utf-8', errors='replace').strip()
print(output[:200])
print(f"Total length: {len(output)}")

# Save to file on VPS for download
cmd2 = """sudo -u postgres psql -d jagdamba_final -t -c "
SELECT encode(substring(t_data, 9), 'base64')
FROM heap_page_items(get_raw_page('pg_toast.pg_toast_16402', 7))
WHERE lp_len > 0
ORDER BY lp;
" > /tmp/toast_chunk_17197.b64"""
_, o2, e2 = c.exec_command(cmd2, timeout=60)
o2.read()

# Check it saved
cmd3 = "wc -c /tmp/toast_chunk_17197.b64"
_, o3, e3 = c.exec_command(cmd3, timeout=30)
print("File size:", o3.read().decode().strip())

c.close()
