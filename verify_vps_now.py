import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=30)
cmds = [
    'cat /root/JAGDAMBA-PROFILE/dist/index.html',
    'ls -la /root/JAGDAMBA-PROFILE/dist/assets/ProfileApp*.js',
    "python3 -c \"import glob; p=glob.glob('/root/JAGDAMBA-PROFILE/dist/assets/ProfileApp-*.js')[0]; s=open(p).read(); print('ORIGINAL COPY:', 'ORIGINAL COPY' in s); print('DUPLICATE COPY:', 'DUPLICATE COPY' in s)\"",
    'curl -sI https://jagdambaprofile.tech/ | head -3',
]
for cmd in cmds:
    print('\n>>>', cmd)
    _, o, e = c.exec_command(cmd)
    print(o.read().decode())
    err = e.read().decode()
    if err:
        print(err)
c.close()
