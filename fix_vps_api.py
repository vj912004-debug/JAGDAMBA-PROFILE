"""Restore production API: correct PM2 app, encoded DATABASE_URL, nginx site."""
from __future__ import annotations

import sys

from deploy_common import REMOTE_ROOT, connect_client, run, safe_print


REMOTE_FIX_ENV = r'''
python3 - <<'PY'
from pathlib import Path
from urllib.parse import quote

env_path = Path('/root/JAGDAMBA-PROFILE/backend/.env')
text = env_path.read_text(errors='replace')
lines = []
changed = False
for line in text.splitlines():
    if line.strip().startswith('DATABASE_URL='):
        val = line.split('=', 1)[1].strip().strip('"').strip("'")
        # Broken form: postgresql://postgres:Vraj@2003@localhost:5432/jagdamba_final
        if val.count('@') >= 2 and '://' in val:
            scheme, rest = val.split('://', 1)
            creds, host = rest.rsplit('@', 1)
            if ':' in creds:
                user, pwd = creds.split(':', 1)
                enc = quote(pwd, safe='')
                new_val = scheme + '://' + user + ':' + enc + '@' + host
                lines.append('DATABASE_URL=' + new_val)
                changed = True
                print('FIXED_DATABASE_URL user=', user, 'pwd_len=', len(pwd), 'host=', host)
                continue
    lines.append(line)
if changed:
    env_path.write_text('\n'.join(lines) + '\n')
    print('WROTE', env_path)
else:
    print('NO_CHANGE_NEEDED or already encoded')
    for line in text.splitlines():
        if line.strip().startswith('DATABASE_URL='):
            val = line.split('=', 1)[1].strip()
            print('CURRENT_AT_COUNT=', val.count('@'), 'HAS_PCT40=', '%40' in val)
PY
'''


def main() -> int:
    client = connect_client()
    try:
        run(client, REMOTE_FIX_ENV)

        # Upload hardened db.js
        sftp = client.open_sftp()
        sftp.put('backend/src/config/db.js', f'{REMOTE_ROOT}/backend/src/config/db.js')
        sftp.close()
        safe_print('Uploaded backend/src/config/db.js')

        # Stop wrong /var/www processes and start correct ones
        run(client, 'pm2 delete backend server api whatsapp 2>/dev/null || true', check=False)
        run(
            client,
            f'cd {REMOTE_ROOT}/backend && pm2 start src/index.js --name api '
            f'--cwd {REMOTE_ROOT}/backend --update-env',
        )
        run(
            client,
            f'cd {REMOTE_ROOT}/server && pm2 start src/index.js --name whatsapp '
            f'--cwd {REMOTE_ROOT}/server --update-env',
            check=False,
        )
        run(client, 'pm2 save', check=False)

        # Nginx: only production site for /root/JAGDAMBA-PROFILE
        run(client, 'rm -f /etc/nginx/sites-enabled/jagdambaprofile', check=False)
        run(
            client,
            f'cp {REMOTE_ROOT}/jagdamba_nginx.txt /etc/nginx/sites-available/jagdamba && '
            f'ln -sfn /etc/nginx/sites-available/jagdamba /etc/nginx/sites-enabled/jagdamba',
        )
        run(client, 'nginx -t && systemctl reload nginx')

        run(client, 'sleep 3')
        run(client, 'pm2 status')
        run(client, 'pm2 logs api --lines 20 --nostream', check=False)
        run(client, 'curl -s http://127.0.0.1:5000/api/health; echo')
        run(client, 'curl -s -o /tmp/erp.json -w "ERP_HTTP=%{http_code}\\n" http://127.0.0.1:5000/api/erp/data')
        run(
            client,
            r'''python3 - <<'PY'
import json
from pathlib import Path
raw = Path('/tmp/erp.json').read_text(errors='replace')
print(raw[:180].replace('\n', ' '))
try:
    d = json.loads(raw)
    data = d.get('data') or {}
    print('success', d.get('success'), 'parties', len(data.get('parties') or []), 'pos', len(data.get('purchaseOrders') or []))
except Exception as e:
    print('parse_error', e)
PY'''
        )
        run(client, 'curl -s https://jagdambaprofile.tech/api/health; echo')
        run(client, 'curl -s -o /tmp/live_erp.json -w "LIVE_ERP=%{http_code}\\n" https://jagdambaprofile.tech/api/erp/data')
        run(
            client,
            r'''python3 - <<'PY'
import json
from pathlib import Path
raw = Path('/tmp/live_erp.json').read_text(errors='replace')
try:
    d = json.loads(raw)
    data = d.get('data') or {}
    print('LIVE parties', len(data.get('parties') or []), 'pos', len(data.get('purchaseOrders') or []))
except Exception as e:
    print('LIVE parse_error', e, raw[:120])
PY'''
        )
        return 0
    finally:
        client.close()


if __name__ == '__main__':
    sys.exit(main())
