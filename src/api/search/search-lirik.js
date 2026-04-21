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

    // 🔥 START ONLY
    app.get("/api/akinator/start", async (req, res) => {
        try {

            const response = await axios.post(
                BASE + "/game",
                qs.stringify({
                    sid: "1",
                    cm: "false"
                }),
                { headers }
            );

            const cookies = response.headers["set-cookie"]?.join("; ") || "";
            const html = response.data;

            // استخراج البيانات من الصفحة
            const session = html.match(/session', '(.+?)'/)?.[1];
            const signature = html.match(/signature', '(.+?)'/)?.[1];
            const question = html.match(/id="question-label">([^<]+)/)?.[1];

            res.json({
                status: true,
                creator: "TERBO-SPAM",
                result: {
                    question: question || "❓ مش لاقي السؤال",
                    session,
                    signature,
                    step: "0",
                    progression: "0",
                    cookies
                }
            });

        } catch (err) {
            res.status(500).json({
                status: false,
                creator: "TERBO-SPAM",
                error: err.message
            });
        }
    });

};ج                    guess: data.name_proposition || null
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
