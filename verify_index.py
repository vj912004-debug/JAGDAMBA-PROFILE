import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026')
stdin, stdout, stderr = c.exec_command('cat /root/JAGDAMBA-PROFILE/dist/index.html')
print(stdout.read().decode())
c.close()
