import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

cmds = [
    # Check GET responses - look for large ones (real data) vs small ones (empty)
    "grep 'GET /api/erp/data' /var/log/nginx/access.log | awk '{print $1, $4, $10}' | tail -20",
    "zcat /var/log/nginx/access.log.2.gz 2>/dev/null | grep 'GET /api/erp/data' | awk '{print $1, $4, $10}' | tail -20",
    "zcat /var/log/nginx/access.log.3.gz 2>/dev/null | grep 'GET /api/erp/data' | awk '{print $1, $4, $10}' | tail -20",
    "zcat /var/log/nginx/access.log.4.gz 2>/dev/null | grep 'GET /api/erp/data' | awk '{print $1, $4, $10}' | tail -20",
    "zcat /var/log/nginx/access.log.5.gz 2>/dev/null | grep 'GET /api/erp/data' | awk '{print $1, $4, $10}' | tail -20",
    # Any request larger than 1000 bytes
    "for f in /var/log/nginx/access.log /var/log/nginx/access.log.1; do grep 'erp/data' $f 2>/dev/null | awk '{if ($10 > 1000) print $0}'; done",
    "for f in /var/log/nginx/access.log.*.gz; do zcat $f 2>/dev/null | grep 'erp/data' | awk '{if ($10 > 1000) print $0}'; done",
]
for cmd in cmds:
    print(f'\n>>> {cmd[:100]}')
    _, o, e = c.exec_command(cmd, timeout=60)
    out = o.read().decode('utf-8', errors='replace').strip()
    if out:
        print(out[:2000])
c.close()
