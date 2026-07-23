import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

# THE KEY INSIGHT:
# The erp_data table has a UNIQUE constraint on 'id' column.
# We can try to directly manipulate xmax to 0 using pg_surgery to "undelete" the row,
# then read it normally.
#
# Better approach: Create a NEW row in erp_data using the raw TOAST chunks
# by temporarily swapping chunk_id to point at the dead chunks

# Even better: Use pg_surgery to make the old main table row (with large data) visible
# The main table row at page 2 with xmin=1687, xmax=1688 contains pointer to TOAST chunk 17197

# Let's try the most direct approach:
# Use pg_surgery to zero out xmax on the old erp_data row (making it "live")
# then immediately read it, then restore current state

# First install pg_surgery
cmd0 = "sudo -u postgres psql -d jagdamba_final -c \"CREATE EXTENSION IF NOT EXISTS pg_surgery;\""
_, o, e = c.exec_command(cmd0, timeout=30)
print(o.read().decode('utf-8', errors='replace').strip())

# The old large-data row is at page 2, item 25 (xmin=1687, xmax=1688)
# Let's check the main table page 2 items to identify which one points to our data
cmd1 = """sudo -u postgres psql -d jagdamba_final -c "
SELECT lp, lp_len, t_xmin, t_xmax, 
       encode(substring(t_data, 1, 32), 'hex') as data_prefix
FROM heap_page_items(get_raw_page('erp_data', 2))
WHERE lp_len > 0;
" """
_, o, e = c.exec_command(cmd1, timeout=30)
print("\n>>> erp_data page 2 items:")
print(o.read().decode('utf-8', errors='replace').strip())

# Try using heap_page_items to get the ctid of the old row
# and then use pg_surgery to make it visible
cmd2 = """sudo -u postgres psql -d jagdamba_final -c "
SELECT lp, t_ctid, t_xmin, t_xmax, lp_len
FROM heap_page_items(get_raw_page('erp_data', 2))
WHERE t_xmin = 1687 AND t_xmax != 0;
" """
_, o, e = c.exec_command(cmd2, timeout=30)
print("\n>>> Old row at xmin=1687:")
print(o.read().decode('utf-8', errors='replace').strip())

c.close()
