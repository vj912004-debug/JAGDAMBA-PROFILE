"""Diagnose and fix VPS Postgres env / ERP API connectivity."""
from __future__ import annotations

import sys

from deploy_common import REMOTE_ROOT, connect_client, run, safe_print


def main() -> int:
    client = connect_client()
    try:
        run(client, 'pm2 status')
        run(client, 'pm2 logs backend --lines 60 --nostream')
        run(client, 'pm2 show backend | sed -n "1,160p"')

        run(
            client,
            f'''python3 - <<'PY'
from pathlib import Path
p = Path('{REMOTE_ROOT}/backend/.env')
print('FILE', p, 'exists' if p.exists() else 'MISSING')
if p.exists():
    for line in p.read_text(errors='replace').splitlines():
        s = line.strip()
        if not s or s.startswith('#') or '=' not in s:
            continue
        key, val = s.split('=', 1)
        key = key.strip()
        val = val.strip().strip('"').strip("'")
        up = key.upper()
        if 'DATABASE_URL' in up:
            masked = val
            if '://' in val and '@' in val:
                scheme, rest = val.split('://', 1)
                creds, host = rest.split('@', 1)
                if ':' in creds:
                    user, pwd = creds.split(':', 1)
                    masked = scheme + '://' + user + ':***@' + host
                    print(key + '=' + masked)
                    print('  user=', user, 'pwd_type=', type(pwd).__name__, 'pwd_len=', len(pwd), 'pwd_empty=', pwd == '')
                else:
                    print(key + '=' + scheme + '://***@' + host)
                    print('  WARNING: no password in URL')
            else:
                print(key + '=*** len=' + str(len(val)))
        elif any(x in up for x in ('PASS', 'SECRET', 'TOKEN', 'KEY')):
            print(key + '=*** len=' + str(len(val)))
        else:
            print(key + '=' + val)
PY'''
        )

        run(client, 'ss -lptn | grep -E ":5000|:5001|:3000" || netstat -lptn | grep -E ":5000|:5001" || true')
        run(client, 'curl -s http://127.0.0.1:5000/api/health; echo')
        run(client, 'curl -s -o /tmp/erp.json -w "ERP_HTTP=%{http_code}\\n" http://127.0.0.1:5000/api/erp/data; head -c 500 /tmp/erp.json; echo')
        run(client, 'curl -s http://127.0.0.1:5000/; echo')
        run(client, f'head -n 40 {REMOTE_ROOT}/backend/src/index.js')
        run(client, f'ls {REMOTE_ROOT}/backend/src/routes/; ls {REMOTE_ROOT}/backend/src/controllers/ | head')

        run(
            client,
            '''sudo -u postgres psql -d jagdamba_final -c "SELECT id, version, updated_at, pg_column_size(data) AS bytes, jsonb_array_length(COALESCE(data->'parties','[]'::jsonb)) AS parties FROM erp_data WHERE id='main';"'''
        )
        return 0
    finally:
        client.close()


if __name__ == '__main__':
    sys.exit(main())
