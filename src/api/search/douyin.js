
const axios = require("axios");

module.exports = function (app) {

    app.get("/api/akinator/answer", async (req, res) => {
        try {

            const {
                answer,
                step,
                progression,
                cookies
            } = req.query;

            if (answer === undefined || !cookies) {
                return res.json({
                    status: false,
                    error: "حط answer و cookies"
                });
            }

            const body = new URLSearchParams({
                step,
                progression,
                sid: "1",
                cm: "false",
                answer
            });

            const response = await axios.post(
                "https://ar.akinator.com/answer",
                body,
                {
                    headers: {
                        "User-Agent": "Mozilla/5.0",
                        "Content-Type": "application/x-www-form-urlencoded",
                        "Origin": "https://ar.akinator.com",
                        "Referer": "https://ar.akinator.com/",
                        "Cookie": cookies
                    }
                }
            );

            const html = response.data;

            // ❓ السؤال الجديد (زي start)
            const question = html.match(/id="question-label">(.+?)</)?.[1];

            // 📊 step
            const newStep = html.match(/name="step" value="(.+?)"/)?.[1];

            // 📈 progression
            const newProg = html.match(/name="progression" value="(.+?)"/)?.[1];

            // 🎯 لو خمّن (ممكن يظهر في HTML)
            const name = html.match(/class="proposal-title">(.+?)</)?.[1];
            const desc = html.match(/class="proposal-description">(.+?)</)?.[1];
            const image = html.match(/class="proposal-picture".+?src="(.+?)"/)?.[1];

            if (name) {
                return res.json({
                    status: true,
                    guess: true,
                    result: {
                        name,
                        description: desc,
                        image
                    }
                });
            }

            if (!question) {
                return res.json({
                    status: false,
                    error: "فشل استخراج السؤال",
                    debug: html.slice(0, 500)
                });
            }

            res.json({
                status: true,
                guess: false,
                result: {
                    question,
                    step: newStep,
                    progression: newProg,
                    cookies
                }
            });

        } catch (err) {
            res.json({
                status: false,
                error: err.message
            });
        }
    });

};
