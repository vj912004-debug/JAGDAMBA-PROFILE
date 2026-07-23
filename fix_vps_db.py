import paramiko
import sys
import json

HOST = "187.127.160.28"
USER = "root"
PASSWORD = "Jagdamba@2026"
REMOTE_ROOT = "/root/JAGDAMBA-PROFILE"

ENV_CONTENT = """DATABASE_URL=postgresql://postgres:Vraj@2003@localhost:5432/jagdamba_final
PORT=5000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=jagdambaprofile001@gmail.com
SMTP_PASS=Jagdamba@2002
"""


def run(client, cmd):
    print(f"\n$ {cmd}")
    stdin, stdout, stderr = client.exec_command(cmd)
    out = stdout.read().decode("utf-8", errors="replace").strip()
    err = stderr.read().decode("utf-8", errors="replace").strip()
    code = stdout.channel.recv_exit_status()
    if out:
        print(out.encode(sys.stdout.encoding, errors="replace").decode(sys.stdout.encoding, errors="replace"))
    if err:
        print(f"stderr: {err.encode(sys.stdout.encoding, errors='replace').decode(sys.stdout.encoding, errors='replace')}")
    print(f"exit: {code}")
    return code, out, err


def main():
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())

    print(f"Connecting to {HOST}...")
    client.connect(HOST, username=USER, password=PASSWORD)
    print("Connected.")

    # Inspect current state
    run(client, "cat /root/JAGDAMBA-PROFILE/backend/.env 2>/dev/null || echo 'NO_ENV_FILE'")
    run(client, "sudo -u postgres psql -tAc \"SELECT datname FROM pg_database WHERE datistemplate = false ORDER BY datname;\"")

    # Ensure database exists (lowercase name)
    run(
        client,
        "sudo -u postgres psql -tAc \"SELECT 1 FROM pg_database WHERE datname='jagdamba_final'\" | grep -q 1 || sudo -u postgres psql -c \"CREATE DATABASE jagdamba_final;\"",
    )

    # Write corrected .env
    sftp = client.open_sftp()
    with sftp.file(f"{REMOTE_ROOT}/backend/.env", "w") as f:
        f.write(ENV_CONTENT)
    sftp.close()
    print("\nWrote corrected backend/.env")

    # Initialize tables
    code, out, err = run(client, f"cd {REMOTE_ROOT}/backend && node run_init.js")
    if code != 0:
        print("DB init failed.")
        client.close()
        sys.exit(1)

    # Restart API
    run(client, "pm2 restart api || pm2 start /root/JAGDAMBA-PROFILE/backend/src/index.js --name api")
    run(client, "pm2 save")
    run(client, "sleep 2 && pm2 status api")

    # Verify health via local curl on server
    code, out, err = run(client, "curl -s http://localhost:5000/api/health")
    if out:
        try:
            health = json.loads(out)
            print("\nHealth check:", json.dumps(health, indent=2))
            if health.get("database") != "CONNECTED":
                print("WARNING: Database still not connected.")
                client.close()
                sys.exit(1)
        except json.JSONDecodeError:
            print("Could not parse health response:", out)

    client.close()
    print("\nVPS database fix completed successfully.")


if __name__ == "__main__":
    main()
