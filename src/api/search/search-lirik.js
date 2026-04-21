const axios = require("axios");

module.exports = function (app) {

    const akinator = {
        base: "https://ar.akinator.com",
        headers: {
            "user-agent": "Mozilla/5.0",
            "accept": "*/*",
            "x-requested-with": "XMLHttpRequest",
            "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
            "origin": "https://ar.akinator.com",
            "referer": "https://ar.akinator.com/game"
        }
    };

    // 🟢 START
    app.get("/api/akinator/start", async (req, res) => {
        try {
            const response = await axios.post(
                `${akinator.base}/game`,
                new URLSearchParams({
                    sid: "1",
                    cm: "false"
                }),
                { headers: akinator.headers }
            );

            const html = response.data;

            const session = html.match(/session', '(\d+)'/)?.[1];
            const signature = html.match(/signature', '([^']+)'/)?.[1];

            const cookies = response.headers["set-cookie"]
                ?.map(c => c.split(";")[0])
                .join("; ");

            res.json({
                status: true,
                result: {
                    question: "فكر في شخصية 🤔",
                    step: "0",
                    progression: "0",
                    session,
                    signature,
                    sid: "1",
                    cm: "false",
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


    // 🔴 ANSWER
    app.post("/api/akinator/answer", async (req, res) => {
        try {
            const {
                step,
                progression,
                answer,
                session,
                signature,
                cookies
            } = req.body;

            if (!session || !signature || !cookies) {
                return res.status(400).json({
                    status: false,
                    message: "❌ ناقص بيانات (session / signature / cookies)"
                });
            }

            const response = await axios.post(
                `${akinator.base}/answer`,
                new URLSearchParams({
                    step,
                    progression,
                    sid: "1",
                    cm: "false",
                    answer,
                    step_last_proposition: "",
                    session,
                    signature
                }),
                {
                    headers: {
                        ...akinator.headers,
                        cookie: cookies
                    }
                }
            );

            const data = response.data;

            res.json({
                status: true,
                result: {
                    question: data.question,
                    step: data.step,
                    progression: data.progression,
                    answers: data.trouvitudesReponses,
                    guess: data.name_proposition || null
                }
            });

        } catch (err) {
            res.status(500).json({
                status: false,
                error: err.response?.data || err.message
            });
        }
    });

};
