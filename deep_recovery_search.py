import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

cmds = [
    # Check if there are older nginx access logs (rotated)
    "ls -la /var/log/nginx/",
    # Look for any large PUT requests in nginx (before the wipe)
    "grep 'PUT /api/erp/data' /var/log/nginx/access.log.1 2>/dev/null | awk '{print $1, $4, $10}' | tail -20",
    # Check full API out log for any stored data payloads
    "head -100 /root/.pm2/logs/api-out.log",
    # Check api-error log for any clues
    "tail -50 /root/.pm2/logs/api-error.log",
    # Try to read any WAL data via pg_waldump for the most recent segments
    "sudo -u postgres pg_waldump -p /var/lib/postgresql/16/main/pg_wal 000000010000000000000048 2>&1 | grep -i 'erp_data\\|HEAP\\|INSERT\\|UPDATE' | head -20",
]
for cmd in cmds:
    print(f'\n>>> {cmd[:100]}')
    _, o, e = c.exec_command(cmd, timeout=60)
    out = o.read().decode('utf-8', errors='replace').strip()
    if out:
        print(out[:3000])
c.close()
