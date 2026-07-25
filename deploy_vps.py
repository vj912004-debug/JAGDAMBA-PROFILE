import paramiko
import time
import sys

HOSTNAME = '187.127.160.28'
USERNAME = 'root'
PASSWORD = 'Jagdamba@2026'

def execute_command(ssh, command):
    print(f"\n[VPS] Running: {command}")
    stdin, stdout, stderr = ssh.exec_command(command)
    
    exit_status = stdout.channel.recv_exit_status()
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    
    if out:
        print(out.encode('ascii', errors='replace').decode('ascii'))
    if err:
        print(f"Error/Warning: {err.encode('ascii', errors='replace').decode('ascii')}")
        
    return exit_status, out, err

def main():
    print("Connecting to VPS...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    try:
        ssh.connect(HOSTNAME, username=USERNAME, password=PASSWORD, timeout=10)
        print("Successfully connected!")
        
        # 1. Update and install prerequisites
        execute_command(ssh, "apt-get update && DEBIAN_FRONTEND=noninteractive apt-get install -y git curl nginx certbot python3-certbot-nginx")
        
        # 2. Install Node.js (v20) if not present
        execute_command(ssh, "curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && apt-get install -y nodejs")
        
        # 3. Install PM2 globally
        execute_command(ssh, "npm install -g pm2")
        
        # 4. Clone or pull repository
        repo_dir = "/var/www/jagdambaprofile"
        _, out, _ = execute_command(ssh, f"if [ -d {repo_dir}/.git ]; then cd {repo_dir} && git pull origin main; else git clone https://github.com/vj912004-debug/JAGDAMBA-PROFILE.git {repo_dir}; fi")
        
        # 5. Install dependencies and build
        print("\n[VPS] Installing dependencies and building. This might take a minute...")
        execute_command(ssh, f"cd {repo_dir} && npm install")
        execute_command(ssh, f"cd {repo_dir}/backend && npm install")
        execute_command(ssh, f"cd {repo_dir}/server && npm install")
        execute_command(ssh, f"cd {repo_dir} && npm run build")
        
        # 6. Start PM2 processes
        # First, delete existing ones if they exist
        execute_command(ssh, "pm2 delete all || true")
        
        # Start backend and server
        execute_command(ssh, f"cd {repo_dir}/backend && pm2 start npm --name 'backend' -- run dev")
        execute_command(ssh, f"cd {repo_dir}/server && pm2 start npm --name 'server' -- run dev")
        execute_command(ssh, "pm2 save")
        
        # 7. Configure Nginx
        nginx_conf = """
server {
    listen 80;
    server_name jagdambaprofile.tech www.jagdambaprofile.tech;

    root /var/www/jagdambaprofile/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:5000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
"""
        # Write nginx conf
        execute_command(ssh, f"cat << 'EOF' > /etc/nginx/sites-available/jagdambaprofile\n{nginx_conf}\nEOF")
        execute_command(ssh, "ln -sf /etc/nginx/sites-available/jagdambaprofile /etc/nginx/sites-enabled/")
        execute_command(ssh, "rm -f /etc/nginx/sites-enabled/default")
        execute_command(ssh, "systemctl restart nginx")
        
        # 8. Run Certbot non-interactively
        execute_command(ssh, "certbot --nginx -d jagdambaprofile.tech -d www.jagdambaprofile.tech --non-interactive --agree-tos -m admin@jagdambaprofile.tech || true")
        
        print("\n--- DEPLOYMENT COMPLETE ---")
        print("Your site should now be live at https://jagdambaprofile.tech")
        
    except Exception as e:
        print(f"Connection failed: {e}")
    finally:
        ssh.close()

if __name__ == "__main__":
    main()
