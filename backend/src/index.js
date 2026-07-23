import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db.js';
import mailRoutes from './routes/mail.js';
import erpRoutes from './routes/erp.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/mail', mailRoutes);
app.use('/api/erp', erpRoutes);

// Health Check Endpoint
app.get('/api/health', async (req, res) => {
  let dbStatus = 'DISCONNECTED';
  let timestamp = null;
  let error = null;

  try {
    const result = await pool.query('SELECT NOW()');
    dbStatus = 'CONNECTED';
    timestamp = result.rows[0].now;
  } catch (err) {
    error = err.message;
  }

  res.json({
    status: dbStatus === 'CONNECTED' ? 'UP' : 'DEGRADED',
    database: dbStatus,
    timestamp,
    error,
    server_time: new Date().toISOString()
  });
});

// Basic route
app.get('/', (req, res) => {
  res.send('Jagdamba Portal API is running');
});

app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);
  try {
    const pool = (await import('./config/db.js')).default;
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
    console.log('ERP backup schema ready');
  } catch (err) {
    console.error('ERP schema init warning:', err.message);
  }
});
