const axios = require("axios");

module.exports = function (app) {

    const BASE = "https://gamepvz.com";

    async function download(url) {
        try {
            const { data } = await axios.post(
                `${BASE}/api/download/get-url`,
                {
                    url
                },
                {
                    headers: {
                        "User-Agent":
                            "Mozilla/5.0 (Linux; Android 15) Chrome/146",
                        "sec-ch-ua-platform": '"Android"',
                        "sec-ch-ua": '"Chromium";v="146", "Not-A.Brand";v="24", "Android WebView";v="146"',
                        "sec-ch-ua-mobile": "?1",
                        "origin": BASE,
                        "x-requested-with": "mark.via.gp",
                        "referer": `${BASE}/ar`,
                        "accept-language": "en-GB,en-US;q=0.9,en;q=0.8"
                    },
                    timeout: 30000
                }
            );

            return data;

        } catch (e) {
            console.error("PVZ API Error:", e.message);
            return null;
        }
    }

    // 🔥 REST API
    app.all("/api/s/spotify/pvz", async (req, res) => {

        const url = req.query.url || req.body.url;

        if (!url) {
            return res.json({
                status: false,
                message: "send spotify url"
            });
        }

        if (!url.includes("open.spotify.com/track")) {
            return res.json({
                status: false,
                message: "invalid spotify url"
            });
        }

        try {
            const result = await download(url);

            if (!result || result.code !== 200) {
                return res.json({
                    status: false,
                    message: "failed to fetch data"
                });
            }

            // 🔥 بناء لينك تحميل مباشر
            const downloadUrl = `${BASE}${result.originalVideoUrl}`;

            return res.json({
                status: true,
                title: result.title,
                author: result.authorName,
                cover: result.coverUrl,
                url: downloadUrl
            });

        } catch (e) {
            return res.status(500).json({
                status: false,
                error: e.message
            });
        }
    });

};
