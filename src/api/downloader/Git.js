const axios = require("axios");

module.exports = function (app) {

    // 🍪 جلب كوكيز جديدة كل مرة
    async function getFreshCookies() {
        try {
            const res = await axios.get("https://spotmate.online/en1", {
                headers: {
                    "User-Agent":
                        "Mozilla/5.0 (Linux; Android 15; Mobile) AppleWebKit/537.36 Chrome/146",
                },
                timeout: 15000
            });

            const cookies = res.headers["set-cookie"];
            if (!cookies) return "";

            return cookies.map(c => c.split(";")[0]).join("; ");
        } catch (e) {
            return "";
        }
    }

    // 🔥 التحميل
    async function downloadSpotify(url) {
        try {
            const cookie = await getFreshCookies();

            const { data } = await axios.post(
                "https://spotmate.online/convert",
                {
                    urls: url
                },
                {
                    headers: {
                        "User-Agent":
                            "Mozilla/5.0 (Linux; Android 15) AppleWebKit/537.36 Chrome/146",
                        "Content-Type": "application/json",
                        "origin": "https://spotmate.online",
                        "referer": "https://spotmate.online/en1",
                        "x-requested-with": "mark.via.gp",

                        // 🍪 dynamic cookie
                        "Cookie": cookie
                    },
                    timeout: 30000
                }
            );

            return data;

        } catch (e) {
            console.error("Download error:", e.message);
            return null;
        }
    }

    // 🔥 REST API
    app.all("/api/s/spotify/download", async (req, res) => {

        const url = req.query.url || req.body.url;

        if (!url) {
            return res.json({
                status: false,
                message: "send url"
            });
        }

        try {
            const result = await downloadSpotify(url);

            if (!result || !result.url) {
                return res.json({
                    status: false,
                    message: "❌ فشل التحميل (Blocked or invalid session)"
                });
            }

            return res.json({
                status: true,
                download: result.url,
                raw: result
            });

        } catch (err) {
            return res.status(500).json({
                status: false,
                error: err.message
            });
        }
    });

};
