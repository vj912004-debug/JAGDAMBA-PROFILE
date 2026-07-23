import paramiko, sys, base64, struct
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

# Use Python on the VPS to decompress the data
# PostgreSQL's PGLZ compressed data has a specific format
# The easiest way is to have PostgreSQL itself decompress it

# Strategy: Insert the dead chunks back as visible by temporarily disabling the
# xmax visibility check, OR use a smarter approach:
# Create a temp table, insert the dead data as a new row, then read it

cmd = """sudo -u postgres psql -d jagdamba_final -c "
-- Create temp table to hold the raw chunk data
CREATE TEMP TABLE recovered_chunks (
    chunk_id integer,
    chunk_seq integer,
    chunk_data bytea
);

-- Insert the dead chunks by reading them directly from heap pages
-- For chunk_id 17197 at page 7

INSERT INTO recovered_chunks
SELECT 
    get_byte(t_data, 0) | (get_byte(t_data, 1) << 8) | (get_byte(t_data, 2) << 16) | (get_byte(t_data, 3) << 24) as chunk_id,
    get_byte(t_data, 4) | (get_byte(t_data, 5) << 8) | (get_byte(t_data, 6) << 16) | (get_byte(t_data, 7) << 24) as chunk_seq,
    substring(t_data, 9) as chunk_data
FROM heap_page_items(get_raw_page('pg_toast.pg_toast_16402', 7))
WHERE lp_len > 0;

SELECT chunk_id, chunk_seq, octet_length(chunk_data) as bytes FROM recovered_chunks ORDER BY chunk_id, chunk_seq;
" """
print('>>> Inserting dead TOAST chunks into temp table')
_, o, e = c.exec_command(cmd, timeout=60)
print(o.read().decode('utf-8', errors='replace').strip())

# Now reassemble and decompress using pg_detoast
cmd2 = """sudo -u postgres psql -d jagdamba_final -c "
CREATE TEMP TABLE recovered_chunks (
    chunk_id integer,
    chunk_seq integer,
    chunk_data bytea
);
INSERT INTO recovered_chunks
SELECT 
    get_byte(t_data, 0) | (get_byte(t_data, 1) << 8) | (get_byte(t_data, 2) << 16) | (get_byte(t_data, 3) << 24),
    get_byte(t_data, 4) | (get_byte(t_data, 5) << 8) | (get_byte(t_data, 6) << 16) | (get_byte(t_data, 7) << 24),
    substring(t_data, 9)
FROM heap_page_items(get_raw_page('pg_toast.pg_toast_16402', 7))
WHERE lp_len > 0;

-- Concatenate all chunks in order
SELECT octet_length(string_agg(chunk_data, '' ORDER BY chunk_seq)) as total_compressed_bytes,
       chunk_id
FROM recovered_chunks GROUP BY chunk_id;
" """
print('\n>>> Checking concatenated size')
_, o2, e2 = c.exec_command(cmd2, timeout=60)
print(o2.read().decode('utf-8', errors='replace').strip())

c.close()
