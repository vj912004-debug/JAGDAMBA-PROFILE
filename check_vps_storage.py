import paramiko
import sys

HOST = "187.127.160.28"
USER = "root"
PASSWORD = "Jagdamba@2026"


def run(client, cmd):
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    code = stdout.channel.recv_exit_status()
    return code, out, err


def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(HOST, username=USER, password=PASSWORD)

    checks = [
        ("PM2 processes", "pm2 jlist 2>/dev/null | python3 -c \"import sys,json; d=json.load(sys.stdin); print('\\n'.join(f\\\"{p['name']}: {p['pm2_env'].get('pm_exec_path','')}\\\" for p in d))\" 2>/dev/null || pm2 list"),
        ("Frontend static files", "ls -la /root/JAGDAMBA-PROFILE/dist/ | head -8"),
        ("Backend .env (DB only)", "grep DATABASE_URL /root/JAGDAMBA-PROFILE/backend/.env"),
        ("PostgreSQL databases", "sudo -u postgres psql -tAc \"SELECT datname FROM pg_database WHERE datistemplate=false ORDER BY datname;\""),
        ("PostgreSQL tables in jagdamba_final", "sudo -u postgres psql -d jagdamba_final -c \"\\dt\""),
        ("email_logs row count", "sudo -u postgres psql -d jagdamba_final -tAc \"SELECT COUNT(*) FROM email_logs;\""),
        ("Recent email_logs", "sudo -u postgres psql -d jagdamba_final -c \"SELECT id, recipient_email, subject, sent_at FROM email_logs ORDER BY sent_at DESC LIMIT 5;\""),
        ("WhatsApp session data", "ls -la /root/JAGDAMBA-PROFILE/server/.wwebjs_auth 2>/dev/null; ls -la /root/JAGDAMBA-PROFILE/server/.wwebjs_cache 2>/dev/null; find /root/JAGDAMBA-PROFILE/server -maxdepth 2 -name '.wwebjs*' 2>/dev/null"),
        ("Nginx full site config", "grep -E 'server_name|root |location|proxy_pass' /etc/nginx/sites-enabled/* 2>/dev/null"),
    ]

    for title, cmd in checks:
        print(f"\n=== {title} ===")
        code, out, err = run(client, cmd)
        text = out or err or "(empty)"
        print(text.encode(sys.stdout.encoding, errors="replace").decode(sys.stdout.encoding, errors="replace"))
        if code != 0 and not out:
            print(f"(exit {code})")

    client.close()


if __name__ == "__main__":
    main()
