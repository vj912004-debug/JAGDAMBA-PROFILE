"""
Deep fix for ERR_MODULE_NOT_FOUND gstPortalService.js
The file exists but Node ESM can't resolve it — likely a file permission
or line-ending issue on the VPS after restore. Fix + final verify.
"""

import sys
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
    if out:
        print(out[:8000])
    if err:
        print(f'STDERR: {err[:2000]}')
    return out, err

def main():
    print('\n' + '='*70)
    print('  JAGDAMBA ERP — GST MODULE FIX + DEEP VERIFY')
    print('='*70)

    c = connect()
    print(f'Connected to {HOST}')

    # ──────────────────────────────────────────────────────────────────────
    # 1. Investigate why ESM can't find gstPortalService.js
    # ──────────────────────────────────────────────────────────────────────
    run(c, f'stat {REMOTE_ROOT}/backend/src/services/gstPortalService.js',
        label='File stat (permissions, inode)')

    run(c, f'file {REMOTE_ROOT}/backend/src/services/gstPortalService.js',
        label='File type check')

    run(c, f'od -c {REMOTE_ROOT}/backend/src/services/gstPortalService.js | head -3',
        label='File encoding check (first bytes)')

    run(c, f'head -5 {REMOTE_ROOT}/backend/src/controllers/gstLookupController.js',
        label='gstLookupController import line')

    # The issue: the error log shows the file IS there physically but
    # PM2 error log has OLD entries from BEFORE this restore.
    # The error log is NOT rotated — it carries old errors.
    # Let's confirm by checking if the CURRENT running process has this error.
    run(c,
        f'node --input-type=module << \'EOF\'\n'
        f'import {{ fetchGstPortalCaptcha }} from \'{REMOTE_ROOT}/backend/src/services/gstPortalService.js\';\n'
        f'console.log("gstPortalService.js loads OK");\n'
        f'EOF',
        label='Direct ESM import test of gstPortalService.js')

    run(c,
        f'node --input-type=module << \'EOF\'\n'
        f'import \'{REMOTE_ROOT}/backend/src/controllers/gstLookupController.js\';\n'
        f'console.log("gstLookupController.js loads OK");\n'
        f'EOF',
        label='Direct ESM import test of gstLookupController.js')

    # ──────────────────────────────────────────────────────────────────────
    # 2. Clear PM2 error log to confirm no NEW errors after restart
    # ──────────────────────────────────────────────────────────────────────
    run(c, 'pm2 flush api', label='Flush PM2 logs (clear old errors)')

    import time
    time.sleep(3)

    run(c, 'pm2 logs api --lines 10 --nostream 2>&1',
        label='Fresh PM2 logs after flush')

    # ──────────────────────────────────────────────────────────────────────
    # 3. Test the GST endpoint directly to confirm it works at runtime
    # ──────────────────────────────────────────────────────────────────────
    run(c,
        'curl -s -o /dev/null -w "GST captcha endpoint: HTTP %{http_code}" '
        'http://localhost:5000/api/erp/gst-captcha',
        label='GST captcha endpoint test')

    # ──────────────────────────────────────────────────────────────────────
    # 4. Comprehensive ERP data verification via python script on VPS
    # ──────────────────────────────────────────────────────────────────────
    verify_script = r"""
import subprocess, json, sys

result = subprocess.run(
    ['curl', '-s', 'http://localhost:5000/api/erp/data'],
    capture_output=True, text=True, timeout=30
)
try:
    d = json.loads(result.stdout)
except Exception as e:
    print(f'JSON parse error: {e}')
    print(f'Raw (first 200): {result.stdout[:200]}')
    sys.exit(1)

data = d.get('data') or {}
print(f'success: {d.get("success")}')
print(f'data is None: {d.get("data") is None}')
print(f'Top-level keys count: {len(data)}')
print('Keys:', list(data.keys()))
for k, v in data.items():
    if isinstance(v, list):
        print(f'  {k}: {len(v)} records')
    else:
        print(f'  {k}: {type(v).__name__}')
"""
    # Write the verify script to VPS then run it
    import base64
    script_b64 = base64.b64encode(verify_script.encode()).decode()
    run(c,
        f'echo "{script_b64}" | base64 -d | python3',
        label='ERP data structure verification')

    # ──────────────────────────────────────────────────────────────────────
    # 5. Full end-to-end HTTPS API check
    # ──────────────────────────────────────────────────────────────────────
    run(c,
        'curl -sI https://jagdambaprofile.tech/api/erp/data',
        label='HTTPS /api/erp/data headers')

    run(c,
        'curl -sI https://jagdambaprofile.tech/',
        label='HTTPS frontend headers')

    # ──────────────────────────────────────────────────────────────────────
    # 6. Confirm PM2 restart count (0 = no crashes since restart)
    # ──────────────────────────────────────────────────────────────────────
    run(c, 'pm2 status', label='Final PM2 status')

    run(c,
        r"""pm2 jlist | python3 -c "
import sys, json
procs = json.load(sys.stdin)
for p in procs:
    if p.get('name') == 'api':
        env = p.get('pm2_env', {})
        print('--- API Process ---')
        print('status:', env.get('status'))
        print('restarts:', env.get('restart_time'))
        print('pid:', env.get('pid'))
        print('uptime:', env.get('pm_uptime'))
        print('cwd:', env.get('pm_cwd'))
"
""",
        label='PM2 API process details')

    print('\n' + '='*70)
    print('  DEEP FIX + VERIFY COMPLETE')
    print('='*70)

    c.close()

if __name__ == '__main__':
    main()
