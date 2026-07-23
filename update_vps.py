import paramiko
import sys

def update_live_server():
    host = "187.127.160.28"
    user = "root"
    pw = "Jagdamba@2026"

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    
    print(f"Connecting to live server {host}...")
    try:
        client.connect(host, username=user, password=pw)
        print("Connected successfully!")
    except Exception as e:
        print(f"Failed to connect: {e}")
        sys.exit(1)

    commands = [
        "cd /root/JAGDAMBA-PROFILE && git stash",
        "cd /root/JAGDAMBA-PROFILE && git pull origin master",
        "cd /root/JAGDAMBA-PROFILE && npm install",
        "cd /root/JAGDAMBA-PROFILE/backend && npm install",
        "cd /root/JAGDAMBA-PROFILE/backend && node run_init.js",
        "cd /root/JAGDAMBA-PROFILE && npm run build",
        "pm2 restart api --update-env",
        "pm2 save",
    ]

    for cmd in commands:
        print(f"\nExecuting command: {cmd}")
        stdin, stdout, stderr = client.exec_command(cmd)
        
        # Stream the output in real-time
        while True:
            line = stdout.readline()
            if not line:
                break
            print(line.strip().encode('ascii', errors='replace').decode('ascii'))
            
        err = stderr.read().decode('utf-8', errors='replace').strip()
        if err:
            print(f"Stderr output:\n{err}".encode('ascii', errors='replace').decode('ascii'))
            
        exit_status = stdout.channel.recv_exit_status()
        print(f"Command exit status: {exit_status}")
        if exit_status != 0:
            print("Deployment halted due to command failure.")
            client.close()
            sys.exit(1)

    client.close()
    print("\nLive server updated successfully!")

if __name__ == "__main__":
    update_live_server()
