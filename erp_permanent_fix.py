"""
PERMANENT FIX — Jagdamba ERP
Prevents the portal from ever appearing blank after restores/reboots.

Problems to fix permanently:
1. PM2 logs accumulate old errors, confusing diagnosis
2. PM2 ecosystem file missing (makes restart fragile)  
3. No log rotation configured
4. No healthcheck / auto-recovery script on the VPS
5. nginx default site conflicts
6. No pm2 --time flag (timestamps missing from logs)
"""
import sys, time, paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

HOST = '187.127.160.28'
USER = 'root'
PW   = 'Jagdamba@2026'
ROOT = '/root/JAGDAMBA-PROFILE'

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect(HOST, username=USER, password=PW, timeout=30,
          look_for_keys=False, allow_agent=False)
c.get_transport().set_keepalive(25)

def run(cmd, label='', timeout=120):
    if label: print(f'\n{"="*60}\n[{label}]')
    print(f'>>> {cmd}')
    _, o, e = c.exec_command(cmd, timeout=timeout)
    out = o.read().decode('utf-8', errors='replace').strip()
    err = e.read().decode('utf-8', errors='replace').strip()
    if out: print(out[:6000])
    if err: print('ERR:', err[:2000])
    return out

# ─────────────────────────────────────────────────────────────────────────────
# FIX 1: Create a rock-solid PM2 ecosystem config file
# ─────────────────────────────────────────────────────────────────────────────
ecosystem_js = f"""module.exports = {{
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
      out_file: '/root/.pm2/logs/api-out.log',
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
      out_file: '/root/.pm2/logs/whatsapp-out.log',
    }}
  ]
}};
"""

# Write ecosystem file
run(f"cat > {ROOT}/ecosystem.config.js << 'ENDCONFIG'\n{ecosystem_js}\nENDCONFIG",
    label='FIX 1: Write ecosystem.config.js')

run(f'cat {ROOT}/ecosystem.config.js', label='Verify ecosystem.config.js')

# ─────────────────────────────────────────────────────────────────────────────
# FIX 2: Configure PM2 log rotation to prevent log bloat/confusion
# ─────────────────────────────────────────────────────────────────────────────
run('pm2 install pm2-logrotate 2>&1 | tail -5',
    label='FIX 2: Install pm2-logrotate', timeout=120)
run('pm2 set pm2-logrotate:max_size 10M', label='Log rotation max size 10M')
run('pm2 set pm2-logrotate:retain 3',     label='Keep 3 log files')
run('pm2 set pm2-logrotate:compress true',label='Compress rotated logs')
run('pm2 set pm2-logrotate:rotateInterval "0 0 * * *"',
    label='Rotate daily at midnight')

# ─────────────────────────────────────────────────────────────────────────────
# FIX 3: Write a VPS auto-recover script (runs on reboot via cron)
# ─────────────────────────────────────────────────────────────────────────────
recover_sh = f"""#!/bin/bash
# /root/erp_autostart.sh — Runs on boot to ensure ERP is up
# Triggered by @reboot cron

LOG=/root/erp_boot.log
echo "$(date '+%Y-%m-%d %H:%M:%S') — ERP autostart triggered" >> $LOG

# Wait for network
sleep 10

# Ensure PostgreSQL is up
systemctl is-active --quiet postgresql || systemctl start postgresql
echo "$(date '+%Y-%m-%d %H:%M:%S') PostgreSQL: $(systemctl is-active postgresql)" >> $LOG

# Ensure Nginx is up  
systemctl is-active --quiet nginx || systemctl start nginx
echo "$(date '+%Y-%m-%d %H:%M:%S') Nginx: $(systemctl is-active nginx)" >> $LOG

# Restart PM2 with ecosystem file (env vars baked in — no .env dependency)
cd {ROOT}
pm2 delete all 2>/dev/null || true
pm2 start ecosystem.config.js
pm2 save
echo "$(date '+%Y-%m-%d %H:%M:%S') PM2 started" >> $LOG

# Wait for API to be ready
sleep 8
HTTP=$(curl -s -o /dev/null -w '%{{http_code}}' http://localhost:5000/api/health)
echo "$(date '+%Y-%m-%d %H:%M:%S') API health: HTTP $HTTP" >> $LOG

# Reload nginx to clear any cached state
systemctl reload nginx
echo "$(date '+%Y-%m-%d %H:%M:%S') Nginx reloaded" >> $LOG

echo "$(date '+%Y-%m-%d %H:%M:%S') — ERP autostart DONE" >> $LOG
"""

run(f"cat > /root/erp_autostart.sh << 'ENDSCRIPT'\n{recover_sh}\nENDSCRIPT",
    label='FIX 3: Write /root/erp_autostart.sh')
run('chmod +x /root/erp_autostart.sh', label='Make autostart executable')

# ─────────────────────────────────────────────────────────────────────────────
# FIX 4: Add @reboot cron entry
# ─────────────────────────────────────────────────────────────────────────────
run("crontab -l 2>/dev/null | grep -v 'erp_autostart' > /tmp/cron_clean.txt; "
    "echo '@reboot /root/erp_autostart.sh >> /root/erp_boot.log 2>&1' >> /tmp/cron_clean.txt; "
    "crontab /tmp/cron_clean.txt",
    label='FIX 4: Add @reboot cron entry')
run('crontab -l', label='Current crontab')

# ─────────────────────────────────────────────────────────────────────────────
# FIX 5: Reload PM2 with ecosystem now (bakes env vars in — no .env race)
# ─────────────────────────────────────────────────────────────────────────────
run(f'cd {ROOT} && pm2 delete api 2>/dev/null || true',
    label='FIX 5: Remove old api process')
run(f'cd {ROOT} && pm2 start ecosystem.config.js --only api',
    label='Start api via ecosystem (env vars baked in)')
time.sleep(5)
run('pm2 status', label='PM2 status after ecosystem start')
run('pm2 save', label='PM2 save (persist to dump.pm2)')

# ─────────────────────────────────────────────────────────────────────────────
# FIX 6: Disable nginx 'default' site that could intercept requests
# ─────────────────────────────────────────────────────────────────────────────
run('ls /etc/nginx/sites-enabled/', label='Current nginx enabled sites')
run('rm -f /etc/nginx/sites-enabled/default', label='FIX 6: Disable nginx default site')
run('nginx -t && systemctl reload nginx', label='Nginx reload')

# ─────────────────────────────────────────────────────────────────────────────
# VERIFY everything is healthy
# ─────────────────────────────────────────────────────────────────────────────
time.sleep(5)
run('pm2 logs api --lines 10 --nostream 2>&1', label='VERIFY: Fresh PM2 logs')
run('curl -s http://localhost:5000/api/health', label='VERIFY: API health')
run('curl -s -o /dev/null -w "API data: HTTP %{http_code} (%{size_download} bytes)" http://localhost:5000/api/erp/data',
    label='VERIFY: /api/erp/data')
run('curl -sI https://jagdambaprofile.tech/ | head -4', label='VERIFY: HTTPS frontend')

print('\n' + '='*60)
print('ALL PERMANENT FIXES APPLIED')
print('='*60)

c.close()
