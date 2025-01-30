import { Pool } from 'pg';

const pool = new Pool({
    // host: process.env.NEXT_PUBLIC_HOST,
    // port: process.env.NEXT_PUBLIC_PORT,
    // user: process.env.NEXT_PUBLIC_USER,
    // password: process.env.NEXT_PUBLIC_PASSWORD,
    // database: process.env.NEXT_PUBLIC_DATABASE,
    connectionString : process.env.DATABASE_URL
});



export default pool;
