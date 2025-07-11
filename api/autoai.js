export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { text } = req.query
  const OPENAI_API_KEY = process.env.OPENAI_API_KEY

  if (!text) {
    return res.status(400).json({
      status: 'error',
      message: "/api/autoai?text=Siapa Presiden Ke 4 Indonesia"
    })
  }

  try {
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: text }],
        temperature: 0.7
      })
    })

    const data = await openaiResponse.json()

    if (data.error) {
      return res.status(500).json({ status: 'error', message: data.error.message })
    }

    const answer = data.choices?.[0]?.message?.content || "Tidak ada respons."

    return res.status(200).json({
      status: 'success',
      question: text,
      answer,
      model: 'gpt-3.5-turbo',
      timestamp: new Date().toISOString()
    })
  } catch (err) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal menghubungi OpenAI API.',
      error: err.message
    })
  }
}
