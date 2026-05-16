import pg from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function init() {
  try {
    await client.connect();
    console.log('Connected to database for initialization...');
    
    const sql = fs.readFileSync('init.sql', 'utf8');
    await client.query(sql);
    
    console.log('SUCCESS: Database tables created successfully!');
    await client.end();
  } catch (err) {
    console.error('ERROR during initialization:');
    console.error(err.message);
    process.exit(1);
  }
}

init();
