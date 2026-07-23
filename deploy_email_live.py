import paramiko
import sys
import time

HOST = '187.127.160.28'
USER = 'root'
PW = 'Jagdamba@2026'
REMOTE_ROOT = '/root/JAGDAMBA-PROFILE'

FILES = [
    'src/projects/profile/pages/TCManagement.tsx',
    'backend/src/controllers/mailController.js',
    'backend/src/routes/mail.js',
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

    run(client, f'grep -c "Email Connection Control" {REMOTE_ROOT}/src/projects/profile/pages/TCManagement.tsx')
    run(client, f'grep -c "getMailStatus" {REMOTE_ROOT}/backend/src/controllers/mailController.js')
    run(client, f'cd {REMOTE_ROOT} && npm run build')
    run(client, 'pm2 restart api --update-env')
    run(client, 'pm2 save')

    status = run(client, 'curl -s http://localhost:5000/api/mail/status', check=False)
    safe_print(f'\nMail status: {status.strip()}')

    verify = run(client, 'curl -s -X POST http://localhost:5000/api/mail/verify', check=False)
    safe_print(f'\nMail verify: {verify.strip()}')

    built = run(
        client,
        f'grep -r "Email:" {REMOTE_ROOT}/dist/assets/*.js 2>/dev/null | head -1',
        check=False,
    )
    safe_print(f'\nBuilt bundle check: {"found" if built.strip() else "NOT FOUND"}')

    client.close()
    safe_print('\nEmail feature deployed to VPS successfully.')


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        safe_print(f'Deployment failed: {exc}')
        sys.exit(1)
