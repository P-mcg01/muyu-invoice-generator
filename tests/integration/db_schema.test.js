const { pool, initDB } = require('../../src/services/db');

describe('Database Schema', () => {
  beforeAll(async () => {
    await initDB();
  });

  afterAll(async () => {
    await pool.end();
  });

  test('database should have owner_email column in invoices table', async () => {
    const res = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='invoices' AND column_name='owner_email'
    `);
    expect(res.rowCount).toBe(1);
  });

  test('database should have user_profiles table', async () => {
    const res = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public' AND table_name='user_profiles'");
    expect(res.rowCount).toBe(1);
  });
});
