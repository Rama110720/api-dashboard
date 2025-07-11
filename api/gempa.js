export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Content-Type', 'application/json')

  if (req.method === 'OPTIONS') return res.status(200).end()

  try {
    const response = await fetch('https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json')
    if (!response.ok) throw new Error('Gagal fetch data dari BMKG')

    const json = await response.json()
    const gempa = json.Infogempa.gempa

    const result = {
      status: 'success',
      data: {
        waktu: gempa.Tanggal + ' ' + gempa.Jam,
        lintang: gempa.Lintang,
        bujur: gempa.Bujur,
        magnitudo: gempa.Magnitude,
        kedalaman: gempa.Kedalaman,
        lokasi: gempa.Wilayah,
        dirasakan: gempa.Dirasakan || '-',
        potensi: gempa.Potensi || '-',
      },
      source: 'https://data.bmkg.go.id/DataMKG/TEWS/autogempa.json',
      timestamp: new Date().toISOString()
    }

    return res.status(200).json(result)
  } catch (error) {
    return res.status(500).json({
      status: 'error',
      message: 'Gagal mengambil data gempa',
      error: error.message,
      timestamp: new Date().toISOString()
    })
  }
}
