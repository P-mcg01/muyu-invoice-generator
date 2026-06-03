const { generatePDF } = require('../../src/services/pdf');
const PDFDocument = require('pdfkit');

jest.mock('pdfkit');

describe('generatePDF', () => {
  let mockDoc;

  beforeEach(() => {
    mockDoc = {
      on: jest.fn(),
      fontSize: jest.fn().mockReturnThis(),
      text: jest.fn().mockReturnThis(),
      moveDown: jest.fn().mockReturnThis(),
      moveTo: jest.fn().mockReturnThis(),
      lineTo: jest.fn().mockReturnThis(),
      stroke: jest.fn().mockReturnThis(),
      end: jest.fn(),
    };
    PDFDocument.mockImplementation(() => mockDoc);
  });

  test('should call PDFDocument methods and resolve with buffer', async () => {
    const invoice = {
      id: 1,
      created_at: new Date(),
      company_name: 'Test Co',
      company_details: 'Test Address',
      items: [{ description: 'Item 1', cost: 100 }],
      subtotal: 100,
      tax_rate: 10,
      total: 110,
    };

    // Simulate 'data' and 'end' events
    mockDoc.on.mockImplementation((event, callback) => {
      if (event === 'data') {
        callback(Buffer.from('pdf content'));
      }
      if (event === 'end') {
        callback();
      }
      return mockDoc;
    });

    const pdfBuffer = await generatePDF(invoice);

    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(mockDoc.fontSize).toHaveBeenCalledWith(25);
    expect(mockDoc.text).toHaveBeenCalledWith('INVOICE', expect.any(Object));
    expect(mockDoc.text).toHaveBeenCalledWith('Test Co');
    expect(mockDoc.end).toHaveBeenCalled();
  });
});
