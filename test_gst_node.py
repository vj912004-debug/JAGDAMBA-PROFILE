import paramiko
import time

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('187.127.160.28', username='root', password='Jagdamba@2026', timeout=45)
cmd = (
    'cd /root/JAGDAMBA-PROFILE/backend && '
    'node --input-type=module -e "import { fetchGstPortalCaptcha } from \'./src/services/gstPortalService.js\'; '
    'fetchGstPortalCaptcha().then(r => console.log(JSON.stringify({ ok: true, hasImage: !!r.image, sid: r.sessionId }))).catch(e => console.log(JSON.stringify({ ok:false, err: e.message })));"'
)
_, o, e = c.exec_command(cmd)
time.sleep(8)
out = o.read().decode('utf-8', errors='replace')
err = e.read().decode('utf-8', errors='replace')
open('d:/j/gst_node_test.txt', 'w', encoding='utf-8').write(out + '\n' + err)
c.close()
