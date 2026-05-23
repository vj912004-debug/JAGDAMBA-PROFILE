import paramiko

def setup_ssl():
    host = "187.127.160.28"
    user = "root"
    pw = "Jagdamba@2026"
    domain = "jagdambaprofile.tech"

    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    client.connect(host, username=user, password=pw)

    print("Installing Certbot...")
    client.exec_command("export DEBIAN_FRONTEND=noninteractive && apt-get update && apt-get install -y certbot python3-certbot-nginx")

    print("Running Certbot...")
    # --non-interactive: don't ask for user input
    # --agree-tos: agree to terms of service
    # -m: your email (using a placeholder)
    # --nginx: use nginx plugin
    cmd = f"certbot --nginx -d {domain} -d www.{domain} --non-interactive --agree-tos -m admin@{domain} --redirect"
    stdin, stdout, stderr = client.exec_command(cmd)
    
    out = stdout.read().decode()
    err = stderr.read().decode()
    
    print("STDOUT:", out)
    print("STDERR:", err)

    client.close()

if __name__ == "__main__":
    setup_ssl()
