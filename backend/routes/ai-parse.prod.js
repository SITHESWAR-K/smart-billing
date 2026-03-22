const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');

// Initialize Groq client
const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw new Error('GROQ_API_KEY not configured');
  }
  return new Groq({ apiKey });
};

/**
 * POST /api/ai-parse/product
 * Parse product information from natural speech using AI
 */
router.post('/product', async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const groq = getGroqClient();

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a product information parser for a billing system. Extract product details from natural speech.

Rules:
- Extract product NAME (capitalize properly)
- Extract PRICE in rupees (number only)
- Extract QUANTITY (if mentioned with units like kg, pieces, liters - use the LAST number mentioned as quantity)
- If user says "2 kg 2 pieces", quantity = 2 (last number)
- Return ONLY valid JSON, no other text
- If price not mentioned, set price to null
- If quantity not mentioned, set quantity to 1

Examples:
Input: "rice 2 kg 2 pieces 50 rupees"
Output: {"name": "Rice", "price": 50, "quantity": 2}

Input: "sugar 80 rupees"
Output: {"name": "Sugar", "price": 80, "quantity": 1}

Input: "amul butter 1 kg for 55"
Output: {"name": "Amul Butter", "price": 55, "quantity": 1}

Input: "oil 3 pieces"
Output: {"name": "Oil", "price": null, "quantity": 3}

Now parse this:`
        },
        {
          role: 'user',
          content: text
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      max_tokens: 150,
      response_format: { type: 'json_object' }
    });

    const responseText = completion.choices[0]?.message?.content;
    
    if (!responseText) {
      return res.status(500).json({ error: 'No response from AI' });
    }

    const parsed = JSON.parse(responseText);

    // Validate and clean the response
    const result = {
      name: parsed.name || null,
      price: parsed.price !== null && !isNaN(parsed.price) ? parseFloat(parsed.price) : null,
      quantity: parsed.quantity !== null && !isNaN(parsed.quantity) ? parseFloat(parsed.quantity) : 1,
      confidence: 'high'
    };

    res.json(result);
  } catch (error) {
    console.error('AI Parse Error:', error);
    res.status(500).json({ 
      error: 'Failed to parse with AI',
      details: error.message,
      fallback: true
    });
  }
});

/**
 * POST /api/ai-parse/billing
 * Parse billing items from natural speech
 */
router.post('/billing', async (req, res) => {
  try {
    const { text, availableProducts } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const groq = getGroqClient();

    const productList = availableProducts?.map(p => p.name).join(', ') || 'No products available';

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a billing assistant. Match spoken product names to available products.

Available products: ${productList}

Rules:
- Match spoken text to the closest product name
- If quantity mentioned (kg, pieces, liters), extract it
- Return product name EXACTLY as it appears in available products
- Return ONLY valid JSON

Output format:
{"productName": "exact product name", "quantity": number}`
        },
        {
          role: 'user',
          content: text
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      max_tokens: 100,
      response_format: { type: 'json_object' }
    });

    const responseText = completion.choices[0]?.message?.content;
    const parsed = JSON.parse(responseText);

    res.json({
      productName: parsed.productName || null,
      quantity: parsed.quantity || 1,
      confidence: 'high'
    });
  } catch (error) {
    console.error('AI Parse Error:', error);
    res.status(500).json({ 
      error: 'Failed to parse with AI',
      details: error.message,
      fallback: true
    });
  }
});

module.exports = router;
