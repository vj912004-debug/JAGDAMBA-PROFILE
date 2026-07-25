"""Inspect /var/www production backend and fix DATABASE_URL + PM2."""
from __future__ import annotations

import sys
from urllib.parse import quote

from deploy_common import connect_client, run, safe_print


def main() -> int:
    client = connect_client()
    try:
        run(client, 'ls -la /var/www/jagdambaprofile/')
        run(client, 'ls -la /var/www/jagdambaprofile/backend/')
        run(client, 'ls -la /var/www/jagdambaprofile/backend/.env /var/www/jagdambaprofile/backend/src 2>/dev/null || true')
        run(client, 'head -n 30 /var/www/jagdambaprofile/backend/src/index.js 2>/dev/null || true')
        run(client, 'ls /var/www/jagdambaprofile/backend/src/routes/ 2>/dev/null || true')

        run(
            client,
            '''python3 - <<'PY'
from pathlib import Path
for p in [Path('/var/www/jagdambaprofile/backend/.env'), Path('/root/JAGDAMBA-PROFILE/backend/.env')]:
    print('====', p, '====')
    if not p.exists():
        print('MISSING')
        continue
    raw = p.read_text(errors='replace')
    print('RAW_LINES:')
    for line in raw.splitlines():
        if 'DATABASE_URL' in line or line.strip().startswith('PORT') or 'SMTP_' in line:
            if 'DATABASE_URL' in line or 'PASS' in line.upper():
                print(' ', line[:20], '... masked ...', 'len=', len(line))
            else:
                print(' ', line)
        elif line.strip() and not line.strip().startswith('#'):
            print(' ', line)
    # parse DATABASE_URL carefully
    for line in raw.splitlines():
        if line.strip().startswith('DATABASE_URL='):
            val = line.split('=',1)[1].strip().strip('"').strip("'")
            print('DATABASE_URL_VALUE_REPR=', repr(val))
            print('AT_COUNT=', val.count('@'))
PY'''
        )

        # Compare nginx root
        run(client, 'grep -n "root\\|proxy_pass\\|server_name" /etc/nginx/sites-enabled/* /etc/nginx/sites-available/jagdamba 2>/dev/null | head -80')
        return 0
    finally:
        client.close()


if __name__ == '__main__':
    sys.exit(main())
