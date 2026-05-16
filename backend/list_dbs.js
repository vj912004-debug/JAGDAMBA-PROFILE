import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// Connect to 'postgres' database to list others
const { Client } = pg;
const dbUrl = process.env.DATABASE_URL.replace(/\/jagdamba_final$/, '/postgres');
const client = new Client({
  connectionString: dbUrl,
});

async function listDbs() {
  try {
    await client.connect();
    const res = await client.query('SELECT datname FROM pg_database WHERE datistemplate = false');
    console.log('Available Databases:');
    res.rows.forEach(row => console.log(' - ' + row.datname));
    await client.end();
  } catch (err) {
    console.error('Error listing databases:', err.message);
    process.exit(1);
  }
}

listDbs();
