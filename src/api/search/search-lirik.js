const axios = require("axios");

module.exports = function (app) {

    app.get("/api/akinator/start", async (req, res) => {
        try {

            // 1️⃣ افتح اللعبة
            const { data, headers } = await axios.post(
                "https://ar.akinator.com/game",
                new URLSearchParams({ sid: "1", cm: "false" }),
                { headers: { "User-Agent": "Mozilla/5.0" } }
            );

            const cookies = headers["set-cookie"]
                ?.map(c => c.split(";")[0])
                .join("; ");

            const question = data.match(/id="question-label">(.+?)</)?.[1];

            // 2️⃣ bootstrap (زي الصورة)
            const { data: boot } = await axios.post(
                "https://ar.akinator.com/answer",
                `step=0&progression=0&sid=1&cm=false&answer=0&session=175&signature=7ZtV0mJ1D%2Ffpqw`, // حط القيم بتاعتك
                {
                    headers: {
                        "Content-Type": "application/x-www-form-urlencoded",
                        "X-Requested-With": "XMLHttpRequest",
                        "Cookie": cookies,
                        "User-Agent": "Mozilla/5.0"
                    }
                }
            );

            res.json({
                status: true,
                result: {
                    question: boot.question,
                    step: boot.step,
                    progression: boot.progression,
                    session: "175",
                    signature: "7ZtV0mJ1D/fpqw",
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
