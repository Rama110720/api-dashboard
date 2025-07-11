// File: /api/meme.js (untuk Vercel Serverless API)
import https from 'https'
import http from 'http'

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  if (req.method === 'OPTIONS') return res.status(200).end()

  const { template = '', top = '', bottom = '' } = req.query

  const username = 'Rama11'
  const password = 'RAMA110720'

  if (!template) return sendErrorImage(res, "Parameter 'template' tidak boleh kosong")

  try {
    const memeList = await fetchJson('https://api.imgflip.com/get_memes')
    if (!memeList.success) throw new Error(memeList.error_message || 'Gagal mengambil daftar meme')

    const selected = memeList.data.memes.find(m =>
      m.name.toLowerCase().replace(/\s/g, '') === template.toLowerCase().replace(/\s/g, '')
    )

    if (!selected) {
      return res.status(404).json({
        success: false,
        message: `Template meme '${template}' tidak ditemukan`
      })
    }

    const params = new URLSearchParams({
      template_id: selected.id,
      username,
      password,
      'boxes[0][text]': top,
      'boxes[0][color]': '#ffffff',
      'boxes[0][outline_color]': '#000000',
      'boxes[1][text]': bottom,
      'boxes[1][color]': '#ffffff',
      'boxes[1][outline_color]': '#000000',
    })

    const captionRes = await fetchJson('https://api.imgflip.com/caption_image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })

    if (!captionRes.success) {
      throw new Error(captionRes.error_message || 'Gagal membuat meme')
    }

    const imageBuffer = await fetchBuffer(captionRes.data.url)
    res.setHeader('Content-Type', 'image/jpeg')
    return res.status(200).send(imageBuffer)
  } catch (err) {
    return sendErrorImage(res, err.message)
  }
}

function fetchJson(url, options = {}) {
  return fetch(url, options).then(res => res.json())
}

function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    const mod = url.startsWith('https') ? https : http
    mod.get(url, res => {
      if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`))
      const data = []
      res.on('data', chunk => data.push(chunk))
      res.on('end', () => resolve(Buffer.concat(data)))
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
