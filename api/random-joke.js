export default async function handler(req, res) {
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const response = await fetch('https://official-joke-api.appspot.com/random_joke')
    const joke = await response.json()

    if (!joke || !joke.setup || !joke.punchline) {
      return res.status(502).json({
        status: 'error',
        message: 'Gagal mengambil joke dari server publik.',
        source: 'official-joke-api'
      })
    }

    return res.status(200).json({
      status: 'success',
      joke: {
        question: joke.setup,
        answer: joke.punchline
      },
      source: 'official-joke-api',
      timestamp: new Date().toISOString()
    })
  } catch (e) {
    return res.status(500).json({
      status: 'error',
      message: 'Terjadi kesalahan internal.',
      error_code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    })
  }
}
