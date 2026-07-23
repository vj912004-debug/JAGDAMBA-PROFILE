"""
Fix VPS network / IP blocking issues.

Run when SSH works:
  python fix_network_blocking.py

If SSH also times out, fix Hostinger VPS firewall first (no terminal needed):
  1. Login: https://hpanel.hostinger.com
  2. VPS -> your server (187.127.160.28) -> Security -> Firewall
  3. Open your firewall group (or create one)
  4. Add Accept rules with Source = Anywhere (0.0.0.0/0):
       - TCP 22   (SSH)
       - TCP 80   (HTTP)
       - TCP 443  (HTTPS)
  5. Activate the firewall group on your VPS
  6. Or use Browser terminal in hPanel if firewall is off but UFW blocks you
"""

import sys
import time

import paramiko

HOST = '187.127.160.28'
HOSTNAME = 'jagdambaprofile.tech'
USER = 'root'
PW = 'Jagdamba@2026'
CONNECT_TIMEOUT = 45
MAX_RETRIES = 5

FIX_COMMANDS = [
    'echo "=== UFW status (before) ==="',
    'ufw status verbose 2>/dev/null || echo "ufw not installed"',
    'echo "=== fail2ban status ==="',
    'fail2ban-client status 2>/dev/null || echo "fail2ban not installed"',
    # Open essential ports for all IPs
    'ufw --force disable 2>/dev/null || true',
    'ufw --force reset 2>/dev/null || true',
    'ufw default deny incoming',
    'ufw default allow outgoing',
    'ufw allow 22/tcp comment "SSH all IPs"',
    'ufw allow 80/tcp comment "HTTP all IPs"',
    'ufw allow 443/tcp comment "HTTPS all IPs"',
    'ufw allow 5000/tcp comment "API"',
    'ufw allow 5001/tcp comment "WhatsApp API"',
    'ufw --force enable',
    # Unban all fail2ban jails (common cause of SSH lockout)
    'for jail in $(fail2ban-client status 2>/dev/null | awk -F: "/Jail list/ {gsub(/ /,\"\",$2); print $2}" | tr "," " "); do fail2ban-client unban --all "$jail" 2>/dev/null || true; done',
    'fail2ban-client reload 2>/dev/null || true',
    # Remove nginx geo / deny rules if any were added
    'grep -R "deny all" /etc/nginx/ 2>/dev/null || true',
    'nginx -t && systemctl restart nginx',
    'pm2 restart all --update-env || true',
    'pm2 save || true',
    'echo "=== UFW status (after) ==="',
    'ufw status numbered',
    'echo "=== Listening ports ==="',
    'ss -tlnp | grep -E ":22|:80|:443|:5000|:5001" || netstat -tlnp | grep -E ":22|:80|:443|:5000|:5001"',
    'curl -sI http://127.0.0.1/ | head -3 || true',
]


def safe_print(text: str) -> None:
    print(text.encode('ascii', errors='replace').decode('ascii'))


def connect() -> paramiko.SSHClient:
    last_error: Exception | None = None
    for attempt in range(1, MAX_RETRIES + 1):
        for target in (HOST, HOSTNAME):
            client = paramiko.SSHClient()
            client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
            try:
                safe_print(f'Connecting to {target} (attempt {attempt}/{MAX_RETRIES})...')
                client.connect(
                    target,
                    username=USER,
                    password=PW,
                    timeout=CONNECT_TIMEOUT,
                    banner_timeout=CONNECT_TIMEOUT,
                    auth_timeout=CONNECT_TIMEOUT,
                    look_for_keys=False,
                    allow_agent=False,
                )
                safe_print(f'Connected to {target}.')
                return client
            except Exception as exc:
                last_error = exc
                safe_print(f'Connection failed for {target}: {exc}')
                client.close()
        if attempt < MAX_RETRIES:
            time.sleep(attempt * 3)
    raise RuntimeError(f'Unable to connect to VPS: {last_error}')


def run(client: paramiko.SSHClient, cmd: str) -> None:
    safe_print(f'\n>>> {cmd}')
    _, stdout, stderr = client.exec_command(cmd, get_pty=True, timeout=120)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out.strip():
        safe_print(out.strip())
    if err.strip():
        safe_print(err.strip())


def main() -> int:
    safe_print('Jagdamba VPS — fix network / IP blocking')
    safe_print('=' * 50)

    try:
        client = connect()
    except RuntimeError as exc:
        safe_print(str(exc))
        safe_print('')
        safe_print('SSH is blocked. Fix Hostinger VPS firewall in hPanel:')
        safe_print('  1. https://hpanel.hostinger.com -> VPS -> Security -> Firewall')
        safe_print('  2. Add Accept rules (Source = Anywhere): TCP 22, 80, 443')
        safe_print('  3. Activate firewall on VPS 187.127.160.28')
        safe_print('  4. Or use hPanel Browser terminal -> ufw allow 22,80,443/tcp')
        safe_print('  4. Re-run: python fix_network_blocking.py')
        return 1

    try:
        for cmd in FIX_COMMANDS:
            run(client, cmd)
        safe_print('\nNetwork fix completed on VPS.')
        safe_print('Test from browser: https://jagdambaprofile.tech/')
        return 0
    finally:
        client.close()


if __name__ == '__main__':
    sys.exit(main())
