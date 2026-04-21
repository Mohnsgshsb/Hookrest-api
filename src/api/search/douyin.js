const axios = require("axios");

module.exports = function (app) {

    app.get("/api/akinator/answer", async (req, res) => {
        try {

            const {
                answer,        // 0 = نعم / 1 = لا / 2 = لا اعلم / 3 = ممكن / 4 = غالباً لا
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
                        "User-Agent": "Mozilla/5.0 (Linux; Android 13; Mobile)",
                        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                        "Accept": "*/*",
                        "Origin": "https://ar.akinator.com",
                        "Referer": "https://ar.akinator.com/",
                        "X-Requested-With": "XMLHttpRequest",
                        "Cookie": cookies
                    }
                }
            );

            const data = response.data;

            // 📊 تحديث البيانات
            const nextStep = data?.parameters?.step;
            const nextProgression = data?.parameters?.progression;

            // 🎯 لو وصل للتخمين
            if (data?.parameters?.identification) {
                return res.json({
                    status: true,
                    guess: true,
                    result: {
                        name: data.parameters.identification.name,
                        description: data.parameters.identification.description,
                        image: data.parameters.identification.absolute_picture_path
                    }
                });
            }

            // ❓ استخراج السؤال الجديد
            const question = data?.parameters?.question;

            res.json({
                status: true,
                guess: false,
                result: {
                    question,
                    step: nextStep,
                    progression: nextProgression,
                    cookies
                }
            });

        } catch (err) {
            res.json({
                status: false,
                error: err.response?.status + " | " + JSON.stringify(err.response?.data) || err.message
            });
        }
    });

};
