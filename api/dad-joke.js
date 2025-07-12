// api/dad-joke.js
// API yang mengembalikan lelucon "bapak-bapak" (pun jokes) acak secara real-time.
// Mengambil lelucon dari icanhazdadjoke.com.

const https = require('https'); // Menggunakan https karena icanhazdadjoke.com menggunakan HTTPS

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
            const options = {
                hostname: 'icanhazdadjoke.com',
                path: '/',
                method: 'GET',
                headers: {
                    'Accept': 'application/json', // Meminta respons dalam format JSON
                    'User-Agent': 'API Dashboard (https://www.byapi.my.id)' // Penting untuk beberapa API publik
                }
            };

            // Melakukan permintaan HTTPS GET ke icanhazdadjoke.com
            const jokeData = await new Promise((resolve, reject) => {
                const apiReq = https.request(options, (apiRes) => {
                    let data = '';

                    // Mengumpulkan data dari stream respons
                    apiRes.on('data', (chunk) => {
                        data += chunk;
                    });

                    // Ketika respons selesai
                    apiRes.on('end', () => {
                        if (apiRes.statusCode >= 200 && apiRes.statusCode < 300) {
                            try {
                                resolve(JSON.parse(data));
                            } catch (e) {
                                reject(new Error('Gagal mengurai respons JSON dari icanhazdadjoke.com: ' + e.message));
                            }
                        } else {
                            reject(new Error(`icanhazdadjoke.com merespons dengan status ${apiRes.statusCode}: ${data}`));
                        }
                    });
                });

                apiReq.on('error', (e) => {
                    reject(new Error('Gagal terhubung ke icanhazdadjoke.com: ' + e.message));
                });

                apiReq.end(); // Akhiri permintaan
            });

            if (jokeData && jokeData.joke) {
                const joke = jokeData.joke.trim();

                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'success',
                    joke: joke,
                    source: 'icanhazdadjoke.com'
                }));
            } else {
                // Jika respons dari icanhazdadjoke.com tidak sesuai harapan
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                    status: 'error',
                    message: 'Gagal mengambil lelucon dari icanhazdadjoke.com. Respons tidak valid.',
                    detail: jokeData // Sertakan data yang diterima untuk debugging
                }));
            }
        } catch (error) {
            console.error('Error fetching joke from icanhazdadjoke.com:', error);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
                status: 'error',
                message: 'Gagal mengambil lelucon dari API eksternal.',
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
