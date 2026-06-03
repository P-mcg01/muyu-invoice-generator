const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id SERIAL PRIMARY KEY,
        company_name TEXT NOT NULL,
        company_details TEXT,
        tax_rate NUMERIC,
        subtotal NUMERIC,
        total NUMERIC,
        items JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Database initialized');
  } finally {
    client.release();
  }
}

async function saveInvoice(invoiceData) {
  const { companyName, companyDetails, taxRate, subtotal, total, items } = invoiceData;
  const result = await pool.query(
    'INSERT INTO invoices (company_name, company_details, tax_rate, subtotal, total, items) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
    [companyName, companyDetails, taxRate, subtotal, total, JSON.stringify(items)]
  );
  return result.rows[0];
}

module.exports = {
  pool,
  initDB,
  saveInvoice,
};
