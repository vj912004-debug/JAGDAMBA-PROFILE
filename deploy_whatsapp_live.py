import paramiko
import sys
import time

HOST = '187.127.160.28'
USER = 'root'
PW = 'Jagdamba@2026'
REMOTE_ROOT = '/root/JAGDAMBA-PROFILE'
BINARY_FILES = {'public/logo.png', 'public/logo-print.jpg'}

FILES = [
    'public/logo.png',
    'public/logo-print.jpg',
    'server/src/lib/whatsapp.js',
    'src/projects/profile/utils/logoBase64.ts',
    'src/projects/profile/utils/logoPrintBase64.ts',
    'src/projects/profile/components/PurchaseOrderPrint.tsx',
    'src/projects/profile/components/ChallanPrint.tsx',
    'src/projects/profile/utils/pdfGenerator.ts',
    'src/projects/profile/utils/whatsappApi.ts',
    'src/projects/profile/utils/poNumber.ts',
    'src/projects/profile/utils/excel.ts',
    'src/projects/profile/utils/partyExcel.ts',
    'src/projects/profile/store/AppContext.tsx',
    'src/projects/profile/components/Dashboard.tsx',
    'src/projects/profile/components/WhatsAppConnectControl.tsx',
    'src/projects/profile/pages/PartyMaster.tsx',
    'src/projects/profile/pages/PurchaseOrderEntry.tsx',
    'src/projects/profile/pages/PurchaseReports.tsx',
    'src/projects/profile/pages/TCManagement.tsx',
    'vite.config.ts',
]

NGINX_CONFIG = """
server {
    server_name jagdambaprofile.tech www.jagdambaprofile.tech;

    root /root/JAGDAMBA-PROFILE/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/whatsapp/ {
        proxy_pass http://localhost:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection upgrade;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 50m;
    }

    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection upgrade;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 50m;
    }

    listen 443 ssl;
    ssl_certificate /etc/letsencrypt/live/jagdambaprofile.tech/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/jagdambaprofile.tech/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;
}

server {
    if ($host = www.jagdambaprofile.tech) {
        return 301 https://$host$request_uri;
    }

    if ($host = jagdambaprofile.tech) {
        return 301 https://$host$request_uri;
    }

    listen 80;
    server_name jagdambaprofile.tech www.jagdambaprofile.tech;
    return 404;
}
"""


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
            if local in BINARY_FILES:
                sftp.put(local, remote)
            else:
                with open(local, 'r', encoding='utf-8') as src:
                    with sftp.file(remote, 'w') as dst:
                        dst.write(src.read())

        with sftp.file('/etc/nginx/sites-available/jagdamba', 'w') as f:
            f.write(NGINX_CONFIG)

    run(client, 'nginx -t && systemctl restart nginx')
    run(client, f'cd {REMOTE_ROOT} && npm run build')
    run(client, 'pm2 restart whatsapp --update-env')
    run(client, 'pm2 restart api --update-env')
    run(client, 'pm2 save')

    run(client, 'curl -s -X POST http://localhost:5001/api/whatsapp/init', check=False)
    time.sleep(8)

    status = run(client, 'curl -s http://localhost:5001/api/whatsapp/status', check=False)
    safe_print(f'\nWhatsApp status: {status.strip()}')

    test = run(
        client,
        'curl -s -X POST https://jagdambaprofile.tech/api/whatsapp/send-media '
        '-H "Content-Type: application/json" '
        '-d \'{"number":"9824042755","mediaData":"test"}\'',
        check=False,
    )
    safe_print(f'\nLive endpoint test: {test.strip()}')

    client.close()
    safe_print('\nLive VPS updated successfully.')


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        safe_print(f'Deployment failed: {exc}')
        sys.exit(1)
