"""Shared VPS deploy helpers — reliable SSH, keepalive, tar uploads."""

from __future__ import annotations

import os
import socket
import sys
import tarfile
import tempfile
import time
from typing import Iterable

import paramiko

HOST = '187.127.160.28'
HOSTNAME = 'jagdambaprofile.tech'
USER = 'root'
PW = 'Jagdamba@2026'
REMOTE_ROOT = '/root/JAGDAMBA-PROFILE'
CONNECT_TIMEOUT = 30
PORT_CHECK_TIMEOUT = 8
MAX_RETRIES = 8
KEEPALIVE_SEC = 25


def safe_print(text: str) -> None:
    print(text.encode('ascii', errors='replace').decode('ascii'))


def port_open(host: str, port: int, timeout: float = PORT_CHECK_TIMEOUT) -> bool:
    try:
        with socket.create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False


def connect_client() -> paramiko.SSHClient:
    """Connect to VPS — IP first (avoids flaky Windows DNS), SSH keepalive enabled."""
    last_error: Exception | None = None
    targets: list[str] = [HOST]
    if HOSTNAME and HOSTNAME != HOST:
        targets.append(HOSTNAME)

    for attempt in range(1, MAX_RETRIES + 1):
        if not port_open(HOST, 22):
            safe_print(f'SSH port 22 on {HOST} not reachable yet (attempt {attempt}/{MAX_RETRIES})...')
        for target in targets:
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
                transport = client.get_transport()
                if transport:
                    transport.set_keepalive(KEEPALIVE_SEC)
                safe_print(f'Connected to {target}.')
                return client
            except Exception as exc:
                last_error = exc
                safe_print(f'Connection failed for {target}: {exc}')
                try:
                    client.close()
                except Exception:
                    pass
        if attempt < MAX_RETRIES:
            wait = min(attempt * 4, 20)
            safe_print(f'Waiting {wait}s before retry...')
            time.sleep(wait)

    safe_print('')
    safe_print('SSH blocked or VPS offline. Try:')
    safe_print('  1. Hostinger hPanel -> VPS -> Security -> Firewall -> allow TCP 22, 80, 443')
    safe_print('  2. python fix_network_blocking.py')
    safe_print('  3. hPanel Browser terminal -> ufw allow 22,80,443/tcp')
    raise RuntimeError(f'Unable to connect to VPS after {MAX_RETRIES} attempts: {last_error}')


