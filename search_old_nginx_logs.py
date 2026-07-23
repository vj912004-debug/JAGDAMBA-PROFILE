import paramiko, sys
sys.stdout.reconfigure(encoding='utf-8', errors='replace')
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)

cmds = [
    # Check compressed access log 2 (a week ago) for large PUT responses
    "zcat /var/log/nginx/access.log.2.gz 2>/dev/null | grep 'PUT /api/erp/data' | awk '{print $1, $4, $10}' | tail -30",
    "zcat /var/log/nginx/access.log.3.gz 2>/dev/null | grep 'PUT /api/erp/data' | awk '{print $1, $4, $10}' | tail -30",
    "zcat /var/log/nginx/access.log.4.gz 2>/dev/null | grep 'PUT /api/erp/data' | awk '{print $1, $4, $10}' | tail -30",
    "zcat /var/log/nginx/access.log.5.gz 2>/dev/null | grep 'PUT /api/erp/data' | awk '{print $1, $4, $10}' | tail -30",
    # Check ALL logs for any large response (> 10000 bytes = real data)
    "for f in /var/log/nginx/access.log.*.gz; do echo \"=== $f ===\"; zcat $f 2>/dev/null | grep 'PUT /api/erp/data' | awk '{if ($10 > 10000) print $0}' | head -5; done",
    "grep 'PUT /api/erp/data' /var/log/nginx/access.log /var/log/nginx/access.log.1 2>/dev/null | awk '{if ($10 > 1000) print $0}' | head -10",
]
for cmd in cmds:
    print(f'\n>>> {cmd[:100]}')
    _, o, e = c.exec_command(cmd, timeout=60)
    out = o.read().decode('utf-8', errors='replace').strip()
    if out:
        print(out[:3000])
c.close()
