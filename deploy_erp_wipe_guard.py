"""Deploy ERP wipe-guard backend and verify it blocks empty overwrites."""
import json
import sys
import urllib.error
import urllib.request

from deploy_common import REMOTE_ROOT, connect_client, run, safe_print


def main() -> int:
    client = connect_client()
    try:
        sftp = client.open_sftp()
        local = 'backend/src/controllers/erpController.js'
        remote = f'{REMOTE_ROOT}/backend/src/controllers/erpController.js'
        safe_print(f'Uploading {local} -> {remote}')
        sftp.put(local, remote)
        sftp.close()

        run(client, 'pm2 restart api --update-env')
        run(client, 'sleep 2')

        raw = run(client, 'curl -s http://localhost:5000/api/erp/data')
        data = json.loads(raw).get('data') or {}
        counts = {
            k: len(data.get(k) or [])
            for k in ('parties', 'purchaseOrders', 'purchaseReceipts', 'orders', 'tcRecords')
        }
        safe_print(f'BEFORE counts: {counts}')

        # Attempt wipe — must be rejected with 409
        code = run(
            client,
            "curl -s -o /tmp/wipe_test.json -w '%{http_code}' -X PUT "
            "http://localhost:5000/api/erp/data "
            "-H 'Content-Type: application/json' "
            "-d '{\"data\":{\"parties\":[],\"purchaseOrders\":[],\"purchaseReceipts\":[],"
            "\"orders\":[],\"tcRecords\":[],\"challans\":[],\"dispatches\":[],\"plates\":[],"
            "\"quotations\":[],\"cncQuotations\":[],\"ringQuotations\":[],"
            "\"jobWorkOutwards\":[],\"jobWorkInwards\":[],\"weighbridgeEntries\":[],"
            "\"rejectMaterialReturns\":[],\"anmsMtcRecords\":[]},\"version\":\"wipe_test\"}'",
        )
        body = run(client, 'cat /tmp/wipe_test.json')
        safe_print(f'Wipe attempt HTTP {code}')
        safe_print(f'Wipe response: {body[:400]}')

        raw2 = run(client, 'curl -s http://localhost:5000/api/erp/data')
        data2 = json.loads(raw2).get('data') or {}
        counts2 = {
            k: len(data2.get(k) or [])
            for k in ('parties', 'purchaseOrders', 'purchaseReceipts', 'orders', 'tcRecords')
        }
        safe_print(f'AFTER counts: {counts2}')

        if str(code).strip() != '409':
            safe_print('ERROR: wipe guard did not return 409')
            return 1
        if counts2 != counts:
            safe_print('ERROR: data changed after wipe attempt')
            return 1

        safe_print('Backend wipe-guard OK — empty overwrite blocked, data intact.')
        return 0
    finally:
        client.close()


if __name__ == '__main__':
    sys.exit(main())
