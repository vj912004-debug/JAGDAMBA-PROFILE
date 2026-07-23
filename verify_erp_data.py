"""Check whether ERP data is stored on the live VPS (PostgreSQL + API)."""
import json
import sys

import paramiko

HOST = '187.127.160.28'
USER = 'root'
PW = 'Jagdamba@2026'


def safe_print(text: str) -> None:
    print(text.encode('ascii', errors='replace').decode('ascii'))


def run(client: paramiko.SSHClient, cmd: str, timeout: int = 60) -> str:
    safe_print(f'\n>>> {cmd}')
    _, stdout, stderr = client.exec_command(cmd, timeout=timeout)
    out = stdout.read().decode('utf-8', errors='replace').strip()
    err = stderr.read().decode('utf-8', errors='replace').strip()
    if out:
        safe_print(out)
    if err:
        safe_print(f'stderr: {err}')
    return out


def main() -> int:
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    print(f'Connecting to {HOST}...')
    client.connect(HOST, username=USER, password=PW, timeout=45)
    safe_print('Connected.\n')

    run(client, 'pm2 status api')

    health_raw = run(client, 'curl -s http://localhost:5000/api/health')
    try:
        health = json.loads(health_raw)
        safe_print('\n=== HEALTH ===')
        safe_print(json.dumps(health, indent=2))
        db_ok = health.get('database') == 'CONNECTED'
    except json.JSONDecodeError:
        print('Could not parse health JSON')
        db_ok = False

    api_raw = run(client, 'curl -s http://localhost:5000/api/erp/data')
    try:
        api = json.loads(api_raw)
        data = api.get('data') or {}
        safe_print('\n=== ERP API GET /api/erp/data ===')
        safe_print(f"success: {api.get('success')}")
        safe_print(f"version: {api.get('version')}")
        safe_print(f"updated_at: {api.get('updated_at')}")
        if data:
            safe_print('record counts:')
            for key in [
                'orders', 'parties', 'tcRecords', 'purchaseOrders', 'purchaseReceipts',
                'quotations', 'cncQuotations', 'challans', 'dispatches', 'plates', 'logs',
            ]:
                val = data.get(key)
                if isinstance(val, list):
                    safe_print(f'  {key}: {len(val)}')
                elif val is not None:
                    safe_print(f'  {key}: {type(val).__name__}')
        else:
            safe_print('data payload: EMPTY')
        api_has_data = bool(data) and any(
            isinstance(data.get(k), list) and len(data.get(k)) > 0
            for k in ('orders', 'parties', 'tcRecords', 'purchaseOrders')
        )
    except json.JSONDecodeError:
        print('Could not parse ERP data JSON')
        api_has_data = False

    sql = (
        "SELECT id, version, updated_at::text, pg_column_size(data) AS data_bytes, "
        "jsonb_array_length(COALESCE(data->'orders','[]'::jsonb)) AS orders, "
        "jsonb_array_length(COALESCE(data->'parties','[]'::jsonb)) AS parties, "
        "jsonb_array_length(COALESCE(data->'tcRecords','[]'::jsonb)) AS tc_records, "
        "jsonb_array_length(COALESCE(data->'purchaseOrders','[]'::jsonb)) AS purchase_orders "
        "FROM erp_data WHERE id='main';"
    )
    run(client, f"sudo -u postgres psql -d jagdamba_final -c \"{sql}\"")

    run(client, 'grep DATABASE_URL /root/JAGDAMBA-PROFILE/backend/.env 2>/dev/null | sed "s/:[^:@]*@/:***@/" || echo NO_ENV')
    run(client, 'pm2 logs api --lines 20 --nostream 2>&1 | tail -25')

    client.close()

    safe_print('\n=== RESULT ===')
    if db_ok and api_has_data:
        safe_print('OK: Database connected and ERP data is stored on the server.')
        return 0
    if db_ok and not api_has_data:
        safe_print('WARNING: Database connected but ERP data appears empty.')
        safe_print('Data may only be in browser localStorage until someone saves from the live site.')
        return 1
    safe_print('FAIL: Database not connected — saves will fail (browser cache only).')
    return 2


if __name__ == '__main__':
    sys.exit(main())
