"""Restore live portal: rebuild dist, fix PM2, reload nginx."""
from __future__ import annotations

import os
import subprocess
import sys
import time

import paramiko

HOST = '187.127.160.28'
USER = 'root'
PW = 'Jagdamba@2026'
REMOTE_ROOT = '/root/JAGDAMBA-PROFILE'


def safe_print(text: str) -> None:
    print(text.encode('ascii', errors='replace').decode('ascii'))


def run_local_build() -> None:
    safe_print('Building locally...')
    subprocess.run('npm run build', cwd=os.path.dirname(__file__), check=True, shell=True)


def connect() -> paramiko.SSHClient:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PW, timeout=45)
    return client


def ssh_run(client: paramiko.SSHClient, cmd: str, check: bool = False) -> str:
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


def upload_dist(client: paramiko.SSHClient) -> None:
    local_dist = os.path.join(os.path.dirname(__file__), 'dist')
    if not os.path.isdir(local_dist):
        raise FileNotFoundError('dist/ missing after build')

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
        for root, dirs, files in os.walk(local_dist):
            for name in files:
                local_path = os.path.join(root, name)
                rel = os.path.relpath(local_path, local_dist).replace('\\', '/')
                remote_path = f'{remote_dist}/{rel}'
                ensure_dir(os.path.dirname(remote_path))
                sftp.put(local_path, remote_path)
                count += 1
        safe_print(f'Uploaded {count} dist files.')


def main() -> None:
    if '--skip-build' not in sys.argv:
        run_local_build()
    client = connect()
    try:
        upload_dist(client)

        # Nginx serves static dist directly — remove broken frontend PM2 (serve on random ports / wrong cwd).
        ssh_run(client, 'pm2 delete frontend', check=False)

        ssh_run(client, f'cd {REMOTE_ROOT}/backend && pm2 delete api', check=False)
        ssh_run(client, f'cd {REMOTE_ROOT}/backend && pm2 start src/index.js --name api --update-env')
        ssh_run(client, 'pm2 save', check=False)

        ssh_run(client, 'pm2 restart whatsapp --update-env', check=False)

        ssh_run(client, f'cp {REMOTE_ROOT}/jagdamba_nginx.txt /etc/nginx/sites-available/jagdamba')
        ssh_run(client, 'ln -sf /etc/nginx/sites-available/jagdamba /etc/nginx/sites-enabled/jagdamba')
        ssh_run(client, 'nginx -t && systemctl reload nginx')

        time.sleep(2)
        ssh_run(client, 'pm2 status', check=False)
        ssh_run(client, 'curl -sI https://jagdambaprofile.tech/ | head -5', check=False)
        ssh_run(client, 'curl -sI https://jagdambaprofile.tech/api/erp/data | head -5', check=False)
        ssh_run(client, 'curl -s https://jagdambaprofile.tech/ | head -12', check=False)
    finally:
        client.close()

    safe_print('\nLive portal restore completed.')


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        safe_print(f'Restore failed: {exc}')
        sys.exit(1)
