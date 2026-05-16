import paramiko

def check_ls():
    host = "187.127.160.28"
    user = "root"
    pw = "Jagdamba@2026"

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=pw)

    stdin, stdout, stderr = client.exec_command("ls -F JAGDAMBA-PROFILE")
    print(stdout.read().decode())

    client.close()

if __name__ == "__main__":
    check_ls()
