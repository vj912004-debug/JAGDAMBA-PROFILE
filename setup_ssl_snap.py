import paramiko

def setup_ssl_snap():
    host = "187.127.160.28"
    user = "root"
    pw = "Jagdamba@2026"
    domain = "jagdambaprofile.tech"

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=pw)

    print("Installing Certbot via Snap...")
    cmds = [
        "snap install core; snap refresh core",
        "snap install --classic certbot",
        "ln -sf /snap/bin/certbot /usr/bin/certbot",
        f"certbot --nginx -d {domain} -d www.{domain} --non-interactive --agree-tos -m admin@{domain} --redirect"
    ]
    
    for cmd in cmds:
        print(f"Exec: {cmd}")
        stdin, stdout, stderr = client.exec_command(cmd)
        print(stdout.read().decode())
        print(stderr.read().decode())

    client.close()

if __name__ == "__main__":
    setup_ssl_snap()
