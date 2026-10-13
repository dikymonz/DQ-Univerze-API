const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL || "postgresql://postgres.jeuzfeuqmyobilatcvmn:%40Dikymonz03@aws-0-ap-south-1.pooler.supabase.com:6543/postgres";

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
};