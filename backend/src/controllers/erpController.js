import pool from '../config/db.js';

const ERP_ID = 'main';
const MAX_BACKUPS = 50;

/** Business collections that must never be wiped by an empty client payload. */
const PROTECTED_ARRAY_KEYS = [
  'parties',
  'purchaseOrders',
  'purchaseReceipts',
  'orders',
  'tcRecords',
  'challans',
  'dispatches',
  'plates',
  'usages',
  'quotations',
  'cncQuotations',
  'ringQuotations',
  'transportBills',
  'logs',
  'grades',
  'items',
  'sections',
  'workers',
  'transports',
  'cuttingAllocations',
  'cncRateCalculations',
  'jobWorkOutwards',
  'jobWorkInwards',
  'weighbridgeEntries',
  'rejectMaterialReturns',
  'anmsMtcRecords',
];

const CRITICAL_KEYS = [
  'parties',
  'purchaseOrders',
  'purchaseReceipts',
  'orders',
  'tcRecords',
  'challans',
  'dispatches',
  'plates',
  'quotations',
  'cncQuotations',
  'ringQuotations',
  'jobWorkOutwards',
  'jobWorkInwards',
  'weighbridgeEntries',
  'rejectMaterialReturns',
  'anmsMtcRecords',
];

let schemaReady = null;

function erpCriticalWeight(data) {
  if (!data || typeof data !== 'object') return 0;
  return CRITICAL_KEYS.reduce((sum, key) => {
    const rows = data[key];
    return sum + (Array.isArray(rows) ? rows.length : 0);
  }, 0);
}

function arrayLen(data, key) {
  return Array.isArray(data?.[key]) ? data[key].length : 0;
}

/**
 * Merge incoming ERP payload with existing DB data.
 * Empty arrays NEVER replace non-empty collections (permanent anti-wipe).
 * For purchaseOrders, also protect line-items inside each PO.
 */
function mergeErpPayload(existing, incoming) {
  const base = existing && typeof existing === 'object' ? existing : {};
  const next = incoming && typeof incoming === 'object' ? incoming : {};
  const merged = { ...base, ...next };
  const protectedKeys = [];

  for (const key of PROTECTED_ARRAY_KEYS) {
    const prev = Array.isArray(base[key]) ? base[key] : [];
    const incomingArr = Array.isArray(next[key]) ? next[key] : null;

    if (incomingArr === null) {
      merged[key] = prev;
      continue;
    }

    // Permanent rule: never wipe a non-empty collection with []
    if (prev.length > 0 && incomingArr.length === 0) {
      merged[key] = prev;
      protectedKeys.push(key);
      continue;
    }

    if (key === 'purchaseOrders') {
      merged[key] = mergePurchaseOrdersProtectingItems(prev, incomingArr);
      continue;
    }

    merged[key] = incomingArr;
  }

  if (next.companyProfile && typeof next.companyProfile === 'object') {
    merged.companyProfile = next.companyProfile;
  } else if (base.companyProfile) {
    merged.companyProfile = base.companyProfile;
  }

  if (next.preferences && typeof next.preferences === 'object') {
    merged.preferences = next.preferences;
  } else if (base.preferences) {
    merged.preferences = base.preferences;
  }

  return { merged, protectedKeys };
}

function mergePurchaseOrdersProtectingItems(existingPos, incomingPos) {
  const map = new Map();
  for (const po of existingPos || []) {
    if (po && po.id) map.set(String(po.id), po);
  }
  for (const po of incomingPos || []) {
    if (!po || !po.id) continue;
    const id = String(po.id);
    const prev = map.get(id);
    if (!prev) {
      map.set(id, po);
      continue;
    }
    const prevItems = Array.isArray(prev.items) ? prev.items.length : 0;
    const nextItems = Array.isArray(po.items) ? po.items.length : 0;
    if (nextItems === 0 && prevItems > 0) {
      map.set(id, { ...po, items: prev.items });
    } else {
      map.set(id, po);
    }
  }
  return Array.from(map.values());
}

