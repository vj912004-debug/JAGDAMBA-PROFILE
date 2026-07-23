"""Deploy permanent ERP data-protection (merge + backups + wipe guards)."""
import json
import sys

from deploy_common import REMOTE_ROOT, connect_client, deploy_via_archives, restart_services, run, safe_print


def main() -> int:
    client = connect_client()
    try:
        # Upload backend protection first
        sftp = client.open_sftp()
        for rel in (
            'backend/src/controllers/erpController.js',
            'backend/src/routes/erp.js',
            'backend/src/index.js',
            'backend/init.sql',
        ):
            remote = f'{REMOTE_ROOT}/{rel}'
            safe_print(f'Uploading {rel}')
            sftp.put(rel, remote)
        sftp.close()

        run(client, 'pm2 restart api --update-env')
        run(client, 'sleep 3')

        # Snapshot current live data into backups table immediately
        run(
            client,
            """sudo -u postgres psql -d jagdamba_final -v ON_ERROR_STOP=1 <<'SQL'
CREATE TABLE IF NOT EXISTS erp_data_backups (
  id BIGSERIAL PRIMARY KEY,
  erp_id TEXT NOT NULL DEFAULT 'main',
  data JSONB NOT NULL,
  version TEXT,
  critical_weight INTEGER NOT NULL DEFAULT 0,
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_erp_data_backups_created
  ON erp_data_backups (erp_id, created_at DESC);

INSERT INTO erp_data_backups (erp_id, data, version, critical_weight, reason)
SELECT
  id,
  data,
  version,
  COALESCE(jsonb_array_length(COALESCE(data->'parties','[]'::jsonb)),0)
  + COALESCE(jsonb_array_length(COALESCE(data->'purchaseOrders','[]'::jsonb)),0)
  + COALESCE(jsonb_array_length(COALESCE(data->'purchaseReceipts','[]'::jsonb)),0)
  + COALESCE(jsonb_array_length(COALESCE(data->'orders','[]'::jsonb)),0)
  + COALESCE(jsonb_array_length(COALESCE(data->'tcRecords','[]'::jsonb)),0),
  'manual_permanent_protect'
FROM erp_data
WHERE id = 'main'
  AND data IS NOT NULL
  AND data <> '{}'::jsonb;
SQL"""
        )

        # Verify counts
        raw = run(client, 'curl -s http://localhost:5000/api/erp/data')
        data = json.loads(raw).get('data') or {}
        counts = {
            k: len(data.get(k) or [])
            for k in ('parties', 'purchaseOrders', 'purchaseReceipts', 'orders', 'tcRecords')
        }
        safe_print(f'Live counts: {counts}')

        # Empty wipe must 409
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
        safe_print(f'Empty wipe HTTP {code} body={run(client, "cat /tmp/wipe_test.json")[:240]}')
        if str(code).strip() != '409':
            safe_print('ERROR: empty wipe not blocked')
            return 1

        # Confirm data unchanged after wipe attempt
        raw2 = run(client, 'curl -s http://localhost:5000/api/erp/data')
        data2 = json.loads(raw2).get('data') or {}
        counts2 = {
            k: len(data2.get(k) or [])
            for k in ('parties', 'purchaseOrders', 'purchaseReceipts', 'orders', 'tcRecords')
        }
        if counts2 != counts:
            safe_print(f'ERROR: counts changed after blocked wipe: {counts2}')
            return 1

        backups = run(client, 'curl -s http://localhost:5000/api/erp/backups')
        safe_print(f'Backups API: {backups[:500]}')
        backup_json = json.loads(backups)
        if not backup_json.get('backups'):
            safe_print('ERROR: no backups recorded')
            return 1

        safe_print('Backend permanent protection verified.')
        return 0
    finally:
        client.close()


if __name__ == '__main__':
    sys.exit(main())
