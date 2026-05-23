import paramiko

def setup_nginx_robust():
    host = "187.127.160.28"
    user = "root"
    pw = "Jagdamba@2026"
    domain = "jagdambaprofile.tech"

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=pw)

    print("Ensuring Nginx is installed...")
    client.exec_command("export DEBIAN_FRONTEND=noninteractive && apt-get update && apt-get install -y nginx")

    nginx_config = f"""
server {{
    listen 80;
    server_name {domain} www.{domain};

    root /root/JAGDAMBA-PROFILE/dist;
    index index.html;

    location / {{
        try_files $uri $uri/ /index.html;
    }}

    location /api/ {{
        proxy_pass http://localhost:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }}
}}
"""
    
    # Use shell for multi-command
    print("Applying config...")
    cmds = [
        f"echo '{nginx_config}' > /etc/nginx/sites-available/jagdamba",
        "rm -f /etc/nginx/sites-enabled/default",
        "ln -sf /etc/nginx/sites-available/jagdamba /etc/nginx/sites-enabled/",
        "chmod 755 /root",
        "/usr/sbin/nginx -t",
        "systemctl restart nginx"
    ]
    
    for cmd in cmds:
        print(f"Exec: {cmd}")
        stdin, stdout, stderr = client.exec_command(cmd)
        stdout.read()
        stderr.read()

    client.close()

if __name__ == "__main__":
    setup_nginx_robust()
