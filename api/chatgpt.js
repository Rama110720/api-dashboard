// api/chat.js

export default async function handler(req, res) {
  // Enable CORS untuk akses dari domain lain
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

  // Handle preflight request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // GET request untuk info API
  if (req.method === 'GET') {
    return res.status(200).json({
      status: 'active',
      message: 'Chat AI API is running',
      version: '1.0.0',
      endpoints: {
        chat: 'POST /api/chat',
        models: 'GET /api/chat/models'
      },
      usage: {
        method: 'POST',
        body: {
          message: 'Your message here',
          model: 'gpt-3.5-turbo (optional)',
          max_tokens: '1000 (optional)',
          temperature: '0.7 (optional)'
        }
      }
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Ambil data dari body atau query parameter (untuk fleksibilitas)
    let { message, messages = [], model = 'gpt-3.5-turbo', max_tokens = 1000, temperature = 0.7 } = req.body || {};
    
    // Fallback ke query params jika body kosong
    if (!message && !messages.length) {
      message = req.query.message || req.query.q;
      model = req.query.model || model;
      max_tokens = parseInt(req.query.max_tokens) || max_tokens;
      temperature = parseFloat(req.query.temperature) || temperature;
    }

    // Validasi input
    if (!message && !messages.length) {
      return res.status(400).json({ 
        error: 'Message required',
        example: {
          message: 'Hello, how are you?',
          model: 'gpt-3.5-turbo'
        }
      });
    }

    // Cek API key
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Prepare messages
    let conversationMessages = [];
    if (messages.length > 0) {
      conversationMessages = messages;
    } else {
      conversationMessages = [{ role: 'user', content: message }];
    }

    // Log untuk monitoring (opsional)
    console.log(`[${new Date().toISOString()}] Chat request - Model: ${model}, Tokens: ${max_tokens}`);

    // Request ke OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: conversationMessages,
        max_tokens: Math.min(max_tokens, 4000), // Limit maksimal
        temperature: Math.max(0, Math.min(temperature, 2)) // Clamp 0-2
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || `OpenRouter API error: ${response.status}`);
    }

    // Response yang lengkap
    const result = {
      success: true,
      message: data.choices[0].message.content,
      model: data.model,
      usage: data.usage,
      timestamp: new Date().toISOString(),
      request_id: data.id || Math.random().toString(36).substr(2, 9)
    };

    // Log untuk monitoring
    console.log(`[${result.timestamp}] Response sent - Tokens used: ${data.usage?.total_tokens || 0}`);

    return res.status(200).json(result);

  } catch (error) {
    console.error('Chat API Error:', error);
    
    // Error response yang informatif
    return res.status(500).json({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString(),
      help: 'Check your request format and try again'
    });
  }
}

// Fungsi helper untuk rate limiting (opsional)
const rateLimitMap = new Map();

function checkRateLimit(identifier, maxRequests = 60, windowMs = 60000) {
  const now = Date.now();
  const windowStart = now - windowMs;
  
  if (!rateLimitMap.has(identifier)) {
    rateLimitMap.set(identifier, []);
  }
  
  const requests = rateLimitMap.get(identifier);
  
  // Bersihkan request yang sudah expired
  const validRequests = requests.filter(timestamp => timestamp > windowStart);
  
  if (validRequests.length >= maxRequests) {
    return false;
  }
  
  validRequests.push(now);
  rateLimitMap.set(identifier, validRequests);
  
  return true;
}