def run(client: paramiko.SSHClient, cmd: str, check: bool = True, timeout: int = 900) -> str:
    safe_print(f'\n>>> {cmd}')
    _, stdout, stderr = client.exec_command(cmd, get_pty=True, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out.strip():
        safe_print(out.strip())
    if err.strip():
        safe_print(err.strip())
    code = stdout.channel.recv_exit_status()
    if check and code != 0:
        raise RuntimeError(f'Command failed ({code}): {cmd}')
    return out


def sftp_put_with_retry(client: paramiko.SSHClient, local_path: str, remote_path: str, retries: int = 3) -> paramiko.SSHClient:
    last_error: Exception | None = None
    active = client
    for attempt in range(1, retries + 1):
        try:
            with active.open_sftp() as sftp:
                remote_dir = os.path.dirname(remote_path).replace('\\', '/')
                if remote_dir:
                    ensure_remote_dir(sftp, remote_dir)
                safe_print(f'Uploading {local_path} -> {remote_path}')
                sftp.put(local_path, remote_path)
            return active
        except Exception as exc:
            last_error = exc
            safe_print(f'Upload failed (attempt {attempt}/{retries}): {exc}')
            if attempt < retries:
                time.sleep(attempt * 2)
                try:
                    active.close()
                except Exception:
                    pass
                active = connect_client()
    raise RuntimeError(f'Upload failed for {local_path}: {last_error}')


def ensure_remote_dir(sftp: paramiko.SFTPClient, remote_dir: str) -> None:
    parts = remote_dir.replace('\\', '/').split('/')
    current = ''
    for part in parts:
        if not part:
            continue
        current = f'{current}/{part}' if current else part
        try:
            sftp.stat(current)
        except OSError:
            try:
                sftp.mkdir(current)
            except OSError:
                pass


def make_tarball(output_path: str, paths: Iterable[str], arc_prefix: str = '') -> int:
    """Create gzip tar of files/dirs. Returns number of items added."""
    count = 0
    skip_dirs = {'node_modules', '.git', '__pycache__'}
    with tarfile.open(output_path, 'w:gz') as tar:
        for path in paths:
            if not os.path.exists(path):
                raise FileNotFoundError(f'Missing path for deploy archive: {path}')
            if os.path.isdir(path):
                for root, dirs, files in os.walk(path):
                    dirs[:] = [d for d in dirs if d not in skip_dirs]
                    for name in files:
                        full = os.path.join(root, name)
                        arcname = os.path.join(arc_prefix, full).replace('\\', '/')
                        tar.add(full, arcname=arcname)
                        count += 1
            else:
                arcname = os.path.join(arc_prefix, path).replace('\\', '/')
                tar.add(path, arcname=arcname)
                count += 1
    return count


def upload_and_extract_tar(
    client: paramiko.SSHClient,
    local_tar: str,
    remote_tar: str,
    extract_cmd: str,
) -> paramiko.SSHClient:
    client = sftp_put_with_retry(client, local_tar, remote_tar)
    run(client, extract_cmd)
    return client


def deploy_via_archives(
    client: paramiko.SSHClient,
    src_paths: list[str],
    dist_path: str = 'dist',
) -> paramiko.SSHClient:
    """Fast deploy: upload 2 tar archives instead of hundreds of SFTP files."""
    if not os.path.isdir(dist_path):
        raise FileNotFoundError('Local dist/ missing. Run: npm run build')

    with tempfile.TemporaryDirectory() as tmp:
        src_tar = os.path.join(tmp, 'deploy_src.tar.gz')
        dist_tar = os.path.join(tmp, 'deploy_dist.tar.gz')

        safe_print('Packing source archive...')
        src_count = make_tarball(src_tar, src_paths)
        safe_print(f'  {src_count} source file(s) in archive')

        safe_print('Packing dist archive...')
        dist_count = make_tarball(dist_tar, [dist_path])
        safe_print(f'  {dist_count} dist file(s) in archive')

        remote_src = '/tmp/jagdamba_deploy_src.tar.gz'
        remote_dist = '/tmp/jagdamba_deploy_dist.tar.gz'

        client = upload_and_extract_tar(
            client,
            src_tar,
            remote_src,
            f'mkdir -p {REMOTE_ROOT} && tar xzf {remote_src} -C {REMOTE_ROOT} && rm -f {remote_src}',
        )
        client = upload_and_extract_tar(
            client,
            dist_tar,
            remote_dist,
            f'mkdir -p {REMOTE_ROOT}/dist && rm -rf {REMOTE_ROOT}/dist/* && tar xzf {remote_dist} -C {REMOTE_ROOT} && rm -f {remote_dist}',
        )
    return client


def restart_services(client: paramiko.SSHClient) -> None:
    run(client, f'cd {REMOTE_ROOT}/backend && pm2 delete api', check=False)
    run(client, f'cd {REMOTE_ROOT}/backend && pm2 start src/index.js --name api --update-env')

    # Prefer restart; if missing after a crash, start fresh
    whatsapp_out = run(client, 'pm2 describe whatsapp', check=False)
    if 'doesn\'t exist' in whatsapp_out or 'does not exist' in whatsapp_out.lower():
        run(
            client,
            f'cd {REMOTE_ROOT}/server && pm2 start src/index.js --name whatsapp --update-env',
            check=False,
        )
    else:
        run(client, 'pm2 restart whatsapp --update-env', check=False)

    run(
        client,
        f'cp {REMOTE_ROOT}/jagdamba_nginx.txt /etc/nginx/sites-available/jagdamba 2>/dev/null || '
        f'cp {REMOTE_ROOT}/jagdamba_nginx.txt /etc/nginx/sites-enabled/default 2>/dev/null || true',
        check=False,
    )
    run(client, 'nginx -t && systemctl reload nginx', check=False)
    run(client, 'pm2 save', check=False)
    run(client, 'pm2 startup systemd -u root --hp /root', check=False)
    run(client, 'pm2 status', check=False)

    # Block deploy success if API is not actually reachable (prevents cache/502 toasts)
    health = ''
    for attempt in range(1, 6):
        time.sleep(1)
        health = run(
            client,
            'curl -s --max-time 8 http://127.0.0.1:5000/api/health || true',
            check=False,
        )
        if '"status":"UP"' in health or '"database":"CONNECTED"' in health:
            safe_print(f'API health OK (attempt {attempt})')
            break
        safe_print(f'API health not ready yet (attempt {attempt}/5)...')
    else:
        raise RuntimeError(f'API failed health check after restart: {health[:300]}')

    run(client, 'curl -sI https://jagdambaprofile.tech/ | head -5', check=False)
    run(client, 'curl -skI https://jagdambaprofile.tech/api/health | head -8', check=False)
