// File: /api/random-joke.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  const sendResponse = (data, status = 200) => {
    res.status(status).json(data)
  }

  const apiUrl = 'https://official-joke-api.appspot.com/random_joke'

  try {
    const apiRes = await fetch(apiUrl)
    if (!apiRes.ok) {
      return sendResponse({
        status: 'error',
        message: 'Gagal mengambil joke dari server publik.',
        source: apiUrl
      }, 502)
    }

    const joke = await apiRes.json()
    return sendResponse({
      status: 'success',
      joke: {
        question: joke.setup || '',
        answer: joke.punchline || ''
      },
      source: 'official-joke-api',
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    return sendResponse({
      status: 'error',
      message: 'Terjadi kesalahan internal.',
      error_code: 'INTERNAL_ERROR',
      timestamp: new Date().toISOString()
    }, 500)
  }
}
