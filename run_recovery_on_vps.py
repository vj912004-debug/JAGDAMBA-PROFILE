import paramiko, sys, base64, struct, json
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

# Most reliable approach: 
# 1. Read dead TOAST chunks from pages
# 2. Write them to a new temp TOAST-like table
# 3. Force PostgreSQL to assemble and return the JSONB value
# 
# The cleanest approach: write a Python script ON THE VPS to do the decompression
# using psycopg2 and direct table manipulation

vps_script = r"""
import psycopg2, sys, json, struct

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

conn = psycopg2.connect(dbname='jagdamba_final', user='postgres')
conn.autocommit = False

cur = conn.cursor()

try:
    # Step 1: Save current live data
    cur.execute("SELECT data FROM erp_data WHERE id='main'")
    current_data = cur.fetchone()[0]
    print(f"Current data keys: {list(current_data.keys()) if current_data else 'NONE'}")
    
    # Step 2: Create a temp table to hold recovered dead toast chunks
    cur.execute("CREATE TEMP TABLE raw_chunks (chunk_id int, chunk_seq int, chunk_data bytea)")
    
    # Step 3: Read dead chunks from page 7 (chunk_id 17197, xmin=1687, xmax=1688)
    cur.execute("""
        INSERT INTO raw_chunks
        SELECT 
            get_byte(t_data, 0) | (get_byte(t_data, 1) << 8) | 
            (get_byte(t_data, 2) << 16) | (get_byte(t_data, 3) << 24),
            get_byte(t_data, 4) | (get_byte(t_data, 5) << 8) | 
            (get_byte(t_data, 6) << 16) | (get_byte(t_data, 7) << 24),
            substring(t_data, 9)
        FROM heap_page_items(get_raw_page('pg_toast.pg_toast_16402', 7))
        WHERE lp_len > 0
    """)
    
    cur.execute("SELECT chunk_id, chunk_seq, octet_length(chunk_data) FROM raw_chunks ORDER BY chunk_id, chunk_seq")
    rows = cur.fetchall()
    print("Chunks found:", rows)
    
    # Step 4: The key magic - swap the current row's TOAST pointer to point to old chunks
    # We'll do this by: 
    # a) Delete current data
    # b) Insert a new row that PostgreSQL will build using our dead chunks
    #
    # Actually simplest: Use ALTER TABLE + TRUNCATE + INSERT with old chunk data reassembly
    
    # Get concatenated raw compressed bytes
    cur.execute("""
        SELECT string_agg(chunk_data, '' ORDER BY chunk_seq)
        FROM raw_chunks
        WHERE chunk_id = 17197
    """)
    compressed_row = cur.fetchone()
    if compressed_row and compressed_row[0]:
        raw_bytes = compressed_row[0]
        print(f"Raw compressed data: {len(raw_bytes)} bytes")
        # Save to /tmp for download
        with open('/tmp/recovered_toast_data.bin', 'wb') as f:
            f.write(bytes(raw_bytes))
        print("Saved to /tmp/recovered_toast_data.bin")
    
    conn.rollback()
    
except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()
    conn.rollback()
finally:
    conn.close()
"""

# Write the script to VPS
sftp = c.open_sftp()
with sftp.file('/tmp/recover_data.py', 'w') as f:
    f.write(vps_script)
sftp.close()

print("Script uploaded to VPS")

# Run it
cmd = "sudo -u postgres python3 /tmp/recover_data.py"
_, o, e = c.exec_command(cmd, timeout=60)
print(o.read().decode('utf-8', errors='replace'))
err = e.read().decode('utf-8', errors='replace')
if err.strip():
    print("STDERR:", err)

c.close()
