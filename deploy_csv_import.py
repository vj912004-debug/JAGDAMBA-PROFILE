import paramiko
import sys

HOST = '187.127.160.28'
USER = 'root'
PW = 'Jagdamba@2026'
REMOTE_ROOT = '/root/JAGDAMBA-PROFILE'

UPLOADS = [
    (r'd:\j\src\projects\client\utils\excel.js',                     'src/projects/client/utils/excel.js'),
    (r'd:\j\src\projects\client\utils\api.js',                       'src/projects/client/utils/api.js'),
    (r'd:\j\src\projects\client\context\AppContext.jsx',             'src/projects/client/context/AppContext.jsx'),
    (r'd:\j\src\projects\client\pages\Contacts\ContactList.jsx',     'src/projects/client/pages/Contacts/ContactList.jsx'),
]


def sp(text):
    print(text.encode('ascii', errors='replace').decode('ascii'))


def run(client, cmd, check=True):
    sp(f'\n>>> {cmd}')
    _, stdout, stderr = client.exec_command(cmd, get_pty=True)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    if out.strip(): sp(out.strip())
    if err.strip(): sp(err.strip())
    code = stdout.channel.recv_exit_status()
    if check and code != 0:
        raise RuntimeError(f'Command failed ({code}): {cmd}')
    return out


def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    sp(f'Connecting to {HOST}...')
    client.connect(HOST, username=USER, password=PW)
    sp('Connected.')

    with client.open_sftp() as sftp:
        for local, rel in UPLOADS:
            sp(f'Uploading {rel}')
            sftp.put(local, f'{REMOTE_ROOT}/{rel}')

    sp('\nAll files uploaded. Building...')
    run(client, f'cd {REMOTE_ROOT} && npm run build')
    run(client, 'pm2 restart frontend --update-env', check=False)
    run(client, 'pm2 save', check=False)

    client.close()
    sp('\nCSV import feature deployed successfully.')


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        sp(f'Deployment failed: {exc}')
        sys.exit(1)
