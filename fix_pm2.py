import paramiko

def fix():
    c = paramiko.SSHClient()
    c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    c.connect('187.127.160.28', username='root', password='Jagdamba@2026')
    
    # Delete the old pm2 process
    c.exec_command('pm2 delete api')
    
    # Start the pm2 process with the correct working directory
    stdin, stdout, stderr = c.exec_command('cd /root/JAGDAMBA-PROFILE/backend && pm2 start src/index.js --name "api"')
    print(stdout.read().decode(errors='ignore'))
    c.exec_command('pm2 save')

fix()
