"""
Wait for VPS to respond, then fix firewall + restore nginx/pm2 + verify site.

Use when jagdambaprofile.tech shows ERR_CONNECTION_TIMED_OUT:

1. Hostinger hPanel -> VPS (187.127.160.28) -> Overview -> Reboot (or Start if stopped)
2. Security -> Firewall -> ensure Accept rules for TCP 22, 80, 443 (source: Anywhere)
3. Run: python restore_vps_live.py

This script waits for SSH, then fixes UFW, restarts services, and verifies HTTPS.
"""

from __future__ import annotations

import os
import subprocess
import sys
import time

import paramiko

HOST = '187.127.160.28'
HOSTNAME = 'jagdambaprofile.tech'
USER = 'root'
PW = 'Jagdamba@2026'
REMOTE_ROOT = '/root/JAGDAMBA-PROFILE'
CONNECT_TIMEOUT = 30
MAX_WAIT_MINUTES = 45
RETRY_EVERY_SEC = 20

FIX_COMMANDS = [
    'ufw --force disable 2>/dev/null || true',
    'ufw --force reset 2>/dev/null || true',
    'ufw default deny incoming',
    'ufw default allow outgoing',
    'ufw allow 22/tcp',
    'ufw allow 80/tcp',
    'ufw allow 443/tcp',
    'ufw allow 5000/tcp',
    'ufw allow 5001/tcp',
    'ufw --force enable',
    'for jail in $(fail2ban-client status 2>/dev/null | awk -F: "/Jail list/ {gsub(/ /,\"\",$2); print $2}" | tr "," " "); do fail2ban-client unban --all "$jail" 2>/dev/null || true; done',
    'fail2ban-client reload 2>/dev/null || true',
]

RESTORE_COMMANDS = [
    f'test -d {REMOTE_ROOT}/dist || (cd {REMOTE_ROOT} && npm run build)',
    'pm2 delete frontend',
    f'cd {REMOTE_ROOT}/backend && pm2 delete api',
    f'cd {REMOTE_ROOT}/backend && pm2 start src/index.js --name api --update-env',
    'pm2 restart whatsapp --update-env',
    'pm2 save',
    f'cp {REMOTE_ROOT}/jagdamba_nginx.txt /etc/nginx/sites-available/jagdamba',
    'ln -sf /etc/nginx/sites-available/jagdamba /etc/nginx/sites-enabled/jagdamba',
    'nginx -t && systemctl restart nginx',
    'systemctl is-active nginx',
    'pm2 status',
    'curl -sI https://jagdambaprofile.tech/ | head -5',
    'curl -sI http://127.0.0.1/ | head -5',
]


def safe_print(text: str) -> None:
    print(text.encode('ascii', errors='replace').decode('ascii'))


def try_connect() -> paramiko.SSHClient | None:
    for target in (HOST, HOSTNAME):
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        try:
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
            safe_print(f'  {target}: {exc}')
            client.close()
    return None


def wait_for_ssh() -> paramiko.SSHClient:
    deadline = time.time() + MAX_WAIT_MINUTES * 60
    attempt = 0
    safe_print('=' * 60)
    safe_print('VPS OFFLINE — waiting for SSH (reboot VPS in Hostinger hPanel)')
    safe_print('  https://hpanel.hostinger.com -> VPS -> Reboot')
    safe_print('  Firewall: open TCP 22, 80, 443 from Anywhere')
    safe_print('=' * 60)
    while time.time() < deadline:
        attempt += 1
        safe_print(f'\nAttempt {attempt}...')
        client = try_connect()
        if client:
            return client
        safe_print(f'Retrying in {RETRY_EVERY_SEC}s...')
        time.sleep(RETRY_EVERY_SEC)
    raise RuntimeError(
        f'VPS still unreachable after {MAX_WAIT_MINUTES} minutes. '
        'Reboot VPS in Hostinger hPanel and run this script again.'
    )


def run(client: paramiko.SSHClient, cmd: str, check: bool = False) -> str:
    safe_print(f'\n>>> {cmd}')
    _, stdout, stderr = client.exec_command(cmd, get_pty=True, timeout=600)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out.strip():
        safe_print(out.strip()[:8000])
    if err.strip():
        safe_print(err.strip()[:2000])
    code = stdout.channel.recv_exit_status()
    if check and code != 0:
        raise RuntimeError(f'Command failed ({code}): {cmd}')
    return out


def upload_local_dist(client: paramiko.SSHClient) -> None:
    local_dist = os.path.join(os.path.dirname(__file__), 'dist')
    if not os.path.isdir(local_dist):
        safe_print('No local dist/ — skipping upload (remote build will be used).')
        return
    safe_print('Uploading local dist/ as fallback...')
    with client.open_sftp() as sftp:
        remote_dist = f'{REMOTE_ROOT}/dist'

        def ensure_dir(path: str) -> None:
            parts = path.strip('/').split('/')
            cur = ''
            for part in parts:
                cur += f'/{part}'
                try:
                    sftp.stat(cur)
                except OSError:
                    sftp.mkdir(cur)

        count = 0
        for root, _, files in os.walk(local_dist):
            for name in files:
                local_path = os.path.join(root, name)
                rel = os.path.relpath(local_path, local_dist).replace('\\', '/')
                remote_path = f'{remote_dist}/{rel}'
                ensure_dir(os.path.dirname(remote_path))
                sftp.put(local_path, remote_path)
                count += 1
        safe_print(f'Uploaded {count} dist files.')


def main() -> int:
    if '--build' in sys.argv:
        safe_print('Building locally...')
        subprocess.run('npm run build', cwd=os.path.dirname(__file__), check=True, shell=True)

    client = wait_for_ssh()
    try:
        safe_print('\n--- Fixing firewall ---')
        for cmd in FIX_COMMANDS:
            run(client, cmd, check=False)

        safe_print('\n--- Restoring services ---')
        upload_local_dist(client)
        for cmd in RESTORE_COMMANDS:
            run(client, cmd, check=False)

        safe_print('\n' + '=' * 60)
        safe_print('RESTORE COMPLETE — open https://jagdambaprofile.tech/')
        safe_print('=' * 60)
        return 0
    finally:
        client.close()


if __name__ == '__main__':
    try:
        sys.exit(main())
    except KeyboardInterrupt:
        safe_print('\nCancelled.')
        sys.exit(130)
    except Exception as exc:
        safe_print(f'\nRestore failed: {exc}')
        sys.exit(1)
