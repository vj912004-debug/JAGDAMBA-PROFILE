import paramiko

def fix_frontend():
    host = "187.127.160.28"
    user = "root"
    pw = "Jagdamba@2026"

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=pw)

    # Delete old frontend process
    client.exec_command("pm2 delete frontend")
    
    # Start with absolute path
    # Using 'serve' with -s (single page app) and absolute path to dist
    print("Starting frontend with absolute path...")
    cmd = "pm2 start 'npx serve -s /root/JAGDAMBA-PROFILE/dist -p 80' --name 'frontend'"
    stdin, stdout, stderr = client.exec_command(cmd)
    print(stdout.read().decode())
    
    # Save PM2 status
    client.exec_command("pm2 save")

    client.close()

if __name__ == "__main__":
    fix_frontend()
