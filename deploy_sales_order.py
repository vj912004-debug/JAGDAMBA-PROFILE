import paramiko
import sys

HOST = '187.127.160.28'
USER = 'root'
PW = 'Jagdamba@2026'
REMOTE_ROOT = '/root/JAGDAMBA-PROFILE'

FILES = [
    'src/projects/profile/components/SalesOrderPrint.tsx',
    'src/projects/profile/utils/salesOrderDownload.tsx',
    'src/projects/profile/utils/pdfGenerator.ts',
    'src/projects/profile/pages/OrderEntry.tsx',
    'src/projects/profile/pages/ProductionList.tsx',
]


def safe_print(text: str) -> None:
    print(text.encode('ascii', errors='replace').decode('ascii'))


def run(client, cmd: str, check: bool = True) -> str:
    safe_print(f'\n>>> {cmd}')
    stdin, stdout, stderr = client.exec_command(cmd, get_pty=True)
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
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    safe_print(f'Connecting to {HOST}...')
    client.connect(HOST, username=USER, password=PW)
    safe_print('Connected.')

    with client.open_sftp() as sftp:
        for rel in FILES:
            local = rel.replace('\\', '/')
            remote = f'{REMOTE_ROOT}/{local}'
            safe_print(f'Uploading {local} -> {remote}')
            with open(local, 'r', encoding='utf-8') as src:
                with sftp.file(remote, 'w') as dst:
                    dst.write(src.read())

    run(client, f'grep "SALES ORDER" {REMOTE_ROOT}/src/projects/profile/components/SalesOrderPrint.tsx | head -1')
    run(client, f'test -f {REMOTE_ROOT}/src/projects/profile/utils/salesOrderDownload.tsx && echo salesOrderDownload.tsx OK')
    run(client, f'cd {REMOTE_ROOT} && npm run build')
    run(
        client,
        f"python3 -c \"import glob; p=glob.glob('{REMOTE_ROOT}/dist/assets/ProfileApp-*.js')[0]; s=open(p).read(); print('SALES ORDER in bundle:', 'SALES ORDER' in s); print('salesOrderDownload in bundle:', 'SalesOrder' in s)\"",
    )
    run(client, 'pm2 restart frontend --update-env', check=False)
    run(client, 'pm2 save', check=False)

    client.close()
    safe_print('\nSales Order PDF format deployed to live VPS successfully.')


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        safe_print(f'Deployment failed: {exc}')
        sys.exit(1)
