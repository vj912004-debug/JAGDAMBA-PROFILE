import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;

const dbs = ['jagdamba_erp', 'jagdamba_db', 'Jagdamba_final'];

async function inspectDb(dbName) {
  const dbUrl = process.env.DATABASE_URL.replace(/\/Jagdamba_final$/i, '/' + dbName);
  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    console.log(`\n--- Connected to ${dbName} ---`);

    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log('Tables:', tables.rows.map(r => r.table_name));

    const erpExists = tables.rows.some(r => r.table_name === 'erp_data');
    if (erpExists) {
      const countRes = await client.query('SELECT COUNT(*) FROM erp_data');
      console.log('erp_data row count:', countRes.rows[0].count);

      const rows = await client.query('SELECT id, version, updated_at, length(data::text) as data_len FROM erp_data');
      console.log('erp_data rows:');
      rows.rows.forEach(r => {
        console.log(` - ID: ${r.id}, Version: ${r.version}, Updated At: ${r.updated_at}, Data Length: ${r.data_len} bytes`);
      });
    } else {
      console.log('erp_data table does not exist!');
    }

    await client.end();
  } catch (err) {
    console.error(`Error with ${dbName}:`, err.message);
  }
}

async function main() {
  for (const db of dbs) {
    await inspectDb(db);
  }
}

main();
