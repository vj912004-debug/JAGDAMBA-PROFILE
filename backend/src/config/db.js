import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

function buildPoolConfig() {
  const url = process.env.DATABASE_URL;
  if (url && typeof url === 'string' && url.trim()) {
    // If password contains unencoded '@', URL parsing breaks and pg gets a non-string password.
    try {
      const parsed = new URL(url);
      if (parsed.password != null && typeof parsed.password !== 'string') {
        parsed.password = String(parsed.password ?? '');
      }
      return { connectionString: parsed.toString() };
    } catch {
      return { connectionString: url };
    }
  }

  const password = process.env.DB_PASSWORD ?? process.env.PGPASSWORD ?? '';
  return {
    host: process.env.DB_HOST || process.env.PGHOST || 'localhost',
    port: Number(process.env.DB_PORT || process.env.PGPORT || 5432),
    user: process.env.DB_USER || process.env.PGUSER || 'postgres',
    password: String(password),
    database: process.env.DB_NAME || process.env.PGDATABASE || 'jagdamba_final',
  };
}

const pool = new Pool(buildPoolConfig());

pool.on('connect', () => {
  console.log('PostgreSQL Database Connected Successfully');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

export const query = (text, params) => pool.query(text, params);

export default pool;
