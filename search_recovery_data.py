import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

cmds = [
    # Check postgres WAL archiving and any archived files
    "ls -la /var/lib/postgresql/16/main/pg_wal/ | head -20",
    # Check if pg_dump was done any time before
    "find / -name '*.pgdump' -o -name '*.sql.gz' 2>/dev/null | grep -v 'postgresql/16/main/pg_wal'",
    # Check pm2 api logs for what was stored before the wipe - look for PUT success with large body size
    "grep -a 'PUT\\|purchaseOrders\\|erp_data' /root/.pm2/logs/api-out.log | tail -50",
    # Check Nginx access log for the last time data was successfully PUT with large size
    "grep 'PUT /api/erp/data' /var/log/nginx/access.log | awk '{print $1, $4, $10}' | sort -k2 | head -30",
    # Check if there are any cron backup jobs
    "crontab -l 2>/dev/null",
    "ls /var/backups/ 2>/dev/null",
    # Check git stash on VPS
    "cd /root/JAGDAMBA-PROFILE && git stash list 2>/dev/null",
    # Check if PM2 logs have the ERP data payload cached
    "wc -l /root/.pm2/logs/api-out.log",
]
for cmd in cmds:
    print(f'\n>>> {cmd[:100]}')
    _, o, e = c.exec_command(cmd, timeout=60)
    out = o.read().decode('utf-8', errors='replace').strip()
    if out:
        print(out)
c.close()
