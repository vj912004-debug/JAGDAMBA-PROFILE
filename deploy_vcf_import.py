import paramiko
import sys

HOST = '187.127.160.28'
USER = 'root'
PW = 'Jagdamba@2026'
REMOTE_ROOT = '/root/JAGDAMBA-PROFILE'

FILES = [
    (r'd:\j\src\projects\client\index.css', f'{REMOTE_ROOT}/src/projects/client/index.css'),
    (r'd:\j\src\projects\client\context\AppContext.jsx', f'{REMOTE_ROOT}/src/projects/client/context/AppContext.jsx'),
    (r'd:\j\src\projects\client\components\Layout\Header.jsx', f'{REMOTE_ROOT}/src/projects/client/components/Layout/Header.jsx'),
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
        for local, remote in FILES:
            safe_print(f'Uploading {local} -> {remote}')
            sftp.put(local, remote)

    run(client, f'cd {REMOTE_ROOT} && npm run build')
    run(
        client,
        f"python3 -c \"import glob; jp=glob.glob('{REMOTE_ROOT}/dist/assets/ClientApp-*.js')[0]; cp=glob.glob('{REMOTE_ROOT}/dist/assets/ClientApp-*.css')[0]; js=open(jp).read(); cs=open(cp).read(); print('SET_THEME in bundle:', 'SET_THEME' in js); print('theme-dark in CSS bundle:', 'theme-dark' in cs)\"",
    )
    run(client, 'pm2 restart frontend --update-env', check=False)
    run(client, 'pm2 save', check=False)

    client.close()
    safe_print('\nClient portal dark mode deployed successfully.')


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        safe_print(f'Deployment failed: {exc}')
        sys.exit(1)
