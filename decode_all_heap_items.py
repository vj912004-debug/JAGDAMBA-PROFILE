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

print(f"{'lp':<4} | {'TID':<8} | {'xmin':<6} | {'xmax':<6} | {'Details'}")
print("-" * 70)

for line in lines:
    if not line.strip():
        continue
    parts = [p.strip() for p in line.split('|')]
    if len(parts) < 5:
        continue
    lp, t_ctid, t_xmin, t_xmax, hex_data = parts[:5]
    
    # Let's decode the raw t_data hex bytes
    raw_bytes = bytes.fromhex(hex_data)
    
    # The erp_data columns are:
    # 1. id: TEXT (varlena)
    # 2. data: JSONB (varlena, can be TOASTed)
    # 3. version: TEXT (varlena)
    # 4. updated_at: TIMESTAMP (8 bytes)
    
    # We can inspect the hex data to find TOAST pointers.
    # A TOAST pointer is an 18-byte structure starting with OID 16409 (which is 0x4019 in little-endian hex: 19 40 00 00)
    # Let's search for the bytes of the OID 16409 in the hex data.
    # 16409 in little-endian is '19400000'.
    idx = hex_data.find('19400000')
    if idx != -1:
        # TOAST pointer found!
        pointer_hex = hex_data[idx:idx+36] # 18 bytes = 36 hex chars
        pointer_bytes = bytes.fromhex(pointer_hex)
        # Structure of toast pointer:
        # - va_toastrelid: 4 bytes (16409)
        # - va_valueid: 4 bytes (chunk_id)
        # - va_extsize: 4 bytes (logical size, raw size)
        # - va_rawsize: 4 bytes (physical size, compressed size? Or vice versa)
        if len(pointer_bytes) == 18:
            relid, chunk_id, extsize, rawsize = struct.unpack('<IIII', pointer_bytes[:16])
            
            # Query TOAST table to check if this chunk_id exists and get its size
            sql_toast = f"SELECT count(*), sum(octet_length(chunk_data)) FROM pg_toast.pg_toast_16402 WHERE chunk_id = {chunk_id};"
            _, o_toast, _ = c.exec_command(f'sudo -u postgres psql -d jagdamba_final -t -c "{sql_toast}"')
            toast_res = o_toast.read().decode().strip().split('|')
            count = int(toast_res[0].strip() or 0)
            size = int(toast_res[1].strip() or 0) if count > 0 else 0
            
            # Let's also decode the version and updated_at if possible.
            # But version is at the end. Since id is usually 'main', the first few bytes are:
            # 0x0b (size of 'main' varlena: 4 bytes len header = (4 * 2) + 3 bytes 'main' + 1 padding? Wait, 'main' is 4 chars. Varlena header: if 1-byte, size is (len << 1) | 1 -> (4 << 1)|1 = 9 = 0x09)
            print(f"{lp:<4} | {t_ctid:<8} | {t_xmin:<6} | {t_xmax:<6} | TOAST: chunk_id={chunk_id}, ext_size={extsize}, raw_size={rawsize} | TOAST table: count={count}, size={size} bytes")
        else:
            print(f"{lp:<4} | {t_ctid:<8} | {t_xmin:<6} | {t_xmax:<6} | TOAST OID found, but pointer too short: {pointer_hex}")
    else:
        # Not toasted or OID doesn't match 16409
        print(f"{lp:<4} | {t_ctid:<8} | {t_xmin:<6} | {t_xmax:<6} | Inline/no toast: len {len(raw_bytes)} bytes | Hex: {hex_data[:60]}...")

c.close()
