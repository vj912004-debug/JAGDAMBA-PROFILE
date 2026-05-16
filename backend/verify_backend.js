import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Client } = pg;
const client = new Client({
  connectionString: process.env.DATABASE_URL,
});

async function verify() {
  try {
    await client.connect();
    console.log('--- FINAL SYSTEM CHECK ---');
    
    // 1. Check Table Existence
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'email_logs'
      );
    `);
    console.log('Table "email_logs" exists:', tableCheck.rows[0].exists);

    // 2. Test Insert
    console.log('Attempting test log entry...');
    const testEmail = 'test@example.com';
    const testSubject = 'SYSTEM VERIFICATION';
    await client.query(
      'INSERT INTO email_logs (recipient_email, subject, message_id, file_name) VALUES ($1, $2, $3, $4)',
      [testEmail, testSubject, 'msg_verify_' + Date.now(), 'verify.pdf']
    );
    console.log('Insert successful!');

    // 3. Test Read
    console.log('Verifying data retrieval...');
    const readRes = await client.query('SELECT * FROM email_logs WHERE recipient_email = $1 ORDER BY sent_at DESC LIMIT 1', [testEmail]);
    if (readRes.rows.length > 0) {
      console.log('Retrieved Data:', {
        email: readRes.rows[0].recipient_email,
        subject: readRes.rows[0].subject,
        time: readRes.rows[0].sent_at
      });
      console.log('--- ALL SYSTEMS READY ---');
    } else {
      throw new Error('Data was inserted but could not be retrieved!');
    }

    await client.end();
  } catch (err) {
    console.error('SYSTEM CHECK FAILED:');
    console.error(err.message);
    process.exit(1);
  }
}

verify();
