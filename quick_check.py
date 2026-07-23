"""Quick live check — what's broken right now."""
import sys, paramiko
sys.stdout.reconfigure(encoding='utf-8', errors='replace')

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026',
          timeout=30, look_for_keys=False, allow_agent=False)

def run(cmd, timeout=30):
    print(f'\n>>> {cmd}')
    _, o, e = c.exec_command(cmd, timeout=timeout)
    out = o.read().decode('utf-8', errors='replace').strip()
    err = e.read().decode('utf-8', errors='replace').strip()
    if out: print(out[:4000])
    if err: print('ERR:', err[:1000])
    return out

run('uptime')
run('pm2 status')
run('pm2 logs api --lines 15 --nostream 2>&1')
run('curl -s -o /dev/null -w "API /erp/data: HTTP %{http_code}" http://localhost:5000/api/erp/data')
run('curl -s http://localhost:5000/api/health')
run('curl -sI https://jagdambaprofile.tech/ | head -4')
run('systemctl is-active nginx')
run('systemctl is-active postgresql')
# Check if pm2 startup is configured
run('systemctl is-active pm2-root 2>/dev/null || systemctl status pm2-root 2>&1 | head -5 || echo "pm2 startup NOT configured"')

c.close()
print('\nDone.')
