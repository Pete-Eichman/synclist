import { Pool } from 'pg';

// Single shared pool — pg manages the connection lifecycle internally
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export default pool;
