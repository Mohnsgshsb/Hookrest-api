const axios = require("axios");
const qs = require("querystring");

module.exports = function (app) {

    const BASE = "https://ar.akinator.com";

    const headers = {
        "user-agent": "Mozilla/5.0 (Linux; Android 10)",
        "accept": "text/html,application/xhtml+xml",
        "content-type": "application/x-www-form-urlencoded",
        "origin": BASE,
        "referer": BASE + "/theme-selection"
    };

    app.get("/api/akinator/start", async (req, res) => {
        try {

            const response = await axios.post(
                BASE + "/game",
                qs.stringify({
                    sid: "1",
                    cm: "false"
                }),
                {
                    headers,
                    timeout: 10000, // يمنع التعليق
                    validateStatus: () => true // يمنع Axios يرمي error
                }
            );

            // لو الموقع رفض
            if (response.status !== 200) {
                return res.json({
                    status: false,
                    creator: "TERBO-SPAM",
                    error: "Akinator blocked request (status " + response.status + ")"
                });
            }

            const cookies = (response.headers["set-cookie"] || []).join("; ");
            const html = response.data || "";

            // استخراج آمن بدون كراش
            const sessionMatch = html.match(/session', '(.+?)'/);
            const signatureMatch = html.match(/signature', '(.+?)'/);
            const questionMatch = html.match(/id="question-label">([^<]+)/);

            const session = sessionMatch ? sessionMatch[1] : null;
            const signature = signatureMatch ? signatureMatch[1] : null;
            const question = questionMatch ? questionMatch[1] : "❓ حصل مشكلة في استخراج السؤال";

            return res.json({
                status: true,
                creator: "TERBO-SPAM",
                result: {
                    question,
                    session,
                    signature,
                    step: "0",
                    progression: "0",
                    cookies
                }
            });

        } catch (err) {
            console.error("AKINATOR START ERROR:", err.message);

            return res.json({
                status: false,
                creator: "TERBO-SPAM",
                error: err.message
            });
        }
    });

};
