// File: /api/api-manager.js
const BIN_ID = '6870ecb7afef824ba9f96212'
const API_KEY = '$2a$10$EZ2tIVheZv7sZYJDFBtf8eQE7G0v2xDxJfO7XNgJ.gl52IQryNEhm'
const BIN_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`
const allowedApiKey = 'RamzxProject123'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
  res.setHeader('X-Content-Type-Options', 'nosniff')

  if (req.method === 'OPTIONS') return res.status(200).end()

  const headers = {
    'Content-Type': 'application/json',
    'X-Master-Key': API_KEY
  }

  try {
    // Ambil data dari JSONBin
    const getData = async () => {
      const res = await fetch(BIN_URL, { headers })
      const json = await res.json()
      return json.record || []
    }

    // Simpan data baru ke JSONBin
    const updateData = async (data) => {
      await fetch(BIN_URL, {
        method: 'PUT',
        headers,
        body: JSON.stringify(data)
      })
    }

    if (req.method === 'GET') {
      const data = await getData()
      return res.status(200).json({ status: 'success', data })
    }

    if (!authenticate(req, res)) return

    if (req.method === 'POST') {
      const { name, description, endpoint, category, status: apiStatus } = req.body
      if (!name || !description || !endpoint || !category || !apiStatus)
        return res.status(400).json({ error: 'Missing fields' })

      const data = await getData()
      let newId = name.toLowerCase().replace(/\s+/g, '-')
      if (data.find(d => d.id === newId)) newId += '-' + Date.now()

      const newApi = {
        id: newId,
        name,
        description,
        endpoint,
        category,
        status: apiStatus,
        created_at: new Date().toISOString()
      }

      data.push(newApi)
      await updateData(data)

      return res.status(201).json({ status: 'success', message: 'API added.', api: newApi })
    }

    if (req.method === 'PUT') {
      const id = req.query.id
      if (!id) return res.status(400).json({ error: 'Missing ID' })

      const data = await getData()
      const index = data.findIndex(d => d.id === id)
      if (index === -1) return res.status(404).json({ error: 'API not found' })

      Object.keys(req.body).forEach(key => {
        if (key !== 'id') data[index][key] = req.body[key]
      })

      data[index].updated_at = new Date().toISOString()
      await updateData(data)

      return res.status(200).json({ status: 'success', updated_api: data[index] })
    }

    if (req.method === 'DELETE') {
      const id = req.query.id
      if (!id) return res.status(400).json({ error: 'Missing ID' })

      const data = await getData()
      const filtered = data.filter(d => d.id !== id)
      if (filtered.length === data.length) return res.status(404).json({ error: 'API not found' })

      await updateData(filtered)

      return res.status(200).json({ status: 'success', message: `API '${id}' deleted.` })
    }

    return res.status(405).json({ error: 'Method Not Allowed' })
  } catch (e) {
    return res.status(500).json({ error: 'Server Error', detail: e.message })
  }

  function authenticate(req, res) {
    const apiKey = req.headers['x-api-key'] || ''
    if (apiKey !== allowedApiKey) {
      res.status(401).json({ status: 'error', message: 'Unauthorized: Invalid API Key' })
      return false
    }
    return true
  }
}
