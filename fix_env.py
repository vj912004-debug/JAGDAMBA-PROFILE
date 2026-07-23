import paramiko

def fix():
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect('187.127.160.28', username='root', password='Jagdamba@2026')
    
    env_content = """DATABASE_URL=postgresql://postgres:Vraj@2003@localhost:5432/jagdamba_final
PORT=5000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=jagdambaprofile001@gmail.com
SMTP_PASS=Jagdamba@2002
"""
    sftp = c.open_sftp()
    with sftp.file('/root/JAGDAMBA-PROFILE/backend/.env', 'w') as f:
        f.write(env_content)
    
    stdin, stdout, stderr = c.exec_command('pm2 restart api')
    print(stdout.read().decode())

fix()
