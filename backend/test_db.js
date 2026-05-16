import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function test() {
  try {
    console.log('Testing connection to:', process.env.DATABASE_URL.replace(/:([^:@]+)@/, ':****@'));
    await client.connect();
    console.log('SUCCESS: Connected to PostgreSQL!');
    const res = await client.query('SELECT current_database(), current_user, version()');
    console.log('Details:', res.rows[0]);
    await client.end();
  } catch (err) {
    console.error('ERROR connecting to PostgreSQL:');
    console.error('Code:', err.code);
    console.error('Message:', err.message);
    if (err.code === '28P01') {
      console.log('TIP: This means the password for user "postgres" is incorrect or not supplied.');
    } else if (err.code === '3D000') {
      console.log('TIP: The database "jagdamba_db" does not exist. You need to create it first.');
    }
    process.exit(1);
  }
}

test();
