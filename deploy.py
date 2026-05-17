import paramiko
import time

def deploy():
    host = "187.127.160.28"
    user = "root"
    pw = "Jagdamba@2026"

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print(f"Connecting to {host}...")
    client.connect(host, username=user, password=pw)
    print("Connected!")

    commands = [
        "export DEBIAN_FRONTEND=noninteractive",
        "apt update",
        "apt install -y curl git postgresql postgresql-contrib",
        "curl -fsSL https://deb.nodesource.com/setup_20.x | bash -",
        "apt install -y nodejs",
        "npm install -g pm2",
        "sudo -u postgres psql -c \"CREATE DATABASE jagdamba_final;\" || true",
        "sudo -u postgres psql -c \"ALTER USER postgres WITH PASSWORD 'Vraj@2003';\" || true",
        "rm -rf JAGDAMBA-PROFILE",
        "git clone --depth 1 -b master https://github.com/vj912004-debug/JAGDAMBA-PROFILE.git",
        "cd JAGDAMBA-PROFILE && npm install",
        "cd JAGDAMBA-PROFILE/backend && npm install",
        "cd JAGDAMBA-PROFILE/server && npm install",
        "cd JAGDAMBA-PROFILE/backend && node run_init.js",
        "pm2 delete all || true",
        "pm2 start /root/JAGDAMBA-PROFILE/backend/src/index.js --name 'api'",
        "pm2 start /root/JAGDAMBA-PROFILE/server/src/index.js --name 'whatsapp'",
        "cd /root/JAGDAMBA-PROFILE && npm run build",
        "pm2 start 'npx serve -s dist -p 80' --name 'frontend'",
        "pm2 save",
        "pm2 startup"
    ]

    for cmd in commands:
        print(f"Executing: {cmd}")
        stdin, stdout, stderr = client.exec_command(cmd)
        exit_status = stdout.channel.recv_exit_status()
        print(f"Exit status: {exit_status}")
        if exit_status != 0:
            print(f"Error: {stderr.read().decode()}")

    client.close()
    print("Deployment finished!")

if __name__ == "__main__":
    deploy()
