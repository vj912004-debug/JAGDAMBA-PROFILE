import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

# Write the recovery script directly to VPS via sftp
vps_script = """import psycopg2, sys, json

conn = psycopg2.connect(dbname='jagdamba_final', user='postgres')
conn.autocommit = False
cur = conn.cursor()

try:
    # Create temp table for dead chunks
    cur.execute("CREATE TEMP TABLE raw_chunks (chunk_id int, chunk_seq int, chunk_data bytea)")
    
    # Read dead chunks from page 7 (chunk_id 17197)
    sql = '''INSERT INTO raw_chunks
        SELECT 
            get_byte(t_data, 0) | (get_byte(t_data, 1) << 8) | (get_byte(t_data, 2) << 16) | (get_byte(t_data, 3) << 24),
            get_byte(t_data, 4) | (get_byte(t_data, 5) << 8) | (get_byte(t_data, 6) << 16) | (get_byte(t_data, 7) << 24),
            substring(t_data, 9)
        FROM heap_page_items(get_raw_page('pg_toast.pg_toast_16402', 7))
        WHERE lp_len > 0'''
    cur.execute(sql)
    
    cur.execute("SELECT chunk_id, chunk_seq, octet_length(chunk_data) FROM raw_chunks ORDER BY chunk_id, chunk_seq")
    rows = cur.fetchall()
    print("Chunks:", rows)
    
    # Concatenate raw compressed bytes for chunk_id 17197
    cur.execute("SELECT string_agg(chunk_data, '' ORDER BY chunk_seq) FROM raw_chunks WHERE chunk_id = 17197")
    row = cur.fetchone()
    if row and row[0]:
        raw_bytes = bytes(row[0])
        print(f"Compressed data size: {len(raw_bytes)} bytes")
        with open('/tmp/recovered_toast_data.bin', 'wb') as f:
            f.write(raw_bytes)
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

sftp = c.open_sftp()
with sftp.file('/tmp/recover_data.py', 'w') as f:
    f.write(vps_script)
sftp.close()
print("Script uploaded")

_, o, e = c.exec_command("sudo -u postgres python3 /tmp/recover_data.py", timeout=60)
print(o.read().decode('utf-8', errors='replace'))
err = e.read().decode('utf-8', errors='replace').strip()
if err:
    print("STDERR:", err)

c.close()
