import paramiko

def debug_build():
    host = "187.127.160.28"
    user = "root"
    pw = "Jagdamba@2026"

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=pw)

    print("Running build and capturing errors...")
    stdin, stdout, stderr = client.exec_command("cd /root/JAGDAMBA-PROFILE && npm run build")
    
    out = stdout.read().decode()
    err = stderr.read().decode()
    
    print("STDOUT:", out)
    print("STDERR:", err)

    client.close()

if __name__ == "__main__":
    debug_build()
