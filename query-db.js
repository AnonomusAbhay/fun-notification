import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables from apps/backend/.env
const envPath = path.join(process.cwd(), 'apps/backend/.env');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
} else {
  dotenv.config();
}

const { Pool } = pg;
const dbName = process.env.PGDATABASE || 'fun_notifications';

const pool = new Pool({
  host: process.env.PGHOST || 'localhost',
  port: parseInt(process.env.PGPORT || '5432'),
  user: process.env.PGUSER || 'postgres',
  password: process.env.PGPASSWORD || 'postgres',
  database: dbName,
  connectionTimeoutMillis: 5000,
});

async function run() {
  console.log(`Connecting to database "${dbName}"...`);
  const client = await pool.connect();
  try {
    const res = await client.query("SELECT id, sender_name, recipient_id, message, theme, delivered, created_at FROM notifications ORDER BY created_at DESC LIMIT 10;");
    console.log("\nRecent Notifications in Database:");
    console.table(res.rows);
  } catch (err) {
    console.error("Query failed:", err.message);
  } finally {
    client.release();
    await pool.end();
    console.log("Database connection closed.");
  }
}

run();
