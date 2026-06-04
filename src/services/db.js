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
        owner_email TEXT,
        tax_rate NUMERIC,
        subtotal NUMERIC,
        total NUMERIC,
        items JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await client.query(`ALTER TABLE invoices ADD COLUMN IF NOT EXISTS owner_email TEXT;`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_invoices_owner ON invoices(owner_email);`);
    console.log('Database initialized');
  } finally {
    client.release();
  }
}

async function saveInvoice(invoiceData) {
  const { companyName, companyDetails, taxRate, subtotal, total, items, owner_email } = invoiceData;
  const result = await pool.query(
    'INSERT INTO invoices (company_name, company_details, tax_rate, subtotal, total, items, owner_email) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
    [companyName, companyDetails, taxRate, subtotal, total, JSON.stringify(items), owner_email]
  );
  return result.rows[0];
}

async function getInvoicesByOwner(email) {
  const result = await pool.query(
    'SELECT * FROM invoices WHERE owner_email = $1 ORDER BY created_at DESC',
    [email]
  );
  return result.rows;
}

async function getInvoiceById(id) {
  const result = await pool.query('SELECT * FROM invoices WHERE id = $1', [id]);
  return result.rows[0];
}

module.exports = {
  pool,
  initDB,
  saveInvoice,
  getInvoicesByOwner,
  getInvoiceById,
};
