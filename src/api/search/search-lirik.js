const axios = require("axios");
const cheerio = require("cheerio");

module.exports = function (app) {

    const userAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Mozilla/5.0 (Linux; Android 10)",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)"
    ];

    function getRandomAgent() {
        return userAgents[Math.floor(Math.random() * userAgents.length)];
    }

    app.get("/api/akinator/start", async (req, res) => {
        try {

            // 🔥 1- نجيب صفحة اللعبة
            const first = await axios.post(
                "https://ar.akinator.com/game",
                new URLSearchParams({
                    sid: "1",
                    cm: "false"
                }),
                {
                    headers: {
                        "User-Agent": getRandomAgent(),
                        "Content-Type": "application/x-www-form-urlencoded",
                        "origin": "https://ar.akinator.com",
                        "referer": "https://ar.akinator.com/theme-selection"
                    }
                }
            );

            const cookies = first.headers["set-cookie"].join("; ");

            const $ = cheerio.load(first.data);
            const question = $("#question-label").text().trim();
            const step = $("#step-info").text().trim();

            // 🔥 2- نعمل أول answer وهمي (init)
            const second = await axios.post(
                "https://ar.akinator.com/answer",
                new URLSearchParams({
                    step: "0",
                    progression: "0",
                    sid: "1",
                    cm: "false",
                    answer: "2" // لا أعلم (safe)
                }),
                {
                    headers: {
                        "User-Agent": getRandomAgent(),
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                        "x-requested-with": "XMLHttpRequest",
                        "origin": "https://ar.akinator.com",
                        "referer": "https://ar.akinator.com/game",
                        "Cookie": cookies
                    }
                }
            );

            const data = second.data;

            res.json({
                status: true,
                result: {
                    question,
                    step: data.step,
                    progression: data.progression,
                    session: data.session,
                    signature: data.signature,
                    cookies
                }
            });

        } catch (err) {
            res.status(500).json({
                status: false,
                error: err.message
            });
        }
    });

};
