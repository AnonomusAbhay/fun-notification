import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env variables dynamically from correct path in monorepo
const envPaths = [
  path.join(__dirname, '../../.env'),
  path.join(__dirname, '../../../.env'),
  path.join(process.cwd(), 'apps/backend/.env'),
  path.join(process.cwd(), '.env'),
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
    break;
  }
}

const { Pool } = pg;

const dbName = process.env.PGDATABASE || 'fun_notifications';

// Production: use DATABASE_URL if available (Neon/Render provides this)
// Local dev: fall back to individual PG* environment variables
const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000,
    }
  : {
      host: process.env.PGHOST || 'localhost',
      port: parseInt(process.env.PGPORT || '5432'),
      user: process.env.PGUSER || 'postgres',
      password: process.env.PGPASSWORD || 'postgres',
      database: dbName,
      connectionTimeoutMillis: 5000,
    };

// Main connection pool
export const pool = new Pool(poolConfig);

export const query = (text: string, params?: any[]) => {
  return pool.query(text, params);
};

export const initializeDatabase = async () => {
  // Connect directly to the target database and initialize schema tables
  try {
    const client = await pool.connect();
    console.log(`Successfully connected to PostgreSQL database: ${dbName}`);
    client.release();

    // Read schema.sql from potential locations in development and production
    const schemaPaths = [
      path.join(__dirname, 'schema.sql'),
      path.join(__dirname, '../../src/db/schema.sql'),
      path.join(process.cwd(), 'apps/backend/src/db/schema.sql'),
      path.join(process.cwd(), 'src/db/schema.sql')
    ];
    
    let schemaSql = '';
    for (const p of schemaPaths) {
      if (fs.existsSync(p)) {
        schemaSql = fs.readFileSync(p, 'utf8');
        break;
      }
    }

    if (schemaSql) {
      await pool.query(schemaSql);
      console.log('Database tables successfully verified/initialized.');
    } else {
      console.warn('schema.sql file not found in any known locations. Skipping table verification.');
    }
  } catch (err: any) {
    console.error('Error verifying database tables:', err.message);
  }
};
