const express = require('express');
const path = require('path');
const helmet = require('helmet');
const { httpLogger, logger } = require('./services/logger');
const { calculateInvoice } = require('./services/calculations');
const { initDB, saveInvoice, pool } = require('./services/db');
const { generatePDF } = require('./services/pdf');

const app = express();
const PORT = process.env.PORT || 3000;

// Environment Validation
if (!process.env.DATABASE_URL) {
  console.error('FATAL: DATABASE_URL environment variable is not set.');
  process.exit(1);
}

// Middleware
app.use(httpLogger);
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      ...helmet.contentSecurityPolicy.getDefaultDirectives(),
      "script-src": ["'self'", "https://unpkg.com", "https://cdn.jsdelivr.net", "'unsafe-inline'", "'unsafe-eval'"],
      "img-src": ["'self'", "data:", "https://unpkg.com", "https://cdn.jsdelivr.net"],
      "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      "font-src": ["'self'", "https://fonts.gstatic.com"],
      "connect-src": ["'self'", "https://cdn.jsdelivr.net"],
    },
  },
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));
app.use(express.static(path.join(__dirname, '../public')));
app.use(express.urlencoded({ extended: true }));

// Routes
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/', (req, res) => {
  res.render('index');
});

app.post('/generate', async (req, res) => {
  try {
    const { companyName, companyDetails, taxRate, expenses } = req.body;
    
    if (!expenses) {
      return res.status(400).send('At least one expense is required.');
    }

    // Use the calculation service
    const invoiceData = calculateInvoice(expenses, taxRate);

    // Save to DB
    const invoice = await saveInvoice({
      companyName,
      companyDetails,
      ...invoiceData
    });

    // Generate PDF
    const pdfBuffer = await generatePDF(invoice);

    // Stream PDF response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${invoice.id}.pdf`);
    res.send(pdfBuffer);
  } catch (error) {
    logger.error('Error generating invoice:', error);
    res.status(500).send('An error occurred while generating the invoice.');
  }
});

// Lifecycle management
const shutdown = async () => {
  logger.info('Shutting down: closing database pool');
  await pool.end();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Start Server
async function start() {
  try {
    await initDB();
    app.listen(PORT, () => {
      logger.info(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  /* istanbul ignore next */
  start();
}

module.exports = { app, shutdown, start };
