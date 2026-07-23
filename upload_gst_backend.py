import os
import paramiko

ROOT = '/root/JAGDAMBA-PROFILE'
c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=45)
sftp = c.open_sftp()

files = [
    ('backend/src/services/gstPortalService.js', f'{ROOT}/backend/src/services/gstPortalService.js'),
    ('backend/src/controllers/gstLookupController.js', f'{ROOT}/backend/src/controllers/gstLookupController.js'),
    ('backend/src/routes/erp.js', f'{ROOT}/backend/src/routes/erp.js'),
]

for local, remote in files:
    dirname = os.path.dirname(remote)
    try:
        sftp.stat(dirname)
    except OSError:
        parts = dirname.split('/')
        cur = ''
        for part in parts:
            if not part:
                continue
            cur = f'{cur}/{part}' if cur else part
            try:
                sftp.mkdir(cur)
            except OSError:
                pass
    print('upload', local)
    sftp.put(local, remote)

sftp.close()

for cmd in [
    f'cd {ROOT}/backend && pm2 delete api',
    f'cd {ROOT}/backend && pm2 start src/index.js --name api --update-env',
    'pm2 save',
    f'curl -s {ROOT}/backend/src/services/gstPortalService.js | wc -c',
    'curl -s http://127.0.0.1:5000/api/erp/gst-captcha | head -c 80',
]:
    print('\n>>>', cmd)
    _, o, e = c.exec_command(cmd)
    print(o.read().decode('utf-8', errors='replace').strip())

c.close()
