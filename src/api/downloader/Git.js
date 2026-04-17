const axios = require("axios");

module.exports = function (app) {

    async function downloadSpotify(url) {
        try {
            const { data } = await axios.post(
                "https://spotmate.online/convert",
                {
                    urls: url
                },
                {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Linux; Android 15; 2409BRN2CY Build/AP3A.240905.015.A2) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/146.0.7680.177 Mobile Safari/537.36',
                        'Accept-Encoding': 'gzip, deflate, br, zstd',
                        'Content-Type': 'application/json',
                        'sec-ch-ua-platform': '"Android"',
                        'sec-ch-ua': '"Chromium";v="146", "Not-A.Brand";v="24", "Android WebView";v="146"',
                        'sec-ch-ua-mobile': '?1',
                        'origin': 'https://spotmate.online',
                        'x-requested-with': 'mark.via.gp',
                        'sec-fetch-site': 'same-origin',
                        'sec-fetch-mode': 'cors',
                        'sec-fetch-dest': 'empty',
                        'referer': 'https://spotmate.online/en1',
                        'accept-language': 'en-GB,en-US;q=0.9,en;q=0.8',
                        'priority': 'u=1, i',

                        // 🍪 Cookies (مهم جداً)
                        'Cookie': 'XSRF-TOKEN=eyJpdiI6IkJHNERBOElLWWJPcUFhM2w0T2pHRGc9PSIsInZhbHVlIjoiY2FqWG56UW1aUzRuS2lMZHE5NGJuZHMyckNsbDFuYldCM3BCZ0VmK3V5YjVYY1RFTXVMNktWOHM1THhSQUhHMWNFMlpOTVNmdHdBOGZGSTJiQzZ4dHVJV0dVTFc3ZjQ1NFdIYlJDVklLRnVMaEk4QTV4anpBSXRKbW9QQjltcU8iLCJtYWMiOiI2YWMzZDM3ZjFkMTUyNzRkNGVmYTFkOGM1N2NmY2JhMmYwNWNjZjFkYmE2ODAxNWY3YTE2OTM5OWUxN2M5YjFjIiwidGFnIjoiIn0%3D; spotmateonline_session=eyJpdiI6Iml6NmhaTE16L3VaTS9qYkRuemowcmc9PSIsInZhbHVlIjoiWGlVamJYbGtreEVURlJ6b3RrYnFjaDhoeVROVStZdDJNWlRLa3JpZWYzTS9PRU9GUDJBL29xYmlSSDA4ejNqRE13NGRkc2ZVREU1WHRUY0tQSmd5MmdLVzRBMlJKRXVDUklUN2wvSFRUa1hzcVFDOFVWQ1Q3S1pyTnFDS3ptRUQiLCJtYWMiOiIwNzU2ZjExZTg2NjNlOGM4ZGE5YzdlOTgxNDdhZWQ5MjJmMjIxNmVkMGMzY2E4ZTYwZDhiMGI3ZGMxOTc2NTcyIiwidGFnIjoiIn0%3D'
                    },
                    timeout: 30000
                }
            );

            return data;

        } catch (e) {
            console.error("Spotify Download Error:", e.message);
            return null;
        }
    }

    // 🔥 REST API
    app.all("/api/s/spotify/download", async (req, res) => {

        const url = req.query.url || req.body.url;

        if (!url) {
            return res.status(400).json({
                status: false,
                message: "📌 حط رابط Spotify"
            });
        }

        if (!url.includes("open.spotify.com/track")) {
            return res.status(400).json({
                status: false,
                message: "❌ لازم Track URL صحيح"
            });
        }

        try {
            const result = await downloadSpotify(url);

            if (!result) {
                return res.status(500).json({
                    status: false,
                    message: "❌ فشل التحميل"
                });
            }

            // 🔥 نرجّع اللينك المباشر لو موجود
            return res.json({
                status: true,
                error: false,
                url,
                download: result.url || null,
                raw: result,
                message: "✅ تم جلب رابط التحميل المباشر"
            });

        } catch (err) {
            return res.status(500).json({
                status: false,
                message: "⚠️ Server Error",
                error: err.message
            });
        }
    });

};
