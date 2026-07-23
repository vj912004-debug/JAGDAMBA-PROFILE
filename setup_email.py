import paramiko
import sys

sys.stdout.reconfigure(encoding='utf-8', errors='replace')

def run_ssh(client, cmd):
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode('utf-8', errors='replace')
    err = stderr.read().decode('utf-8', errors='replace')
    return out, err

def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect("187.127.160.28", username="root", password="Jagdamba@2026")
    print("Connected!")

    out, _ = run_ssh(client, "cat /root/JAGDAMBA-PROFILE/backend/src/routes/mail.js")
    print("=== mail.js route ===")
    print(out[:6000])

    out, _ = run_ssh(client, "pm2 logs api --lines 20 --nostream 2>/dev/null")
    print("=== pm2 api logs ===")
    print(out[:3000])

    client.close()

if __name__ == "__main__":
    main()
