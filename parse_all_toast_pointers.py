import paramiko
import sys
import struct

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

# Fetch all items from erp_data Page 2
sql = """
SELECT lp, t_ctid, t_xmin, t_xmax, encode(t_data, 'hex') as hex_data
FROM heap_page_items(get_raw_page('erp_data', 2))
WHERE lp_len > 0;
"""
_, o, _ = c.exec_command(f'sudo -u postgres psql -d jagdamba_final -t -c "{sql}"')
lines = o.read().decode('utf-8', errors='replace').strip().split('\n')

print(f"{'lp':<3} | {'ctid':<6} | {'xmin':<5} | {'xmax':<5} | {'chunk_id':<8} | {'rawsize':<8} | {'extsize':<8} | {'TOAST Chunks (count, size)'}")
print("-" * 90)

for line in lines:
    if not line.strip():
        continue
    parts = [p.strip() for p in line.split('|')]
    if len(parts) < 5:
        continue
    lp, t_ctid, t_xmin, t_xmax, hex_data = parts[:5]
    
    # We look for the 18-byte TOAST pointer.
    # The OID of the toast table is 16409 (hex: 19 40 00 00)
    # The structure of varattrib_pointer is:
    # - 1 byte: tag/header (usually 0x12 or similar)
    # - 1 byte: alignment/type
    # - 4 bytes: va_rawsize (uncompressed size, with 2 bits of flags masked out)
    # - 4 bytes: va_extsize (compressed size)
    # - 4 bytes: va_valueid (chunk_id)
    # - 4 bytes: va_toastrelid (16409)
    # So we search for '19400000'. The chunk_id is the 8 hex characters before it.
    idx = hex_data.find('19400000')
    if idx != -1:
        pointer_hex = hex_data[idx-24:idx+8] # 16 bytes = 32 hex chars
        if len(pointer_hex) == 32:
            try:
                pointer_bytes = bytes.fromhex(pointer_hex)
                rawsize, extsize, chunk_id, toastrelid = struct.unpack('<IIII', pointer_bytes)
                
                # Query TOAST table
                sql_toast = f"SELECT count(*), sum(octet_length(chunk_data)) FROM pg_toast.pg_toast_16402 WHERE chunk_id = {chunk_id};"
                _, o_toast, _ = c.exec_command(f'sudo -u postgres psql -d jagdamba_final -t -c "{sql_toast}"')
                toast_res = o_toast.read().decode().strip().split('|')
                count = int(toast_res[0].strip() or 0)
                size = int(toast_res[1].strip() or 0) if count > 0 else 0
                
                print(f"{lp:<3} | {t_ctid:<6} | {t_xmin:<5} | {t_xmax:<5} | {chunk_id:<8} | {rawsize:<8} | {extsize:<8} | count={count}, size={size} bytes")
            except Exception as e:
                print(f"{lp:<3} | {t_ctid:<6} | {t_xmin:<5} | {t_xmax:<5} | Parse error: {e}")
        else:
            print(f"{lp:<3} | {t_ctid:<6} | {t_xmin:<5} | {t_xmax:<5} | Toast OID found, but hex too short")
    else:
        # Check if it is inline (and parse version if it is inline)
        # We can extract the version string at the end of the inline data
        raw_bytes = bytes.fromhex(hex_data)
        # Find 'v' in ASCII (0x76) or similar
        print(f"{lp:<3} | {t_ctid:<6} | {t_xmin:<5} | {t_xmax:<5} | Inline, len={len(raw_bytes)} bytes")

c.close()
