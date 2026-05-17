import paramiko

def setup_env():
    host = "187.127.160.28"
    user = "root"
    pw = "Jagdamba@2026"

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=pw)

    # Database URL for Production (Postgres is local)
    db_url = "postgresql://postgres:Vraj@2003@localhost:5432/jagdamba_final"
    
    env_content = f"DATABASE_URL={db_url}\nPORT=5000\n"
    
    # Create .env in backend
    print("Creating .env in backend...")
    client.exec_command(f"echo '{env_content}' > /root/JAGDAMBA-PROFILE/backend/.env")
    
    # Run DB init again
    print("Running DB init...")
    stdin, stdout, stderr = client.exec_command("cd /root/JAGDAMBA-PROFILE/backend && node run_init.js")
    print(stdout.read().decode('utf-8', errors='ignore').encode('ascii', errors='ignore').decode('ascii'))
    print(stderr.read().decode('utf-8', errors='ignore').encode('ascii', errors='ignore').decode('ascii'))

    # Restart API
    print("Restarting API...")
    client.exec_command("pm2 restart api")

    client.close()

if __name__ == "__main__":
    setup_env()
