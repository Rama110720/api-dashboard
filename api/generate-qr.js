// qr-generator.js
// Ini adalah contoh kode backend (Node.js) untuk API QR Code Generator tanpa Express.js.
// Anda perlu menginstal Node.js dan paket 'qrcode' terlebih dahulu.
// Instalasi: npm install qrcode

const http = require('http'); // Mengimpor modul HTTP bawaan Node.js
const url = require('url');   // Mengimpor modul URL untuk parsing URL
const qrcode = require('qrcode'); // Mengimpor pustaka qrcode

const port = process.env.PORT || 3000; // Port untuk menjalankan server API Anda

// Membuat server HTTP
const server = http.createServer(async (req, res) => {
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
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query; // Objek query parameters

    // Rute untuk menghasilkan QR Code
    if (pathname === '/generate-qr' && req.method === 'GET') {
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
    }
    // Rute dasar untuk memeriksa apakah API berjalan
    else if (pathname === '/' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'success',
            message: 'QR Code Generator API is running. Use /generate-qr?text=YOUR_TEXT to generate a QR code.'
        }));
    }
    // Rute tidak ditemukan
    else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'error',
            message: 'Endpoint tidak ditemukan.'
        }));
    }
});
