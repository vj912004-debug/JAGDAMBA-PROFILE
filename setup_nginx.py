import paramiko

def setup_nginx():
    host = "187.127.160.28"
    user = "root"
    pw = "Jagdamba@2026"
    domain = "jagdambaprofile.tech"

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=pw)

    print("Installing Nginx...")
    client.exec_command("apt update && apt install -y nginx")

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

    location /whatsapp/ {{
        proxy_pass http://localhost:5001/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }}
}}
"""
    
    # Write config to a temporary file on the server
    print("Writing Nginx config...")
    client.exec_command(f"echo '{nginx_config}' > /etc/nginx/sites-available/jagdamba")
    
    # Enable the site and remove default
    client.exec_command("ln -s /etc/nginx/sites-available/jagdamba /etc/nginx/sites-enabled/")
    client.exec_command("rm /etc/nginx/sites-enabled/default")
    
    # Grant Nginx permission to read /root folder
    print("Setting permissions...")
    client.exec_command("chmod 755 /root")
    
    # Restart Nginx
    print("Restarting Nginx...")
    stdin, stdout, stderr = client.exec_command("nginx -t && systemctl restart nginx")
    print(stdout.read().decode())
    print(stderr.read().decode())

    # Stop the PM2 'frontend' service as Nginx now handles it on port 80
    print("Stopping PM2 frontend (Nginx is now in control)...")
    client.exec_command("pm2 stop frontend && pm2 save")

    client.close()
    print("Nginx setup finished!")

if __name__ == "__main__":
    setup_nginx()
