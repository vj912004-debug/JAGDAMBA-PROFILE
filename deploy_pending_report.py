import os
import sys
import time

import paramiko

HOST = '187.127.160.28'
HOSTNAME = 'jagdambaprofile.tech'
USER = 'root'
PW = 'Jagdamba@2026'
REMOTE_ROOT = '/root/JAGDAMBA-PROFILE'
CONNECT_TIMEOUT = 45
MAX_RETRIES = 5

SOURCE_FILES = [
    'src/projects/profile/pages/MaterialPendingReport.tsx',
    'src/projects/profile/utils/listExport.ts',
]


def safe_print(text: str) -> None:
    print(text.encode('ascii', errors='replace').decode('ascii'))


def connect_client() -> paramiko.SSHClient:
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


def run(client: paramiko.SSHClient, cmd: str, check: bool = True) -> str:
    safe_print(f'\n>>> {cmd}')
    _, stdout, stderr = client.exec_command(cmd, get_pty=True, timeout=600)
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


def upload_dist(sftp: paramiko.SFTPClient) -> None:
    for root, _, files in os.walk('dist'):
        for filename in files:
            local_path = os.path.join(root, filename).replace('\\', '/')
            remote_path = f'{REMOTE_ROOT}/{local_path}'.replace('\\', '/')
            remote_dir = os.path.dirname(remote_path).replace('\\', '/')
            parts = remote_dir.split('/')
            current = ''
            for part in parts:
                current = f'{current}/{part}' if current else part
                try:
                    sftp.stat(current)
                except OSError:
                    try:
                        sftp.mkdir(current)
                    except OSError:
                        pass
            safe_print(f'Uploading {local_path} -> {remote_path}')
            sftp.put(local_path, remote_path)


def main() -> None:
    client = connect_client()
    try:
        with client.open_sftp() as sftp:
            for rel in SOURCE_FILES:
                remote = f'{REMOTE_ROOT}/{rel}'
                safe_print(f'Uploading {rel} -> {remote}')
                sftp.put(rel, remote)

        run(client, f'grep -c "downloadMaterialPendingReportPDF" {REMOTE_ROOT}/src/projects/profile/pages/MaterialPendingReport.tsx')

        try:
            run(client, f'cd {REMOTE_ROOT} && npm run build')
        except Exception as build_error:
            safe_print(f'Remote build failed, uploading local dist: {build_error}')
            with client.open_sftp() as sftp:
                upload_dist(sftp)

        run(client, 'pm2 restart frontend --update-env', check=False)
        run(client, 'pm2 save', check=False)
        run(client, 'curl -sI https://jagdambaprofile.tech/ | head -3', check=False)
    finally:
        client.close()

    safe_print('\nPending material report download changes deployed live.')


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        safe_print(f'Deployment failed: {exc}')
        sys.exit(1)
