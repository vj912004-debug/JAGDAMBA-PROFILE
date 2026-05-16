import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db.js';
import mailRoutes from './routes/mail.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api/mail', mailRoutes);

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