async function ensureSchema() {
  if (schemaReady) return schemaReady;
  schemaReady = (async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS erp_data (
        id TEXT PRIMARY KEY DEFAULT 'main',
        data JSONB NOT NULL DEFAULT '{}',
        version TEXT DEFAULT 'v4_seeded',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      INSERT INTO erp_data (id, data, version)
      VALUES ('main', '{}', 'v4_seeded')
      ON CONFLICT (id) DO NOTHING
    `);
    await pool.query(`
      CREATE TABLE IF NOT EXISTS erp_data_backups (
        id BIGSERIAL PRIMARY KEY,
        erp_id TEXT NOT NULL DEFAULT 'main',
        data JSONB NOT NULL,
        version TEXT,
        critical_weight INTEGER NOT NULL DEFAULT 0,
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_erp_data_backups_created
      ON erp_data_backups (erp_id, created_at DESC)
    `);
  })();
  return schemaReady;
}

async function createBackup(client, existing, version, reason) {
  if (!existing || typeof existing !== 'object') return;
  if (Object.keys(existing).length === 0) return;
  if (erpCriticalWeight(existing) <= 0) return;

  await client.query(
    `INSERT INTO erp_data_backups (erp_id, data, version, critical_weight, reason)
     VALUES ($1, $2, $3, $4, $5)`,
    [ERP_ID, existing, version || null, erpCriticalWeight(existing), reason || 'pre_save']
  );

  await client.query(
    `DELETE FROM erp_data_backups
     WHERE id IN (
       SELECT id FROM erp_data_backups
       WHERE erp_id = $1
       ORDER BY created_at DESC
       OFFSET $2
     )`,
    [ERP_ID, MAX_BACKUPS]
  );
}

export const getErpData = async (req, res) => {
  try {
    await ensureSchema();
    const result = await pool.query(
      'SELECT data, version, updated_at FROM erp_data WHERE id = $1',
      [ERP_ID]
    );

    if (result.rows.length === 0) {
      return res.json({ success: true, data: null, version: null, updated_at: null });
    }

    const row = result.rows[0];
    const data = row.data && Object.keys(row.data).length > 0 ? row.data : null;

    res.json({
      success: true,
      data,
      version: row.version,
      updated_at: row.updated_at,
      criticalWeight: erpCriticalWeight(data),
    });
  } catch (error) {
    console.error('GET /api/erp/data error:', error);
    res.status(500).json({ success: false, message: 'Failed to load ERP data', error: error.message });
  }
};

export const saveErpData = async (req, res) => {
  const { data, version, forceWipe } = req.body;

  if (!data || typeof data !== 'object') {
    return res.status(400).json({ success: false, message: 'Invalid ERP data payload' });
  }

  const client = await pool.connect();
  try {
    await ensureSchema();
    await client.query('BEGIN');

    const existingResult = await client.query(
      'SELECT data, version, updated_at FROM erp_data WHERE id = $1 FOR UPDATE',
      [ERP_ID]
    );
    const existing = existingResult.rows[0]?.data || null;
    const existingVersion = existingResult.rows[0]?.version || null;
    const existingWeight = erpCriticalWeight(existing);
    const incomingWeight = erpCriticalWeight(data);

    // Hard reject total wipes (unless explicit admin forceWipe)
    if (!forceWipe && existingWeight > 0 && incomingWeight === 0) {
      await client.query('ROLLBACK');
      console.error(`Blocked ERP wipe: existing=${existingWeight}, incoming=0`);
      return res.status(409).json({
        success: false,
        message: 'Refusing to overwrite ERP data with an empty payload',
        existingWeight,
        incomingWeight,
      });
    }

    if (!forceWipe && existingWeight >= 10 && incomingWeight < Math.ceil(existingWeight * 0.35)) {
      await client.query('ROLLBACK');
      console.error(`Blocked ERP shrink: existing=${existingWeight}, incoming=${incomingWeight}`);
      return res.status(409).json({
        success: false,
        message: 'Refusing to overwrite ERP data with a much smaller payload',
        existingWeight,
        incomingWeight,
      });
    }

    // Permanent merge: empty collections cannot erase existing ones
    const { merged, protectedKeys } = forceWipe
      ? { merged: data, protectedKeys: [] }
      : mergeErpPayload(existing, data);

    const mergedWeight = erpCriticalWeight(merged);

    // Snapshot current row before replacing it
    await createBackup(client, existing, existingVersion, 'pre_save');

    const result = await client.query(
      `INSERT INTO erp_data (id, data, version, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (id) DO UPDATE SET
         data = EXCLUDED.data,
         version = EXCLUDED.version,
         updated_at = NOW()
       RETURNING updated_at`,
      [ERP_ID, merged, version || existingVersion || 'v4_seeded']
    );

    await client.query('COMMIT');

    if (protectedKeys.length) {
      console.warn(`ERP save protected keys from wipe: ${protectedKeys.join(', ')}`);
    }

    res.json({
      success: true,
      message: 'ERP data saved successfully',
      updated_at: result.rows[0].updated_at,
      criticalWeight: mergedWeight,
      protectedKeys,
    });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore
    }
    console.error('PUT /api/erp/data error:', error);
    res.status(500).json({ success: false, message: 'Failed to save ERP data', error: error.message });
  } finally {
    client.release();
  }
};

/** List recent backups (for recovery / ops). */
export const listErpBackups = async (req, res) => {
  try {
    await ensureSchema();
    const result = await pool.query(
      `SELECT id, version, critical_weight, reason, created_at
       FROM erp_data_backups
       WHERE erp_id = $1
       ORDER BY created_at DESC
       LIMIT 20`,
      [ERP_ID]
    );
    res.json({ success: true, backups: result.rows });
  } catch (error) {
    console.error('GET /api/erp/backups error:', error);
    res.status(500).json({ success: false, message: 'Failed to list backups', error: error.message });
  }
};

/** Restore ERP data from a backup id (or latest if omitted). */
export const restoreErpBackup = async (req, res) => {
  const backupId = req.params.id || req.body?.backupId;
  const client = await pool.connect();
  try {
    await ensureSchema();
    await client.query('BEGIN');

    const backupResult = backupId
      ? await client.query(
          `SELECT id, data, version, critical_weight FROM erp_data_backups
           WHERE erp_id = $1 AND id = $2`,
          [ERP_ID, backupId]
        )
      : await client.query(
          `SELECT id, data, version, critical_weight FROM erp_data_backups
           WHERE erp_id = $1
           ORDER BY created_at DESC
           LIMIT 1`,
          [ERP_ID]
        );

    if (!backupResult.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'No ERP backup found' });
    }

    const backup = backupResult.rows[0];
    const current = await client.query(
      'SELECT data, version FROM erp_data WHERE id = $1 FOR UPDATE',
      [ERP_ID]
    );
    await createBackup(
      client,
      current.rows[0]?.data || null,
      current.rows[0]?.version || null,
      `pre_restore_from_${backup.id}`
    );

    const result = await client.query(
      `INSERT INTO erp_data (id, data, version, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (id) DO UPDATE SET
         data = EXCLUDED.data,
         version = EXCLUDED.version,
         updated_at = NOW()
       RETURNING updated_at`,
      [ERP_ID, backup.data, backup.version || 'v4_seeded']
    );

    await client.query('COMMIT');
    res.json({
      success: true,
      message: `Restored ERP data from backup #${backup.id}`,
      backupId: backup.id,
      criticalWeight: backup.critical_weight,
      updated_at: result.rows[0].updated_at,
    });
  } catch (error) {
    try {
      await client.query('ROLLBACK');
    } catch {
      // ignore
    }
    console.error('POST /api/erp/restore error:', error);
    res.status(500).json({ success: false, message: 'Failed to restore backup', error: error.message });
  } finally {
    client.release();
  }
};

export { erpCriticalWeight, mergeErpPayload, arrayLen };
