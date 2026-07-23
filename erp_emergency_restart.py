"""
EMERGENCY: API is down. Fix ecosystem.config (use .cjs extension) and restart.
"""
import sys, time, paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026',
          timeout=30, look_for_keys=False, allow_agent=False)
c.get_transport().set_keepalive(25)

ROOT = '/root/JAGDAMBA-PROFILE'

def run(cmd, label='', timeout=60):
    if label: print(f'\n{"="*60}\n[{label}]')
    print(f'>>> {cmd}')
    _, o, e = c.exec_command(cmd, timeout=timeout)
    out = o.read().decode('utf-8', errors='replace').strip()
    err = e.read().decode('utf-8', errors='replace').strip()
    if out: print(out[:5000])
    if err: print('ERR:', err[:2000])
    return out

# ── STEP 1: Write ecosystem as .cjs (avoids ES module conflict) ──────────────
print('\n=== STEP 1: Write ecosystem.config.cjs ===')

ecosystem = f"""module.exports = {{
  apps: [
    {{
      name: 'api',
      script: 'src/index.js',
      cwd: '{ROOT}/backend',
      interpreter: 'node',
      env: {{
        NODE_ENV: 'production',
        PORT: '5000',
        DATABASE_URL: 'postgresql://postgres:Vraj@2003@localhost:5432/jagdamba_final',
        SMTP_HOST: 'smtp.gmail.com',
        SMTP_PORT: '587',
        SMTP_USER: 'jagdambaprofile001@gmail.com',
        SMTP_PASS: 'Jagdamba@2002'
      }},
      max_memory_restart: '512M',
      restart_delay: 3000,
      max_restarts: 10,
      min_uptime: '10s',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      error_file: '/root/.pm2/logs/api-error.log',
      out_file: '/root/.pm2/logs/api-out.log'
    }},
    {{
      name: 'whatsapp',
      script: 'src/index.js',
      cwd: '{ROOT}/server',
      interpreter: 'node',
      max_memory_restart: '256M',
      restart_delay: 5000,
      max_restarts: 5,
      min_uptime: '10s',
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
      error_file: '/root/.pm2/logs/whatsapp-error.log',
      out_file: '/root/.pm2/logs/whatsapp-out.log'
    }}
  ]
}};
"""

# Write as .cjs to avoid ES module conflict
cmd = "cat > {ROOT}/ecosystem.config.cjs << 'PMEOF'\n{content}\nPMEOF".format(
    ROOT=ROOT, content=ecosystem)
run(cmd, label='Write ecosystem.config.cjs')

# Remove the broken .js version
run(f'rm -f {ROOT}/ecosystem.config.js', label='Remove broken .js version')

# Verify it's valid CJS
run(f'node --input-type=commonjs < {ROOT}/ecosystem.config.cjs && echo "CJS OK"',
    label='Validate CJS syntax')

# ── STEP 2: Start API immediately ─────────────────────────────────────────────
print('\n=== STEP 2: Restart API NOW ===')
run('pm2 delete api 2>/dev/null || true', label='Clean old api entry')
run(f'cd {ROOT} && pm2 start ecosystem.config.cjs --only api',
    label='Start api via ecosystem.config.cjs')
time.sleep(5)
run('pm2 status', label='PM2 status')
run('pm2 save', label='PM2 save')

# ── STEP 3: Update autostart script to use .cjs ───────────────────────────────
print('\n=== STEP 3: Update autostart script ===')
autostart = f"""#!/bin/bash
# /root/erp_autostart.sh — Auto-recovery on every boot/restore
LOG=/root/erp_boot.log
echo "$(date '+%Y-%m-%d %H:%M:%S') ERP autostart triggered" >> $LOG

sleep 10

systemctl is-active --quiet postgresql || systemctl start postgresql
systemctl is-active --quiet nginx || systemctl start nginx

cd {ROOT}
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

sleep 8
HTTP=$(curl -s -o /dev/null -w '%{{http_code}}' http://localhost:5000/api/health)
echo "$(date '+%Y-%m-%d %H:%M:%S') API health: HTTP $HTTP" >> $LOG

systemctl reload nginx
echo "$(date '+%Y-%m-%d %H:%M:%S') ERP autostart DONE" >> $LOG
"""
cmd2 = "cat > /root/erp_autostart.sh << 'SHEOF'\n{content}\nSHEOF".format(content=autostart)
run(cmd2, label='Update /root/erp_autostart.sh')
run('chmod +x /root/erp_autostart.sh', label='Make executable')
run('cat /root/erp_autostart.sh', label='Verify autostart script')

# ── STEP 4: Final verification ────────────────────────────────────────────────
print('\n=== STEP 4: FINAL VERIFY ===')
time.sleep(5)
run('curl -s http://localhost:5000/api/health', label='API Health')
run('curl -s -o /dev/null -w "HTTP %{http_code} (%{size_download} bytes)" http://localhost:5000/api/erp/data',
    label='GET /api/erp/data')
run('pm2 logs api --lines 10 --nostream 2>&1', label='PM2 logs (clean)')
run('pm2 status', label='Final PM2 status')

print('\n' + '='*60)
print('EMERGENCY FIX + PERMANENT SETUP COMPLETE')
print('='*60)
c.close()
