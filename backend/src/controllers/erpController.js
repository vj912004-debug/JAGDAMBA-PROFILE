import pool from '../config/db.js';

const ERP_ID = 'main';

export const getErpData = async (req, res) => {
  try {
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
    });
  } catch (error) {
    console.error('GET /api/erp/data error:', error);
    res.status(500).json({ success: false, message: 'Failed to load ERP data', error: error.message });
  }
};

export const saveErpData = async (req, res) => {
  const { data, version } = req.body;

  if (!data || typeof data !== 'object') {
    return res.status(400).json({ success: false, message: 'Invalid ERP data payload' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO erp_data (id, data, version, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (id) DO UPDATE SET
         data = EXCLUDED.data,
         version = EXCLUDED.version,
         updated_at = NOW()
       RETURNING updated_at`,
      [ERP_ID, data, version || 'v4_seeded']
    );

    res.json({
      success: true,
      message: 'ERP data saved successfully',
      updated_at: result.rows[0].updated_at,
    });
  } catch (error) {
    console.error('PUT /api/erp/data error:', error);
    res.status(500).json({ success: false, message: 'Failed to save ERP data', error: error.message });
  }
};
