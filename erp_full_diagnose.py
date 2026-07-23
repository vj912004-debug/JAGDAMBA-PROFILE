"""
Full ERP VPS Diagnostic + Fix Script
Jagdamba Profile — jagdambaprofile.tech
"""

import sys
import time
import paramiko

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HOST = '187.127.160.28'
USER = 'root'
PW   = 'Jagdamba@2026'
REMOTE_ROOT = '/root/JAGDAMBA-PROFILE'
DB_NAME = 'Jagdamba_final'
DB_USER = 'postgres'
DB_PASS = 'Vraj@2003'

DIVIDER = '\n' + '='*70

def connect():
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect(HOST, username=USER, password=PW, timeout=30,
              look_for_keys=False, allow_agent=False)
    t = c.get_transport()
    if t:
        t.set_keepalive(25)
    return c

def run(c, cmd, label='', check=False, timeout=120):
    if label:
        print(f'\n{DIVIDER}\n[{label}]\n>>> {cmd}')
    else:
        print(f'\n>>> {cmd}')
    _, o, e = c.exec_command(cmd, timeout=timeout)
    out = o.read().decode('utf-8', errors='replace').strip()
    err = e.read().decode('utf-8', errors='replace').strip()
    code = o.channel.recv_exit_status()
    if out:
        print(out[:8000])
    if err:
        print(f'STDERR: {err[:3000]}')
    if check and code != 0:
        print(f'WARNING: command exited with code {code}')
    return out, err, code

def psql(c, sql, label=''):
    cmd = f'PGPASSWORD="{DB_PASS}" psql -U {DB_USER} -d {DB_NAME} -c "{sql}"'
    return run(c, cmd, label=label)

def psql_any(c, sql, dbname='postgres', label=''):
    cmd = f'PGPASSWORD="{DB_PASS}" psql -U {DB_USER} -d {dbname} -c "{sql}"'
    return run(c, cmd, label=label)

