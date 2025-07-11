// File: /api/brat.js (untuk Vercel Serverless API)
import https from 'https'
import http from 'http'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET')

  const { text = '', theme = 'white' } = req.query

  if (!text) {
    return sendErrorImage(res, "Parameter 'text' tidak boleh kosong. Contoh: /api/brat?text=NamaSaya")
  }

  const externalUrl = `https://api.fasturl.link/maker/brat/simple?text=${encodeURIComponent(text)}&theme=${encodeURIComponent(theme)}`

  try {
    const imageBuffer = await fetchImage(externalUrl)
    const mimeType = getMimeType(imageBuffer)

    if (!mimeType.startsWith('image/')) {
      return sendErrorImage(res, `fasturl.link tidak mengembalikan gambar. MIME Type: '${mimeType}'.`)
    }

    res.setHeader('Content-Type', mimeType)
    res.status(200).send(imageBuffer)
  } catch (err) {
    return sendErrorImage(res, `Gagal mengambil gambar dari fasturl.link. Error: ${err.message}`)
  }
}

function getMimeType(buffer) {
  const header = buffer.toString('hex', 0, 4)
  switch (header) {
    case '89504e47': return 'image/png'
    case 'ffd8ffe0':
    case 'ffd8ffe1':
    case 'ffd8ffe2': return 'image/jpeg'
    default: return 'application/octet-stream'
  }
}

function fetchImage(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (response) => {
      const chunks = []

      if (response.statusCode !== 200) {
        return reject(new Error(`Kode HTTP: ${response.statusCode}`))
      }

      response.on('data', chunk => chunks.push(chunk))
      response.on('end', () => resolve(Buffer.concat(chunks)))
    }).on('error', reject)
  })
}

function sendErrorImage(res, message) {
  const { createCanvas } = require('canvas')
  const canvas = createCanvas(600, 300)
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#DC143C'
  ctx.fillRect(0, 0, 600, 300)
  ctx.fillStyle = '#FFFFFF'
  ctx.font = '20px sans-serif'
  ctx.fillText('ERROR:', 20, 50)
  ctx.fillText(message, 20, 90)
  res.setHeader('Content-Type', 'image/png')
  canvas.createPNGStream().pipe(res)
}
