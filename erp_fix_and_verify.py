"""
ERP Fix + Verify Script — Jagdamba Profile
Targets confirmed issues from diagnostic:
  1. PostgreSQL peer auth (use 'sudo -u postgres' instead of PGPASSWORD)
  2. DB name case mismatch (jagdamba_final vs Jagdamba_final)
  3. gstPortalService.js module not found in old error log
  4. Verify API data is actually served correctly
  5. Nginx config is up-to-date
  6. PM2 env vars loaded correctly
"""

import sys
import time
import paramiko

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HOST = '187.127.160.28'
USER = 'root'
PW   = 'Jagdamba@2026'
REMOTE_ROOT = '/root/JAGDAMBA-PROFILE'

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

def run(c, cmd, label='', timeout=120):
    if label:
        print(f'\n{DIVIDER}\n[{label}]\n>>> {cmd}')
    else:
        print(f'\n>>> {cmd}')
    _, o, e = c.exec_command(cmd, timeout=timeout)
    out = o.read().decode('utf-8', errors='replace').strip()
    err = e.read().decode('utf-8', errors='replace').strip()
    code = o.channel.recv_exit_status()
    if out:
        print(out[:10000])
    if err:
        print(f'STDERR: {err[:3000]}')
    return out, err, code

def psql(c, sql, label='', db='postgres'):
    """Run psql as postgres OS user (peer auth)."""
    # Escape single quotes in SQL
    safe_sql = sql.replace("'", "'\\''")
    cmd = f"sudo -u postgres psql -d {db} -c '{safe_sql}'"
    return run(c, cmd, label=label)

