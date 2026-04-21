const axios = require("axios");
const cheerio = require("cheerio");

module.exports = function (app) {

    const userAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6)",
        "Mozilla/5.0 (Linux; Android 10)"
    ];

    function getRandomAgent() {
        return userAgents[Math.floor(Math.random() * userAgents.length)];
    }

    // 🔥 start session
    async function startGame() {
        const { data, headers } = await axios.post(
            "https://ar.akinator.com/game",
            new URLSearchParams({
                sid: "1",
                cm: "false"
            }),
            {
                headers: {
                    "User-Agent": getRandomAgent(),
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Accept": "text/html",
                    "origin": "https://ar.akinator.com",
                    "referer": "https://ar.akinator.com/theme-selection"
                }
            }
        );

        const $ = cheerio.load(data);

        const question = $("#question-label").text().trim();
        const step = $("#step-info").text().trim();

        const cookies = headers["set-cookie"];

        if (!question) {
            throw new Error("فشل استخراج السؤال");
        }

        return {
            question,
            step,
            cookies
        };
    }

    // 🔥 API البداية
    app.get("/api/akinator/start", async (req, res) => {
        try {
            const game = await startGame();

            res.json({
                status: true,
                result: game
            });

        } catch (err) {
            res.status(500).json({
                status: false,
                error: err.message
            });
        }
    });

};
