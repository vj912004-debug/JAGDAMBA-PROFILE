import paramiko

def read_html():
    host = "187.127.160.28"
    user = "root"
    pw = "Jagdamba@2026"

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=pw)

    stdin, stdout, stderr = client.exec_command("cat /root/JAGDAMBA-PROFILE/dist/index.html")
    print(stdout.read().decode())

    client.close()

if __name__ == "__main__":
    read_html()
