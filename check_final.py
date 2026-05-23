import paramiko

def check_dist():
    host = "187.127.160.28"
    user = "root"
    pw = "Jagdamba@2026"

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=pw)

    print("Checking dist folder...")
    stdin, stdout, stderr = client.exec_command("ls -R /root/JAGDAMBA-PROFILE/dist")
    print(stdout.read().decode())

    print("\nChecking PM2 logs for frontend...")
    stdin, stdout, stderr = client.exec_command("pm2 logs frontend --lines 20 --no-colors")
    print(stdout.read().decode())

    client.close()

if __name__ == "__main__":
    check_dist()