def main():
    print('\n' + '='*70)
    print('  JAGDAMBA ERP — FULL VPS DIAGNOSTIC')
    print('='*70)

    c = connect()
    print(f'Connected to {HOST}')

    # ──────────────────────────────────────────────────────────────────────
    # 1. System overview
    # ──────────────────────────────────────────────────────────────────────
    run(c, 'uptime', label='1. System Uptime')
    run(c, 'df -h /', label='1. Disk Usage')
    run(c, 'free -m', label='1. Memory')

    # ──────────────────────────────────────────────────────────────────────
    # 2. PostgreSQL status
    # ──────────────────────────────────────────────────────────────────────
    run(c, 'systemctl is-active postgresql || pg_lsclusters', label='2. PostgreSQL Service Status')
    run(c, 'pg_lsclusters 2>/dev/null || echo "pg_lsclusters not found"', label='2. PG Clusters')

    # ──────────────────────────────────────────────────────────────────────
    # 3. List ALL databases
    # ──────────────────────────────────────────────────────────────────────
    psql_any(c, r'\l', label='3. All PostgreSQL Databases')

    # ──────────────────────────────────────────────────────────────────────
    # 4. Check .env on VPS
    # ──────────────────────────────────────────────────────────────────────
    run(c, f'cat {REMOTE_ROOT}/backend/.env', label='4. VPS backend .env')

    # ──────────────────────────────────────────────────────────────────────
    # 5. Tables in target DB
    # ──────────────────────────────────────────────────────────────────────
    psql(c, r'\dt public.*', label='5. Tables in Jagdamba_final')

    # ──────────────────────────────────────────────────────────────────────
    # 6. Row counts for major tables
    # ──────────────────────────────────────────────────────────────────────
    count_sql = (
        "SELECT table_name, "
        "(SELECT COUNT(*) FROM information_schema.columns "
        " WHERE table_schema='public' AND columns.table_name=t.table_name) as col_count "
        "FROM information_schema.tables t "
        "WHERE table_schema='public' ORDER BY table_name;"
    )
    psql(c, count_sql, label='6. Table Column Counts in Jagdamba_final')

    # Row counts
    row_count_sql = (
        "SELECT schemaname, tablename, n_live_tup "
        "FROM pg_stat_user_tables "
        "WHERE schemaname='public' "
        "ORDER BY n_live_tup DESC;"
    )
    psql(c, row_count_sql, label='6. Row Counts (pg_stat)')

    # More accurate individual counts
    tables_to_check = ['users', 'customers', 'suppliers', 'products',
                       'invoices', 'orders', 'erp_data', 'sales_orders',
                       'purchase_orders', 'ledger', 'parties']
    for tbl in tables_to_check:
        psql(c,
             f"SELECT COUNT(*) as {tbl}_count FROM {tbl};",
             label=f'6. Row count: {tbl}')

    # ──────────────────────────────────────────────────────────────────────
    # 7. Check erp_data table (primary data store for this ERP)
    # ──────────────────────────────────────────────────────────────────────
    psql(c,
         r"\d erp_data",
         label='7. erp_data schema')
    psql(c,
         "SELECT id, length(data::text) as data_bytes, updated_at FROM erp_data LIMIT 5;",
         label='7. erp_data sample rows')

    # ──────────────────────────────────────────────────────────────────────
    # 8. Look for OTHER databases with ERP data
    # ──────────────────────────────────────────────────────────────────────
    all_dbs_sql = (
        "SELECT datname FROM pg_database "
        "WHERE datistemplate=false AND datname NOT IN ('postgres') "
        "ORDER BY datname;"
    )
    out_dbs, _, _ = psql_any(c, all_dbs_sql, label='8. All non-template databases')

    # Try to list erp_data in each detected DB
    for line in out_dbs.splitlines():
        line = line.strip()
        if line and not line.startswith('datname') and not line.startswith('---') and not line.startswith('('):
            dbname = line.strip()
            if dbname and dbname != DB_NAME:
                cmd = (f'PGPASSWORD="{DB_PASS}" psql -U {DB_USER} -d "{dbname}" '
                       f'-c "SELECT COUNT(*) FROM erp_data;" 2>/dev/null '
                       f'|| echo "Table erp_data not found in {dbname}"')
                run(c, cmd, label=f'8. erp_data count in DB: {dbname}')

    # ──────────────────────────────────────────────────────────────────────
    # 9. Check VPS filesystem — all source files
    # ──────────────────────────────────────────────────────────────────────
    run(c, f'ls -la {REMOTE_ROOT}/backend/src/', label='9. Backend src files')
    run(c, f'ls -la {REMOTE_ROOT}/backend/src/services/ 2>/dev/null || echo "No services dir"',
        label='9. Backend services dir')
    run(c, f'ls -la {REMOTE_ROOT}/backend/src/controllers/ 2>/dev/null || echo "No controllers dir"',
        label='9. Backend controllers dir')
    run(c, f'ls -la {REMOTE_ROOT}/backend/src/routes/ 2>/dev/null || echo "No routes dir"',
        label='9. Backend routes dir')
    run(c, f'ls -la {REMOTE_ROOT}/backend/src/config/ 2>/dev/null || echo "No config dir"',
        label='9. Backend config dir')
    run(c, f'ls -la {REMOTE_ROOT}/dist/ 2>/dev/null | head -20', label='9. dist dir')

    # ──────────────────────────────────────────────────────────────────────
    # 10. PM2 status and logs
    # ──────────────────────────────────────────────────────────────────────
    run(c, 'pm2 status', label='10. PM2 Status')
    run(c, 'pm2 logs api --lines 50 --nostream 2>&1', label='10. API PM2 Logs (last 50)')
    run(c, 'pm2 logs api --err --lines 30 --nostream 2>&1', label='10. API PM2 Error Logs')

    # ──────────────────────────────────────────────────────────────────────
    # 11. Nginx status and logs
    # ──────────────────────────────────────────────────────────────────────
    run(c, 'systemctl is-active nginx', label='11. Nginx Status')
    run(c, 'nginx -t', label='11. Nginx Config Test')
    run(c, 'tail -30 /var/log/nginx/error.log 2>/dev/null || echo "No nginx error log"',
        label='11. Nginx Error Log')
    run(c, 'tail -20 /var/log/nginx/access.log 2>/dev/null | grep -v "assets" | head -20',
        label='11. Nginx Access Log (recent, no assets)')

    # ──────────────────────────────────────────────────────────────────────
    # 12. Test API endpoints directly
    # ──────────────────────────────────────────────────────────────────────
    run(c, 'curl -s http://localhost:5000/api/health', label='12. API Health (localhost:5000)')
    run(c, 'curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/erp/data',
        label='12. GET /api/erp/data HTTP code')
    run(c, 'curl -s http://localhost:5000/api/erp/data | head -c 500',
        label='12. GET /api/erp/data response (first 500 chars)')
    run(c, 'curl -sI https://jagdambaprofile.tech/api/erp/data | head -10',
        label='12. HTTPS API headers from nginx')

    # ──────────────────────────────────────────────────────────────────────
    # 13. Check backup files on VPS
    # ──────────────────────────────────────────────────────────────────────
    run(c, 'find /root /home /var/backups -name "*.sql" -o -name "*.dump" -o -name "*.backup" 2>/dev/null | head -20',
        label='13. SQL Backup files on VPS')
    run(c, 'find /tmp -name "*.sql" -o -name "*.gz" 2>/dev/null | head -10',
        label='13. SQL files in /tmp')
    run(c, 'ls -lh /root/*.sql /root/*.dump /root/*.gz 2>/dev/null || echo "No backups in /root"',
        label='13. Backups in /root')

    # ──────────────────────────────────────────────────────────────────────
    # 14. Check WAL / pg_basebackup hints
    # ──────────────────────────────────────────────────────────────────────
    psql_any(c, "SELECT pg_size_pretty(pg_database_size('Jagdamba_final'));",
             label='14. DB Size: Jagdamba_final')

    # ──────────────────────────────────────────────────────────────────────
    # 15. Check if backend process has correct env
    # ──────────────────────────────────────────────────────────────────────
    run(c, "pm2 jlist | python3 -c \"import sys,json; "
           "procs=json.load(sys.stdin); "
           "[print(p.get('name'),'env:',p.get('pm2_env',{}).get('DATABASE_URL','NOT SET')) "
           "for p in procs]\" 2>/dev/null || echo 'pm2 jlist parse failed'",
        label='15. PM2 process DATABASE_URL env var')

    run(c, f'cat /proc/$(pm2 pid api 2>/dev/null)/environ 2>/dev/null | tr "\\0" "\\n" | grep -E "DATABASE|PORT|DB_" || echo "Could not read process environ"',
        label='15. Live process DATABASE env')

    # ──────────────────────────────────────────────────────────────────────
    # 16. Check the controllers (especially erpController.js)
    # ──────────────────────────────────────────────────────────────────────
    run(c, f'cat {REMOTE_ROOT}/backend/src/controllers/erpController.js 2>/dev/null || echo "FILE MISSING"',
        label='16. erpController.js content')
    run(c, f'cat {REMOTE_ROOT}/backend/src/services/gstPortalService.js 2>/dev/null || echo "FILE MISSING"',
        label='16. gstPortalService.js content')

    # ──────────────────────────────────────────────────────────────────────
    # 17. Check package.json and node_modules
    # ──────────────────────────────────────────────────────────────────────
    run(c, f'cat {REMOTE_ROOT}/backend/package.json', label='17. backend package.json')
    run(c, f'ls {REMOTE_ROOT}/backend/node_modules | head -20', label='17. node_modules (first 20)')

    # ──────────────────────────────────────────────────────────────────────
    # 18. Check frontend build index.html and vite config
    # ──────────────────────────────────────────────────────────────────────
    run(c, f'cat {REMOTE_ROOT}/dist/index.html', label='18. dist/index.html')
    run(c, f'grep -r "5000\|localhost\|jagdambaprofile" {REMOTE_ROOT}/dist/assets/*.js 2>/dev/null | head -5 || echo "No matches or no JS assets"',
        label='18. Frontend API URL in built JS')

    # ──────────────────────────────────────────────────────────────────────
    # SUMMARY
    # ──────────────────────────────────────────────────────────────────────
    print('\n' + '='*70)
    print('  DIAGNOSTIC COMPLETE — Review output above for issues')
    print('='*70)

    c.close()

if __name__ == '__main__':
    main()
