import paramiko

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026')

cmds = [
    'grep -c "Not Configured" /root/JAGDAMBA-PROFILE/dist/assets/ProfileApp-*.js',
    'grep -c "Email Connection Control" /root/JAGDAMBA-PROFILE/src/projects/profile/pages/TCManagement.tsx',
    'nginx -T 2>/dev/null | grep -E "root |listen " | head -10',
    'curl -sI https://jagdambaprofile.tech/ | head -5',
    'curl -s https://jagdambaprofile.tech/ | grep -o "ProfileApp-[^\"]*" | head -1',
]

for cmd in cmds:
    print(f'\n>>> {cmd}')
    stdin, stdout, stderr = c.exec_command(cmd)
    print(stdout.read().decode().strip() or stderr.read().decode().strip())

c.close()
