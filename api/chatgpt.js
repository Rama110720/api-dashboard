// api/chat.js

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let message, model, max_tokens, temperature;

    // Support GET dengan query params
    if (req.method === 'GET') {
      message = req.query.text || req.query.message || req.query.q;
      model = req.query.model || 'meta-llama/llama-3.1-8b-instruct:free';
      max_tokens = parseInt(req.query.max_tokens) || 1000;
      temperature = parseFloat(req.query.temperature) || 0.7;
    }
    // Support POST dengan body
    else if (req.method === 'POST') {
      const body = req.body || {};
      message = body.message || body.text;
      model = body.model || 'meta-llama/llama-3.1-8b-instruct:free';
      max_tokens = body.max_tokens || 1000;
      temperature = body.temperature || 0.7;
    }
    else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    if (!message) {
      return res.status(400).json({ error: 'Parameter text/message required' });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: 'API key not configured' });
    }

    // Request ke OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: message }],
        max_tokens,
        temperature
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'API error');
    }

    // Return cuma text balasan AI
    return res.status(200).send(data.choices[0].message.content);

  } catch (error) {
    console.error('Full error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    
    return res.status(500).json({
      error: error.message || 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
