import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;
// Connect to local jagdamba_erp
const dbUrl = process.env.DATABASE_URL.replace(/\/Jagdamba_final$/i, '/jagdamba_erp');
const client = new Client({ connectionString: dbUrl });

async function main() {
  try {
    await client.connect();
    console.log("Connected to local jagdamba_erp");
    
    const tables = [
      'User', 'Plate', 'Usage', 'Dispatch', 'Challan',
      'PurchaseOrder', 'PurchaseReceipt', 'OrderItem', 'Order'
    ];
    
    for (const t of tables) {
      const res = await client.query(`SELECT COUNT(*) FROM "${t}"`);
      console.log(`Table ${t}: ${res.rows[0].count} rows`);
      if (parseInt(res.rows[0].count) > 0) {
        const sample = await client.query(`SELECT * FROM "${t}" LIMIT 2`);
        console.log("Sample:", sample.rows);
      }
    }
    
    await client.end();
  } catch (err) {
    console.error("Error:", err.message);
  }
}

main();