def main():
    print('\n' + '='*70)
    print('  JAGDAMBA ERP — FIX + VERIFY')
    print('='*70)

    c = connect()
    print(f'Connected to {HOST}')

    # ──────────────────────────────────────────────────────────────────────
    # STEP 1: PostgreSQL — use peer auth (sudo -u postgres)
    # ──────────────────────────────────────────────────────────────────────
    print('\n' + '='*70)
    print('STEP 1: PostgreSQL — list databases (peer auth)')
    print('='*70)

    psql(c, r'\l', label='All Databases')

    # ──────────────────────────────────────────────────────────────────────
    # STEP 2: Find the actual database name (case-insensitive check)
    # ──────────────────────────────────────────────────────────────────────
    print('\n' + '='*70)
    print('STEP 2: Find actual ERP database name')
    print('='*70)

    out, _, _ = psql(c,
        "SELECT datname FROM pg_database WHERE datistemplate=false ORDER BY datname;",
        label='All DB names')

    # Detect which DB name is used
    db_actual = None
    for line in out.splitlines():
        line = line.strip().lower()
        if 'jagdamba' in line:
            # Extract just the DB name
            name = line.strip()
            db_actual = name
            print(f'Found Jagdamba DB: {name}')

    if not db_actual:
        print('WARNING: Could not auto-detect DB name, defaulting to jagdamba_final')
        db_actual = 'jagdamba_final'

    # ──────────────────────────────────────────────────────────────────────
    # STEP 3: Check tables and row counts using peer auth
    # ──────────────────────────────────────────────────────────────────────
    print('\n' + '='*70)
    print(f'STEP 3: DB contents — {db_actual}')
    print('='*70)

    psql(c, r'\dt public.*', label='Tables', db=db_actual)

    psql(c,
        "SELECT schemaname, tablename, n_live_tup FROM pg_stat_user_tables WHERE schemaname='public' ORDER BY n_live_tup DESC;",
        label='Row Counts', db=db_actual)

    psql(c,
        "SELECT id, length(data::text) as data_bytes, version, updated_at FROM erp_data LIMIT 5;",
        label='erp_data sample', db=db_actual)

    psql(c,
        "SELECT pg_size_pretty(pg_database_size(current_database())) as db_size;",
        label='DB Size', db=db_actual)

    # ──────────────────────────────────────────────────────────────────────
    # STEP 4: Verify VPS .env DB name matches actual DB
    # ──────────────────────────────────────────────────────────────────────
    print('\n' + '='*70)
    print('STEP 4: Verify .env DATABASE_URL matches actual DB name')
    print('='*70)

    env_out, _, _ = run(c, f'cat {REMOTE_ROOT}/backend/.env', label='VPS .env')

    # Check if DATABASE_URL uses correct db name
    env_db = None
    for line in env_out.splitlines():
        if 'DATABASE_URL' in line and 'postgresql' in line:
            # Extract DB name from connection string
            # Format: postgresql://user:pass@host:port/DBNAME
            parts = line.strip().split('/')
            if parts:
                env_db = parts[-1].strip()
                print(f'\nEnv DB name: {env_db}')
                print(f'Actual DB:   {db_actual}')

                if env_db.lower() == db_actual.lower() and env_db != db_actual:
                    print(f'\n⚠️  CASE MISMATCH DETECTED: .env has "{env_db}" but actual DB is "{db_actual}"')
                    # Fix the .env
                    print('Fixing .env DATABASE_URL case...')
                    new_url = f'postgresql://postgres:Vraj@2003@localhost:5432/{db_actual}'
                    fix_cmd = (
                        f"sed -i 's|DATABASE_URL=.*|DATABASE_URL={new_url}|' "
                        f"{REMOTE_ROOT}/backend/.env"
                    )
                    run(c, fix_cmd, label='Fix .env DATABASE_URL')
                    run(c, f'cat {REMOTE_ROOT}/backend/.env', label='Updated .env')
                elif env_db == db_actual:
                    print(f'✅ .env DB name matches actual DB: {env_db}')
                else:
                    print(f'DB names differ — env:{env_db} vs actual:{db_actual}')

    # ──────────────────────────────────────────────────────────────────────
    # STEP 5: Create a backup of the database before any changes
    # ──────────────────────────────────────────────────────────────────────
    print('\n' + '='*70)
    print('STEP 5: Create PostgreSQL backup (safety first)')
    print('='*70)

    timestamp = int(time.time())
    backup_file = f'/root/jagdamba_backup_{timestamp}.sql'
    run(c,
        f'sudo -u postgres pg_dump {db_actual} > {backup_file} && echo "Backup created: {backup_file}" && ls -lh {backup_file}',
        label='Create DB Backup', timeout=180)

    # ──────────────────────────────────────────────────────────────────────
    # STEP 6: Verify gstPortalService.js is present and restart API cleanly
    # ──────────────────────────────────────────────────────────────────────
    print('\n' + '='*70)
    print('STEP 6: Verify source files and restart API')
    print('='*70)

    run(c, f'ls -la {REMOTE_ROOT}/backend/src/services/', label='Services dir')
    run(c, f'ls -la {REMOTE_ROOT}/backend/src/controllers/', label='Controllers dir')

    # Check if gstPortalService exists
    gst_out, _, gst_code = run(c,
        f'test -f {REMOTE_ROOT}/backend/src/services/gstPortalService.js && echo "EXISTS" || echo "MISSING"',
        label='gstPortalService.js check')

    if 'MISSING' in gst_out:
        print('⚠️  gstPortalService.js is MISSING — this will cause ERR_MODULE_NOT_FOUND crash')
        print('Creating stub gstPortalService.js...')
        # Create a working stub
        stub = """export async function fetchGstPortalCaptcha() {
  throw new Error('GST Portal service not available');
}
export async function fetchGstPortalCaptchaPng() {
  throw new Error('GST Portal service not available');
}
export async function fetchGstPortalTaxpayer() {
  throw new Error('GST Portal service not available');
}
"""
        stub_cmd = f"cat > {REMOTE_ROOT}/backend/src/services/gstPortalService.js << 'ENDOFFILE'\n{stub}\nENDOFFILE"
        run(c, stub_cmd, label='Create gstPortalService.js stub')
    else:
        print('✅ gstPortalService.js exists')

    # ──────────────────────────────────────────────────────────────────────
    # STEP 7: Ensure node_modules are installed
    # ──────────────────────────────────────────────────────────────────────
    print('\n' + '='*70)
    print('STEP 7: Verify node_modules')
    print('='*70)

    run(c, f'ls {REMOTE_ROOT}/backend/node_modules | wc -l', label='node_modules count')
    run(c, f'test -d {REMOTE_ROOT}/backend/node_modules/pg && echo "pg OK" || echo "pg MISSING"',
        label='pg module check')
    run(c, f'test -d {REMOTE_ROOT}/backend/node_modules/dotenv && echo "dotenv OK" || echo "dotenv MISSING"',
        label='dotenv module check')

    # Install if needed
    run(c,
        f'cd {REMOTE_ROOT}/backend && npm install --production 2>&1 | tail -5',
        label='npm install (ensure deps)', timeout=300)

    # ──────────────────────────────────────────────────────────────────────
    # STEP 8: Restart PM2 cleanly
    # ──────────────────────────────────────────────────────────────────────
    print('\n' + '='*70)
    print('STEP 8: Restart API via PM2')
    print('='*70)

    run(c, 'pm2 stop api', label='PM2 stop api')
    time.sleep(2)
    run(c,
        f'cd {REMOTE_ROOT}/backend && pm2 start src/index.js --name api --update-env',
        label='PM2 start api')
    time.sleep(5)
    run(c, 'pm2 status', label='PM2 status')

    # ──────────────────────────────────────────────────────────────────────
    # STEP 9: Verify nginx config and reload
    # ──────────────────────────────────────────────────────────────────────
    print('\n' + '='*70)
    print('STEP 9: Nginx config update and reload')
    print('='*70)

    run(c, f'ls /etc/nginx/sites-available/', label='nginx sites-available')
    run(c, f'ls /etc/nginx/sites-enabled/', label='nginx sites-enabled')

    # Copy our nginx config
    run(c,
        f'cp {REMOTE_ROOT}/jagdamba_nginx.txt /etc/nginx/sites-available/jagdamba && '
        f'ln -sf /etc/nginx/sites-available/jagdamba /etc/nginx/sites-enabled/jagdamba 2>/dev/null || true',
        label='Deploy nginx config')

    run(c, 'nginx -t', label='nginx config test')
    run(c, 'systemctl reload nginx', label='Reload nginx')

    # ──────────────────────────────────────────────────────────────────────
    # STEP 10: Final verification — API endpoints
    # ──────────────────────────────────────────────────────────────────────
    print('\n' + '='*70)
    print('STEP 10: Final API verification')
    print('='*70)

    time.sleep(3)

    # Health check
    run(c, 'curl -s http://localhost:5000/api/health', label='Health Check')

    # ERP data endpoint
    run(c, 'curl -s -o /dev/null -w "HTTP %{http_code} — Size: %{size_download} bytes" http://localhost:5000/api/erp/data',
        label='GET /api/erp/data')

    # Full data preview
    run(c, 'curl -s http://localhost:5000/api/erp/data | python3 -c "'
        'import sys,json; d=json.load(sys.stdin); data=d.get(\"data\",{}); '
        'print(\"success:\", d.get(\"success\")); '
        'print(\"top-level keys:\", list(data.keys()) if data else \"EMPTY/NULL\"); '
        '[print(f\"  {k}: {len(v) if isinstance(v,list) else type(v).__name__}\") '
        ' for k,v in (data or {}).items() if isinstance(v,list)]"',
        label='ERP Data structure')

    # HTTPS test
    run(c, 'curl -sI https://jagdambaprofile.tech/ | head -5', label='HTTPS frontend')
    run(c,
        'curl -s -o /dev/null -w "HTTPS API: HTTP %{http_code} — %{size_download} bytes" '
        'https://jagdambaprofile.tech/api/erp/data',
        label='HTTPS /api/erp/data')

    # PM2 save
    run(c, 'pm2 save', label='PM2 save')

    # Last PM2 log lines
    run(c, 'pm2 logs api --lines 20 --nostream 2>&1', label='Final PM2 logs')

    print('\n' + '='*70)
    print('  FIX + VERIFY COMPLETE')
    print('='*70)

    c.close()

if __name__ == '__main__':
    main()
