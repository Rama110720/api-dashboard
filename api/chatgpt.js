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
      model = req.query.model || 'meta-llama/llama-4-scout:free';
      max_tokens = parseInt(req.query.max_tokens) || 1000;
      temperature = parseFloat(req.query.temperature) || 0.7;
    }
    // Support POST dengan body
    else if (req.method === 'POST') {
      const body = req.body || {};
      message = body.message || body.text;
      model = body.model || 'meta-llama/llama-4-scout:free';
      max_tokens = body.max_tokens || 1000;
      temperature = body.temperature || 0.7;
    }
    else {
      return res.status(405).json({ 
        success: false,
        error: 'Method not allowed',
        message: 'Only GET and POST methods are supported'
      });
    }

    // Validation
    if (!message) {
      return res.status(400).json({ 
        success: false,
        error: 'Missing required parameter',
        message: 'Parameter text/message is required'
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ 
        success: false,
        error: 'Configuration error',
        message: 'API key not configured'
      });
    }

    // Debug logs
    console.log('Model yang digunakan:', model);
    console.log('Message:', message);
    console.log('API Key exists:', !!process.env.OPENAI_API_KEY);

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

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);

    if (!response.ok) {
      throw new Error(data.error?.message || 'OpenRouter API error');
    }

    // Return response dengan format JSON yang rapi
    return res.status(200).json({
      success: true,
      data: {
        message: data.choices[0].message.content,
        model: model,
        usage: data.usage || null,
        metadata: {
          tokens_used: data.usage?.total_tokens || null,
          completion_tokens: data.usage?.completion_tokens || null,
          prompt_tokens: data.usage?.prompt_tokens || null
        }
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Full error:', error);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);

    // Return error response dengan format yang konsisten
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: error.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? {
        stack: error.stack,
        timestamp: new Date().toISOString()
      } : undefined,
      timestamp: new Date().toISOString()
    });
  }
}
