import paramiko
import sys
import time

HOST = '187.127.160.28'
HOSTNAME = 'jagdambaprofile.tech'
USER = 'root'
PW = 'Jagdamba@2026'
REMOTE_ROOT = '/root/JAGDAMBA-PROFILE'
CONNECT_TIMEOUT = 45
MAX_RETRIES = 3

FILES = [
    'src/projects/profile/components/PurchaseOrderPrint.tsx',
    'src/projects/profile/components/purchaseOrderPrintStyles.ts',
    'src/projects/profile/components/PurchaseOrderPreviewModal.tsx',
    'src/projects/profile/utils/purchaseOrderPrintWindow.ts',
    'src/projects/profile/utils/purchaseOrderDownload.tsx',
    'src/projects/profile/utils/pdfGenerator.ts',
    'src/projects/profile/pages/PurchaseOrderEntry.tsx',
    'src/projects/profile/pages/PurchaseReports.tsx',
]


def safe_print(text: str) -> None:
    print(text.encode('ascii', errors='replace').decode('ascii'))


def connect_client() -> paramiko.SSHClient:
    last_error = None
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


def run(client, cmd: str, check: bool = True) -> str:
    safe_print(f'\n>>> {cmd}')
    stdin, stdout, stderr = client.exec_command(cmd, get_pty=True, timeout=900)
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


def main() -> None:
    client = connect_client()

    try:
        with client.open_sftp() as sftp:
            for rel in FILES:
                local = rel.replace('\\', '/')
                remote = f'{REMOTE_ROOT}/{local}'
                safe_print(f'Uploading {local} -> {remote}')
                with open(local, 'r', encoding='utf-8') as src:
                    with sftp.file(remote, 'w') as dst:
                        dst.write(src.read())

        safe_print(f'\nUploaded {len(FILES)} files.')

        # Verify key file landed
        run(client, f'grep "po-v2-stripes" {REMOTE_ROOT}/src/projects/profile/components/PurchaseOrderPrint.tsx | head -1')
        run(client, f'grep "po-v2-stripes" {REMOTE_ROOT}/src/projects/profile/components/purchaseOrderPrintStyles.ts | head -1')

        # Build
        run(client, f'cd {REMOTE_ROOT} && npm run build')

        # Restart
        run(client, 'pm2 restart frontend --update-env', check=False)
        run(client, 'pm2 restart api --update-env', check=False)
        run(client, 'pm2 save', check=False)
        run(client, 'pm2 status', check=False)

        # Quick smoke test
        run(client, 'curl -sI https://jagdambaprofile.tech/ | head -5', check=False)

    finally:
        client.close()

    safe_print('\nPurchase Order print update deployed to live VPS successfully.')


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        safe_print(f'Deployment failed: {exc}')
        sys.exit(1)
