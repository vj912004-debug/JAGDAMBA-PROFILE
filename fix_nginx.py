import paramiko

host = "187.127.160.28"
user = "root"
pw = "Jagdamba@2026"

client = paramiko.SSHClient()
client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
client.connect(host, username=user, password=pw)

new_config = """
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
    }

    location /api/ {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection upgrade;
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    listen 443 ssl; # managed by Certbot
    ssl_certificate /etc/letsencrypt/live/jagdambaprofile.tech/fullchain.pem; # managed by Certbot
    ssl_certificate_key /etc/letsencrypt/live/jagdambaprofile.tech/privkey.pem; # managed by Certbot
    include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
    if ($host = www.jagdambaprofile.tech) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    if ($host = jagdambaprofile.tech) {
        return 301 https://$host$request_uri;
    } # managed by Certbot

    listen 80;
    server_name jagdambaprofile.tech www.jagdambaprofile.tech;
    return 404; # managed by Certbot
}
"""

with client.open_sftp() as sftp:
    with sftp.file('/etc/nginx/sites-available/jagdamba', 'w') as f:
        f.write(new_config)

commands = [
    "rm -f /etc/nginx/sites-enabled/jagdambaprofile.tech",
    "rm -f /etc/nginx/sites-available/jagdambaprofile.tech",
    "nginx -t && systemctl restart nginx"
]

for cmd in commands:
    print(f"Executing: {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd)
    print(stdout.read().decode())
    print(stderr.read().decode())

client.close()
