// api/quote-of-the-day.js
// API yang mengembalikan kutipan inspiratif atau terkenal yang berbeda setiap hari.
// Mengambil kutipan secara real-time dari Forismatic API.

const axios = require('axios'); // Mengimpor pustaka axios

module.exports = async (req, res) => {
    // Mengatur header CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');

    // Menangani permintaan OPTIONS (preflight request untuk CORS)
    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.method === 'GET') {
        try {
            // Melakukan permintaan ke Forismatic API untuk mendapatkan kutipan acak
            // Menggunakan lang=en untuk bahasa Inggris, bisa diganti ke 'ru' untuk Rusia
            const response = await axios.get('http://api.forismatic.com/api/1.0/?method=getQuote&format=json&lang=en');
            const quoteData = response.data;

            if (quoteData && quoteData.quoteText) {
                const quote = quoteData.quoteText.trim();
                const author = quoteData.quoteAuthor ? quoteData.quoteAuthor.trim() : "Unknown";

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'success',
                    quote: quote,
                    author: author,
                    source: 'Forismatic API'
                }));
            } else {
                // Jika respons dari Forismatic tidak sesuai harapan
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'error',
                    message: 'Gagal mengambil kutipan dari Forismatic API. Respons tidak valid.',
                    detail: quoteData // Sertakan data yang diterima untuk debugging
                }));
            }
        } catch (error) {
            console.error('Error fetching quote from Forismatic API:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'error',
                message: 'Gagal mengambil kutipan dari API eksternal.',
                detail: error.message
            }));
        }
    } else {
        res.writeHead(405, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'error',
            message: 'Metode tidak diizinkan. Hanya GET dan OPTIONS yang didukung.'
        }));
    }
};
