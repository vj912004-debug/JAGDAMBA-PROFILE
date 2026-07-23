import paramiko
import sys
import struct

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

# Get number of pages in the TOAST relation
_, o, _ = c.exec_command("sudo -u postgres psql -d jagdamba_final -t -c \"SELECT ceil(pg_relation_size('pg_toast.pg_toast_16402') / 8192.0)::int AS page_count;\"")
page_count = int(o.read().decode().strip())
print(f"TOAST Table Page Count: {page_count}")

found_chunks = {}

for page in range(page_count):
    sql = f"""
    SELECT lp, lp_len, t_xmin, t_xmax, encode(t_data, 'hex') as hex_data
    FROM heap_page_items(get_raw_page('pg_toast.pg_toast_16402', {page}))
    WHERE lp_len > 0;
    """
    _, o, _ = c.exec_command(f'sudo -u postgres psql -d jagdamba_final -t -c "{sql}"')
    lines = o.read().decode('utf-8', errors='replace').strip().split('\n')
    for line in lines:
        if not line.strip():
            continue
        parts = [p.strip() for p in line.split('|')]
        if len(parts) < 5:
            continue
        lp, lp_len, t_xmin, t_xmax, hex_data = parts[:5]
        
        # TOAST chunk t_data has format:
        # - chunk_id (4 bytes, little-endian)
        # - chunk_seq (4 bytes, little-endian)
        # - chunk_data (rest)
        if len(hex_data) < 16:
            continue
        
        try:
            raw_bytes = bytes.fromhex(hex_data)
            chunk_id, chunk_seq = struct.unpack('<II', raw_bytes[:8])
            
            if chunk_id not in found_chunks:
                found_chunks[chunk_id] = []
            
            found_chunks[chunk_id].append({
                'page': page,
                'lp': lp,
                'seq': chunk_seq,
                'xmin': t_xmin,
                'xmax': t_xmax,
                'len': len(raw_bytes) - 8,
                'data_b64': hex_data[16:]  # Keep data hex (skip header)
            })
        except Exception as e:
            print(f"Error parsing page {page} lp {lp}: {e}")

print("\nSummary of all TOAST chunks found:")
for cid in sorted(found_chunks.keys()):
    chunks = found_chunks[cid]
    chunks.sort(key=lambda x: x['seq'])
    seqs = [c['seq'] for c in chunks]
    total_bytes = sum(c['len'] for c in chunks)
    # Check if xmax is 0 for all chunks (meaning live)
    live = all(c['xmax'] == '0' for c in chunks)
    print(f"Chunk ID: {cid} | Chunks: {len(chunks)} | Sequences: {seqs} | Total bytes: {total_bytes} | Live: {live}")

c.close()
