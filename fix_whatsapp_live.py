import paramiko
import sys
import time

HOST = '187.127.160.28'
USER = 'root'
PW = 'Jagdamba@2026'
REMOTE_ROOT = '/root/JAGDAMBA-PROFILE'

NGINX_CONFIG = """server {
    server_name jagdambaprofile.tech www.jagdambaprofile.tech;

    root /root/JAGDAMBA-PROFILE/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/whatsapp/ {
        proxy_pass http://127.0.0.1:5001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection upgrade;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        client_max_body_size 50m;
        proxy_connect_timeout 60s;
        proxy_read_timeout 120s;
    }

    location /api/ {
        client_max_body_size 50m;
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection upgrade;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
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


def run(client: paramiko.SSHClient, cmd: str, check: bool = False) -> str:
    safe_print(f'\n>>> {cmd}')
    _, stdout, stderr = client.exec_command(cmd, get_pty=True, timeout=180)
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


def diagnose(client: paramiko.SSHClient) -> None:
    run(client, 'pm2 status')
    run(client, 'pm2 describe whatsapp 2>/dev/null | head -50')
    run(client, 'ss -tlnp | grep 5001 || true')
    run(client, 'ss -tlnp | grep 5000 || true')
    run(client, 'curl -s -o /dev/null -w "local5001: %{http_code} ct=%{content_type}\\n" http://127.0.0.1:5001/api/whatsapp/status')
    run(client, 'curl -s http://127.0.0.1:5001/api/whatsapp/status | head -c 400')
    run(client, 'curl -s -o /dev/null -w "live: %{http_code} ct=%{content_type}\\n" https://jagdambaprofile.tech/api/whatsapp/status')
    run(client, 'curl -s https://jagdambaprofile.tech/api/whatsapp/status | head -c 400')
    run(client, 'grep -A8 "location /api/whatsapp" /etc/nginx/sites-available/jagdamba 2>/dev/null || true')
    run(client, 'pm2 logs whatsapp --lines 25 --nostream')


def fix(client: paramiko.SSHClient) -> None:
    safe_print('\n=== Fixing WhatsApp service ===')

    with client.open_sftp() as sftp:
        safe_print('Writing nginx config...')
        with sftp.file('/etc/nginx/sites-available/jagdamba', 'w') as f:
            f.write(NGINX_CONFIG)
        with sftp.file(f'{REMOTE_ROOT}/jagdamba_nginx.txt', 'w') as f:
            f.write(NGINX_CONFIG)

    run(client, 'nginx -t && systemctl reload nginx', check=True)

    run(client, 'pm2 delete whatsapp 2>/dev/null || true')
    run(client, f'cd {REMOTE_ROOT}/server && npm install --omit=dev 2>&1 | tail -5')
    run(client, f'cd {REMOTE_ROOT}/server && pm2 start src/index.js --name whatsapp --update-env')
    run(client, 'pm2 save')

    time.sleep(3)
    run(client, 'curl -s http://127.0.0.1:5001/api/whatsapp/status')
    run(client, 'curl -s -X POST http://127.0.0.1:5001/api/whatsapp/init')
    time.sleep(5)
    run(client, 'curl -s http://127.0.0.1:5001/api/whatsapp/status')
    run(client, 'curl -s https://jagdambaprofile.tech/api/whatsapp/status')
    run(client, 'pm2 status')


def main() -> None:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    safe_print(f'Connecting to {HOST}...')
    client.connect(HOST, username=USER, password=PW, timeout=45)
    safe_print('Connected.')

    try:
        safe_print('\n=== Diagnosis ===')
        diagnose(client)
        fix(client)
        safe_print('\nWhatsApp fix completed.')
    finally:
        client.close()


if __name__ == '__main__':
    try:
        main()
    except Exception as exc:
        safe_print(f'Failed: {exc}')
        sys.exit(1)
