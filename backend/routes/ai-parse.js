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

const needsTamilTranslation = (text = '') => /[\u0B80-\u0BFF]/.test(text);

const translateToEnglish = async (text, groq) => {
  const completion = await groq.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: `Translate the input to English. Preserve brand names, numbers, and units.
Return JSON: {"text":"..."}`
      },
      { role: 'user', content: text }
    ],
    model: 'llama-3.3-70b-versatile',
    temperature: 0,
    max_tokens: 120,
    response_format: { type: 'json_object' }
  });

  const responseText = completion.choices[0]?.message?.content;
  if (!responseText) return text;

  try {
    const parsed = JSON.parse(responseText);
    return parsed.text || text;
  } catch (error) {
    return text;
  }
};

const normalizeInputText = async (text, groq) => {
  if (!needsTamilTranslation(text)) return text;
  return translateToEnglish(text, groq);
};

/**
 * POST /api/ai-parse/product
 * Parse product information from natural speech using AI
 */
router.post('/product', async (req, res) => {
  try {
    const { text, availableProducts } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const groq = getGroqClient();
    const normalizedText = await normalizeInputText(text, groq);
    const productContext = (availableProducts || [])
      .map(product => {
        const synonyms = Array.isArray(product.synonyms) ? product.synonyms.join(', ') : '';
        return `name: ${product.name}; brand: ${product.brand || ''}; synonyms: ${synonyms}`;
      })
      .join('\n') || 'No products available';

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a product information parser for a billing system. Extract product details from natural speech.

Available products (canonical):
${productContext}

Rules:
- Extract canonical product NAME (capitalize properly)
- Extract PRICE in rupees (number only)
- Extract QUANTITY (if mentioned with units like kg, pieces, liters - use the number)
- "qty" and "quantity" always indicate quantity
- If user says "rice 5" with NO price keyword, treat 5 as QUANTITY
- If user says "rice 50 rupees" or "rice 50", treat 50 as PRICE
- If brand is mentioned, prefer the canonical product with the same brand name
- If both quantity and price are present, separate both correctly:
  - "soap 5 qty 100 rs" => name=Soap, quantity=5, price=100
  - "soap qty 5 100 rs" => name=Soap, quantity=5, price=100
  - "soap 5kg 100rs" => name=Soap, quantity=5, price=100
- Prefer matching to existing canonical products when the spoken name is close.
- Return ONLY valid JSON, no other text
- If price not mentioned, set price to null
- If quantity not mentioned, set quantity to null

Examples:
Input: "rice 10 50 rupees"
Output: {"name": "Rice", "price": 50, "quantity": 10}

Input: "sugar 80 rupees"
Output: {"name": "Sugar", "price": 80, "quantity": null}

Input: "sugar 80"
Output: {"name": "Sugar", "price": 80, "quantity": null}

Input: "rice 5"
Output: {"name": "Rice", "price": null, "quantity": 5}

Input: "amul butter 1 kg 55"
Output: {"name": "Amul Butter", "price": 55, "quantity": 1}

Input: "oil 3 pieces"
Output: {"name": "Oil", "price": null, "quantity": 3}

Input: "milk 10 packets 45 rupees"
Output: {"name": "Milk", "price": 45, "quantity": 10}

Now parse this:`
        },
        {
          role: 'user',
          content: normalizedText
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
      quantity: parsed.quantity !== null && !isNaN(parsed.quantity) ? parseFloat(parsed.quantity) : null,
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
    const normalizedText = await normalizeInputText(text, groq);

    const productContext = (availableProducts || [])
      .map(product => {
        const synonyms = Array.isArray(product.synonyms) ? product.synonyms.join(', ') : '';
        return `name: ${product.name}; brand: ${product.brand || ''}; synonyms: ${synonyms}`;
      })
      .join('\n') || 'No products available';

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a grocery billing speech parser for Indian shops.

Available products (canonical):
${productContext}

IMPORTANT RULES FOR QUANTITY:
- ALWAYS extract quantity from speech. Look for numbers ANYWHERE in the text.
- "2 rice" = quantity 2
- "rice 2" = quantity 2
- "add 3 milk" = quantity 3
- "milk 3 packets" = quantity 3
- "rice 2 kg" = quantity 2
- "5 sugar" = quantity 5
- Hindi numbers: ek=1, do=2, teen=3, char=4, panch=5, chhe=6, saat=7, aath=8, nau=9, das=10
- Tamil: onnu=1, rendu=2, moonu=3, naalu=4, anju=5
- If NO quantity mentioned at all, default to 1.

MATCHING RULES:
- Match spoken item to closest canonical product name.
- Consider brand and synonyms.
- If brand is mentioned, never substitute a different brand.
- Return product names EXACTLY as canonical names.

OUTPUT FORMAT (JSON only):
{
  "items": [
    { "productName": "exact canonical name", "quantity": number }
  ],
  "action": "add"
}

For remove/delete:
{
  "items": [{ "productName": "name", "quantity": 1 }],
  "action": "remove"
}

Examples:
"2 rice and 3 milk" → items: [{"productName":"Rice","quantity":2},{"productName":"Milk","quantity":3}]
"sugar do packet" → items: [{"productName":"Sugar","quantity":2}]
"add teen bread" → items: [{"productName":"Bread","quantity":3}]`
        },
        {
          role: 'user',
          content: normalizedText
        }
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.1,
      max_tokens: 150,
      response_format: { type: 'json_object' }
    });

    const responseText = completion.choices[0]?.message?.content;
    const parsed = JSON.parse(responseText);

    const items = Array.isArray(parsed.items)
      ? parsed.items
        .filter(item => item && item.productName)
        .map(item => ({
          productName: item.productName,
          quantity: Number(item.quantity) > 0 ? Number(item.quantity) : 1
        }))
      : [];

    res.json({
      items,
      action: parsed.action === 'remove' ? 'remove' : 'add',
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

/**
 * POST /api/ai-parse/update-price
 * Parse price update commands from natural speech
 * Examples: "update rice price to 50", "rice price 60", "change milk to 45 rupees"
 */
router.post('/update-price', async (req, res) => {
  try {
    const { text, availableProducts } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const groq = getGroqClient();
    const normalizedText = await normalizeInputText(text, groq);

    const productContext = (availableProducts || [])
      .map(product => {
        const synonyms = Array.isArray(product.synonyms) ? product.synonyms.join(', ') : '';
        return `id: ${product.id || ''}; name: ${product.name}; brand: ${product.brand || ''}; synonyms: ${synonyms}; current_price: ${product.price}`;
      })
      .join('\n') || 'No products available';

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a price update parser for an Indian shop billing system.

Available products:
${productContext}

Your job: Parse voice commands to UPDATE product prices.

VALID UPDATE PATTERNS:
- "update rice price to 50" → update Rice to 50
- "rice price 60" → update Rice to 60
- "change milk to 45 rupees" → update Milk to 45
- "set sugar price 80" → update Sugar to 80
- "bread 30" → update Bread to 30
- "amul butter price is now 55" → update Amul Butter to 55
- Hindi: "rice ka price 50" → update Rice to 50

RULES:
- Match product name to canonical names (consider brand, synonyms)
- Extract the NEW PRICE (always a number)
- Return EXACT canonical product name
- If no valid price update detected, return isUpdate: false

OUTPUT FORMAT (JSON):
{
  "isUpdate": true,
  "productName": "exact canonical name",
  "newPrice": number,
  "productId": "id if available"
}

If NOT an update command:
{
  "isUpdate": false
}`
        },
        {
          role: 'user',
          content: normalizedText
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
      isUpdate: parsed.isUpdate === true,
      productName: parsed.productName || null,
      newPrice: parsed.newPrice !== null && !isNaN(parsed.newPrice) ? parseFloat(parsed.newPrice) : null,
      productId: parsed.productId || null,
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

/**
 * POST /api/ai-parse/update-quantity
 * Parse quantity update commands from natural speech
 * Examples: "rice 5", "add 10 sugar", "milk 3 packets"
 */
router.post('/update-quantity', async (req, res) => {
  try {
    const { text, availableProducts } = req.body;

    if (!text || text.trim().length === 0) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const groq = getGroqClient();
    const normalizedText = await normalizeInputText(text, groq);

    const productContext = (availableProducts || [])
      .map(product => {
        const synonyms = Array.isArray(product.synonyms) ? product.synonyms.join(', ') : '';
        return `name: ${product.name}; brand: ${product.brand || ''}; synonyms: ${synonyms}; current_qty: ${product.quantity}`;
      })
      .join('\n') || 'No products available';

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: `You are a quantity update parser for an Indian shop billing system.

Available products:
${productContext}

Your job: Parse voice commands to UPDATE product quantities.

VALID UPDATE PATTERNS:
- "rice 5" → add 5 to Rice quantity
- "add 10 sugar" → add 10 to Sugar
- "milk 3 packets" → add 3 to Milk
- "onion 2 kg" → add 2 to Onion
- "bread 6 pieces" → add 6 to Bread

RULES:
- Match product name to canonical names (consider brand, synonyms)
- Extract the QUANTITY to ADD (always a number)
- Return EXACT canonical product name
- If no valid quantity detected, return isUpdate: false

OUTPUT FORMAT (JSON):
{
  "isUpdate": true,
  "productName": "exact canonical name",
  "quantityToAdd": number
}

If NOT a quantity update:
{
  "isUpdate": false
}`
        },
        {
          role: 'user',
          content: normalizedText
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
      isUpdate: parsed.isUpdate === true,
      productName: parsed.productName || null,
      quantityToAdd: parsed.quantityToAdd !== null && !isNaN(parsed.quantityToAdd) ? parseFloat(parsed.quantityToAdd) : null,
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
