const axios = require("axios");

module.exports = function (app) {

    const userAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        "Mozilla/5.0 (Linux; Android 10)",
        "Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)"
    ];

    function getRandomAgent() {
        return userAgents[Math.floor(Math.random() * userAgents.length)];
    }

    app.get("/api/akinator/answer", async (req, res) => {
        try {
            const {
                answer,
                step,
                progression,
                session,
                signature,
                cookies
            } = req.query;

            if (!answer || !session || !signature || !step || !progression) {
                return res.status(400).json({
                    status: false,
                    error: "ناقص بيانات"
                });
            }

            const { data } = await axios.post(
                "https://ar.akinator.com/answer",
                new URLSearchParams({
                    step,
                    progression,
                    sid: "1",
                    cm: "false",
                    answer,
                    session,
                    signature
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

            res.json({
                status: true,
                result: {
                    question: data.question,
                    step: data.step,
                    progression: data.progression,
                    answers: [
                        "نعم",
                        "لا",
                        "لا أعلم",
                        "غالبًا",
                        "غالبًا لا"
                    ]
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
