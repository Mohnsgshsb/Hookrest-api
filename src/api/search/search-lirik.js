const axios = require("axios");

module.exports = function (app) {

    app.get("/api/akinator/start", async (req, res) => {
        try {

            const response = await axios.post(
                "https://ar.akinator.com/game",
                new URLSearchParams({
                    sid: "1",
                    cm: "false"
                }),
                {
                    headers: {
                        "User-Agent": "Mozilla/5.0 (Linux; Android 13; Mobile)",
                        "Accept": "text/html,application/xhtml+xml",
                        "Accept-Language": "en-US,en;q=0.9",
                        "Origin": "https://ar.akinator.com",
                        "Referer": "https://ar.akinator.com/"
                    }
                }
            );

            // 🍪 استخراج الكوكيز
            const cookies = response.headers["set-cookie"]
                ?.map(c => c.split(";")[0])
                .join("; ");

            // ❓ استخراج السؤال
            const question = response.data.match(/id="question-label">(.+?)</)?.[1];

            if (!question) {
                return res.json({
                    status: false,
                    creator: "TERBO-SPAM",
                    error: "فشل استخراج السؤال"
                });
            }

            res.json({
                status: true,
                creator: "TERBO-SPAM",
                result: {
                    question,
                    step: "0",
                    progression: "0",
                    cookies
                }
            });

        } catch (err) {
            res.json({
                status: false,
                creator: "TERBO-SPAM",
                error: err.response?.status + " | " + err.response?.data || err.message
            });
        }
    });

};
