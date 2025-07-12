// api/generate-qr.js atau api/index.js
// Ini adalah versi API QR Code Generator yang disesuaikan untuk Vercel.
// Vercel mengharapkan fungsi 'handler' yang diekspor.

const url = require('url');
const qrcode = require('qrcode');

// Fungsi utama yang akan diekspor sebagai handler untuk Vercel
// req: objek permintaan HTTP
// res: objek respons HTTP
module.exports = async (req, res) => {
    // Mengatur header CORS untuk mengizinkan akses dari semua origin
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    // Menangani permintaan OPTIONS (preflight request untuk CORS)
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    // Parsing URL permintaan
    const parsedUrl = url.parse(req.url, true); // true untuk parse query string
    const query = parsedUrl.query; // Objek query parameters

    // Pastikan ini hanya menangani permintaan GET ke endpoint ini
    if (req.method === 'GET') {
        const text = query.text; // Ambil teks dari parameter query 'text'

        if (!text) {
            // Jika parameter 'text' tidak ada atau kosong
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'error',
                message: 'Parameter "text" diperlukan untuk menghasilkan QR Code.'
            }));
            return;
        }

        try {
            // Hasilkan QR Code sebagai data URL (base64 encoded PNG)
            const qrCodeDataUrl = await qrcode.toDataURL(text, {
                errorCorrectionLevel: 'H', // Level koreksi kesalahan (L, M, Q, H)
                width: 250, // Ukuran QR Code dalam piksel
                color: {
                    dark: '#1a237e', // Warna gelap (dari warna primer Anda)
                    light: '#ffffff' // Warna terang
                }
            });

            // Konversi data URL menjadi buffer gambar
            const base64Image = qrCodeDataUrl.split(';base64,').pop();
            const imageBuffer = Buffer.from(base64Image, 'base64');

            // Set header response untuk mengirim gambar PNG
            res.writeHead(200, {
                'Content-Type': 'image/png',
                'Content-Length': imageBuffer.length
            });
            // Kirim gambar sebagai respons
            res.end(imageBuffer);

        } catch (error) {
            console.error('Error generating QR Code:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'error',
                message: 'Gagal menghasilkan QR Code.',
                detail: error.message
            }));
        }
    } else {
        // Metode HTTP tidak diizinkan
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'error',
            message: 'Metode tidak diizinkan. Hanya GET dan OPTIONS yang didukung.'
        }));
    }
};
