const { pool, saveInvoice, getInvoicesByOwner, getInvoiceById, initDB } = require('../../src/services/db');

describe('Database Ownership Queries', () => {
  beforeAll(async () => {
    await initDB();
  });

  test('should retrieve invoices by owner email', async () => {
    const email = 'user@test.com';
    const invoiceData = {
      companyName: 'Test Co',
      companyDetails: 'Details',
      taxRate: 10,
      subtotal: 100,
      total: 110,
      items: [],
      owner_email: email
    };
    
    const saved = await saveInvoice(invoiceData);
    expect(saved.owner_email).toBe(email);

    const results = await getInvoicesByOwner(email);
    expect(results.length).toBeGreaterThan(0);
    expect(results[0].owner_email).toBe(email);
    expect(results[0].id).toBe(saved.id);
  });

  test('should retrieve invoice by id', async () => {
    const email = 'idtest@test.com';
    const saved = await saveInvoice({
      companyName: 'ID Test',
      owner_email: email,
      items: []
    });

    const result = await getInvoiceById(saved.id);
    expect(result).toBeDefined();
    expect(result.id).toBe(saved.id);
    expect(result.owner_email).toBe(email);
  });
});
