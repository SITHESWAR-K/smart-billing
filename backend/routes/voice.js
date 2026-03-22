const express = require('express');
const router = express.Router();

// Note: Voice-to-text is now handled on the frontend using the FREE Web Speech API
// This route is kept for potential future use with server-side processing

/**
 * POST /api/voice/parse-product
 * Parse product information from text (no AI needed)
 */
router.post('/parse-product', (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({
        error: 'No text provided'
      });
    }

    // Simple parsing logic (same as frontend)
    const lowerText = text.toLowerCase().trim();
    
    // Extract price
    let price = null;
    const priceMatch = lowerText.match(/(\d+(?:\.\d+)?)\s*(?:rupees?|rs|₹)/i) ||
                       lowerText.match(/(?:rupees?|rs|₹)\s*(\d+(?:\.\d+)?)/i) ||
                       lowerText.match(/(\d+(?:\.\d+)?)\s*$/);
    if (priceMatch) {
      price = parseFloat(priceMatch[1]);
    }

    // Extract quantity
    let quantity = 1;
    const quantityMatch = lowerText.match(/(\d+(?:\.\d+)?)\s*(?:kg|kilo|g|gram|l|liter|ml|pieces?|pcs?|units?)/i);
    if (quantityMatch) {
      quantity = parseFloat(quantityMatch[1]);
    }

    // Clean product name
    let name = text
      .replace(/(\d+(?:\.\d+)?)\s*(?:rupees?|rs|₹)/gi, '')
      .replace(/(?:rupees?|rs|₹)\s*(\d+(?:\.\d+)?)/gi, '')
      .replace(/(\d+(?:\.\d+)?)\s*(?:kg|kilo|g|gram|l|liter|ml|pieces?|pcs?|units?)/gi, '')
      .replace(/\s+/g, ' ')
      .trim();

    res.json({
      success: true,
      product: {
        name: name || null,
        price,
        quantity
      }
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to parse product',
      details: error.message
    });
  }
});

/**
 * GET /api/voice/status
 * Check voice API status
 */
router.get('/status', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Voice-to-text is handled on frontend using Web Speech API (FREE)',
    note: 'No OpenAI API key required!'
  });
});

module.exports = router;
