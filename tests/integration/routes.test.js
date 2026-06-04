const request = require('supertest');
const { app } = require('../../src/web');
const { saveInvoice } = require('../../src/services/db');
const { generatePDF } = require('../../src/services/pdf');
const { logger } = require('../../src/services/logger');

jest.mock('../../src/services/db');
jest.mock('../../src/services/pdf');

describe('API Routes', () => {
  test('should have cookie-parser middleware configured', async () => {
    const hasCookieParser = app._router.stack.some(layer => layer.name === 'cookieParser');
    expect(hasCookieParser).toBe(true);
  });

  describe('GET /health', () => {
    test('should return 200 OK', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('OK');
    });
  });

  describe('GET /', () => {
    test('should return 200 OK and HTML', async () => {
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.type).toBe('text/html');
    });
  });

  describe('POST /generate', () => {
    test('should return 200 and PDF buffer on success', async () => {
      const mockInvoice = { id: 1, company_name: 'Test', items: [] };
      saveInvoice.mockResolvedValue(mockInvoice);
      generatePDF.mockResolvedValue(Buffer.from('pdf content'));

      const response = await request(app)
        .post('/generate')
        .type('form')
        .send({
          companyName: 'Test Co',
          taxRate: '10',
          'expenses[0][description]': 'Item 1',
          'expenses[0][cost]': '100'
        });

      expect(response.status).toBe(200);
      expect(response.header['content-type']).toBe('application/pdf');
      expect(response.header['content-disposition']).toContain('invoice-1.pdf');
    });

    test('should return 400 if expenses are missing', async () => {
      const response = await request(app)
        .post('/generate')
        .type('form')
        .send({ companyName: 'Test Co' });

      expect(response.status).toBe(400);
    });

    test('should return 500 if saveInvoice fails', async () => {
      saveInvoice.mockRejectedValue(new Error('DB Error'));
      const errorSpy = jest.spyOn(logger, 'error').mockImplementation(() => {});

      const response = await request(app)
        .post('/generate')
        .type('form')
        .send({
          companyName: 'Test Co',
          'expenses[0][description]': 'Item 1',
          'expenses[0][cost]': '100'
        });

      expect(response.status).toBe(500);
      expect(errorSpy).toHaveBeenCalled();
      errorSpy.mockRestore();
    });

    test('should save owner_email from user_email cookie', async () => {
      const email = 'tester@example.com';
      const mockInvoice = { id: 1, company_name: 'Test', items: [], owner_email: email };
      saveInvoice.mockResolvedValue(mockInvoice);
      generatePDF.mockResolvedValue(Buffer.from('pdf content'));

      const response = await request(app)
        .post('/generate')
        .set('Cookie', [`user_email=${email}`])
        .type('form')
        .send({
          companyName: 'Test Co',
          taxRate: '10',
          'expenses[0][description]': 'Item 1',
          'expenses[0][cost]': '100'
        });

      expect(response.status).toBe(200);
      expect(saveInvoice).toHaveBeenCalledWith(expect.objectContaining({
        owner_email: email
      }));
    });
  });

  describe('GET /past-invoices', () => {
    test('should redirect to / if user_email cookie is missing', async () => {
      const response = await request(app).get('/past-invoices');
      expect(response.status).toBe(302);
      expect(response.header.location).toBe('/');
    });

    test('should return 200 and list invoices for valid user_email', async () => {
      const email = 'history@test.com';
      const mockInvoices = [{ id: 1, company_name: 'History Co', owner_email: email }];
      const { getInvoicesByOwner } = require('../../src/services/db');
      getInvoicesByOwner.mockResolvedValue(mockInvoices);

      const response = await request(app)
        .get('/past-invoices')
        .set('Cookie', [`user_email=${email}`]);

      expect(response.status).toBe(200);
      expect(getInvoicesByOwner).toHaveBeenCalledWith(email);
    });
  });

  describe('GET /download/:id', () => {
    test('should return 404 if invoice not found', async () => {
      const { getInvoiceById } = require('../../src/services/db');
      getInvoiceById.mockResolvedValue(null);

      const response = await request(app)
        .get('/download/999')
        .set('Cookie', ['user_email=test@test.com']);
      
      expect(response.status).toBe(404);
    });

    test('should return 403 if owner mismatch', async () => {
      const { getInvoiceById } = require('../../src/services/db');
      getInvoiceById.mockResolvedValue({ id: 1, owner_email: 'owner@test.com' });

      const response = await request(app)
        .get('/download/1')
        .set('Cookie', ['user_email=hacker@test.com']);
      
      expect(response.status).toBe(403);
    });

    test('should return 200 and PDF if owner matches', async () => {
      const email = 'owner@test.com';
      const { getInvoiceById } = require('../../src/services/db');
      getInvoiceById.mockResolvedValue({ id: 1, owner_email: email, items: [] });
      generatePDF.mockResolvedValue(Buffer.from('pdf content'));

      const response = await request(app)
        .get('/download/1')
        .set('Cookie', [`user_email=${email}`]);
      
      expect(response.status).toBe(200);
      expect(response.header['content-type']).toBe('application/pdf');
    });
  });
});
