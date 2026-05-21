/**
 * AI Report Generator - Backend Server
 * Express server that handles portfolio extraction with Claude Vision API
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const { extractPortfolioFromImage } = require('./extractionService');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (JPEG, PNG, GIF, WebP)'));
    }
  },
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  console.log('[SERVER] Health check');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

/**
 * Extract portfolio from image
 * POST /api/extract
 * Body: FormData with 'file' field containing image
 */
app.post('/api/extract', upload.single('file'), async (req, res) => {
  console.log('[SERVER] Extract request received');

  try {
    // Validate file
    if (!req.file) {
      console.log('[SERVER] No file provided');
      return res.status(400).json({ error: 'No file provided' });
    }

    console.log('[SERVER] File received:', {
      originalname: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
    });

    // Extract holdings from image
    const holdings = await extractPortfolioFromImage(req.file.buffer, req.file.mimetype);

    console.log('[SERVER] Extraction successful, returning', holdings.length, 'holdings');

    // Return extracted holdings
    res.json({
      success: true,
      holdings,
      message: `Successfully extracted ${holdings.length} holdings from the image`,
    });
  } catch (error) {
    console.error('[SERVER] Error in /api/extract:', error.message);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to extract portfolio data',
    });
  }
});

/**
 * 404 Handler
 */
app.use((req, res) => {
  console.log('[SERVER] 404 - Not found:', req.method, req.path);
  res.status(404).json({ error: 'Endpoint not found' });
});

/**
 * Error handler
 */
app.use((err, req, res, next) => {
  console.error('[SERVER] Error:', err.message);
  res.status(500).json({
    error: err.message || 'Internal server error',
  });
});

/**
 * Start server
 */
app.listen(PORT, () => {
  console.log(`[SERVER] Started on port ${PORT}`);
  console.log(`[SERVER] Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`[SERVER] API ready at http://localhost:${PORT}/api/extract`);

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('[SERVER] ⚠️  WARNING: ANTHROPIC_API_KEY not set in .env');
  }
});

module.exports = app;
