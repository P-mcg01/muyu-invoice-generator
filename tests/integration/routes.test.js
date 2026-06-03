const request = require('supertest');
const { app } = require('../../src/web');
const { saveInvoice } = require('../../src/services/db');
const { generatePDF } = require('../../src/services/pdf');
const { logger } = require('../../src/services/logger');

jest.mock('../../src/services/db');
jest.mock('../../src/services/pdf');

describe('API Routes', () => {
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
  });
});
