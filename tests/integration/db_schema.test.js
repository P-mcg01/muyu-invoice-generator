const { pool, initDB } = require('../../src/services/db');

describe('Database Schema', () => {
  beforeAll(async () => {
    await initDB();
  });

  test('database should have owner_email column in invoices table', async () => {
    const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='invoices' AND column_name='owner_email'
    `);
    expect(res.rowCount).toBe(1);
  });
});
