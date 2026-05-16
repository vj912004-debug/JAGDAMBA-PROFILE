import paramiko

def check_pm2():
    host = "187.127.160.28"
    user = "root"
    pw = "Jagdamba@2026"

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=pw)

    stdin, stdout, stderr = client.exec_command("pm2 list")
    print(stdout.read().decode())

    client.close()

if __name__ == "__main__":
    check_pm2()
