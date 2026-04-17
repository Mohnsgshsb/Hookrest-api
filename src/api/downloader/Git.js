const axios = require("axios");

module.exports = function (app) {

    const BASE = "https://spotmate.online";

    // 🍪 جلب كوكيز جديدة
    async function getCookies() {
        try {
            const res = await axios.get(`${BASE}/en1`, {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/146"
                },
                timeout: 15000
            });

            const cookies = res.headers["set-cookie"];
            if (!cookies) return "";

            return cookies.map(c => c.split(";")[0]).join("; ");
        } catch {
            return "";
        }
    }

    // 🎧 جلب معلومات التراك
    async function getTrackData(url, cookie) {
        const { data } = await axios.post(
            `${BASE}/getTrackData`,
            { spotify_url: url },
            {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Linux; Android 15) Chrome/146",
                    "Content-Type": "application/json",
                    "origin": BASE,
                    "referer": `${BASE}/en1`,
                    "x-requested-with": "mark.via.gp",
                    "Cookie": cookie
                },
                timeout: 30000
            }
        );

        return data;
    }

    // 🔥 تحويل لتحميل mp3
    async function convertTrack(url, cookie) {
        const { data } = await axios.post(
            `${BASE}/convert`,
            { urls: url },
            {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Linux; Android 15) Chrome/146",
                    "Content-Type": "application/json",
                    "origin": BASE,
                    "referer": `${BASE}/en1`,
                    "x-requested-with": "mark.via.gp",
                    "Cookie": cookie
                },
                timeout: 30000
            }
        );

        return data;
    }

    // 🚀 API
    app.all("/api/s/spotify/full", async (req, res) => {

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
                message: "invalid spotify track url"
            });
        }

        try {
            const cookie = await getCookies();

            // 1️⃣ track info
            const info = await getTrackData(url, cookie);

            // 2️⃣ download link
            const download = await convertTrack(url, cookie);

            return res.json({
                status: true,
                info,
                download_url: download?.url || null
            });

        } catch (e) {
            return res.status(500).json({
                status: false,
                error: e.message
            });
        }
    });

};
