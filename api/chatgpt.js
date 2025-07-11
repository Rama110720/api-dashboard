// api/chat.js

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message, messages = [], model = 'gpt-3.5-turbo' } = req.body;

    if (!message && !messages.length) {
      return res.status(400).json({ error: 'Message required' });
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: messages.length > 0 ? messages : [{ role: 'user', content: message }],
        max_tokens: 1000,
        temperature: 0.7
      })
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'API error');
    }

    res.status(200).json({
      success: true,
      message: data.choices[0].message.content,
      usage: data.usage
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
}
