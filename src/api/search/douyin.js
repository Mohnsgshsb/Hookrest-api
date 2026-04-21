const axios = require("axios");
const qs = require("querystring");

module.exports = function (app) {

    const BASE = "https://ar.akinator.com";

    // 🧠 سيشن واحدة للبوت
    let gameState = {
        session: null,
        signature: null,
        cookies: "",
        step: "0",
        progression: "0.00000"
    };

    const headers = (cookie = "") => ({
        "user-agent": "Mozilla/5.0 (Linux; Android 10)",
        "accept": "application/json, text/javascript, */*; q=0.01",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
        "x-requested-with": "XMLHttpRequest",
        "origin": BASE,
        "referer": BASE + "/game",
        "cookie": cookie
    });

    // 🔥 تحط بيانات start هنا مرة واحدة
    app.post("/api/akinator/set", (req, res) => {
        const { session, signature, cookies } = req.body;

        gameState = {
            session,
            signature,
            cookies,
            step: "0",
            progression: "0.00000"
        };

        res.json({
            status: true,
            message: "تم ضبط السيشن"
        });
    });

    // 🔥 ANSWER ENDPOINT
    app.get("/api/akinator/answer", async (req, res) => {
        try {

            const answer = req.query.answer;

            if (answer === undefined) {
                return res.json({
                    status: false,
                    message: "حط answer (0-4)"
                });
            }

            if (!gameState.session) {
                return res.json({
                    status: false,
                    message: "اعمل start الأول وبعدين set"
                });
            }

            const response = await axios.post(
                BASE + "/answer",
                qs.stringify({
                    step: gameState.step,
                    progression: gameState.progression,
                    sid: "1",
                    cm: "false",
                    answer: answer,
                    step_last_proposition: "",
                    session: gameState.session,
                    signature: gameState.signature
                }),
                {
                    headers: headers(gameState.cookies),
                    validateStatus: () => true
                }
            );

            const data = response.data;

            if (!data || data.completion === "KO") {
                return res.json({
                    status: false,
                    message: "Akinator رفض الطلب"
                });
            }

            // تحديث الحالة
            gameState.step = data.step;
            gameState.progression = data.progression;

            // 🎯 لو خمّن
            if (data.id_proposition) {
                return res.json({
                    status: true,
                    guess: true,
                    name: data.name_proposition,
                    description: data.description_proposition,
                    photo: data.photo
                });
            }

            // ❓ سؤال جديد
            return res.json({
                status: true,
                guess: false,
                question: data.question,
                answers: data.trouvitudesReponses,
                step: data.step,
                progression: data.progression
            });

        } catch (err) {
            console.error("ERROR:", err.message);

            res.json({
                status: false,
                error: err.message
            });
        }
    });

};
